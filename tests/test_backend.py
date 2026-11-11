import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
def load(name,path,package=False):
    spec=importlib.util.spec_from_file_location(name,path,submodule_search_locations=[str(ROOT)] if package else None)
    mod=importlib.util.module_from_spec(spec);sys.modules[name]=mod;spec.loader.exec_module(mod);return mod
metrics=load('hot_resources_tests',ROOT/'resources.py')

class BackendTests(unittest.TestCase):
    def test_cgroup_bounds_available_and_total(self):
        self.assertEqual(metrics.memory_budget(1000,600,(800,500))['available_bytes'],300)
        self.assertEqual(metrics.memory_budget(1000,600,(800,900))['available_bytes'],0)
        self.assertEqual(metrics.memory_budget(1000,600)['scope'],'host/container view')
    def test_v2_ancestor_pressure(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);proc=root/'proc';mount=root/'cg';(proc/'self').mkdir(parents=True);(mount/'child').mkdir(parents=True)
            (proc/'self/cgroup').write_text('0::/child\n')
            for p,limit,used in [(mount,1000,950),(mount/'child',500,100)]:
                (p/'memory.max').write_text(str(limit));(p/'memory.current').write_text(str(used))
            self.assertEqual(metrics.cgroup_memory(proc,mount),(500,450))
    def test_v1_and_unlimited(self):
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp);(root/'proc/self').mkdir(parents=True);(root/'cg/memory').mkdir(parents=True)
            (root/'proc/self/cgroup').write_text('5:memory:/\n');(root/'cg/memory/memory.limit_in_bytes').write_text('500');(root/'cg/memory/memory.usage_in_bytes').write_text('100')
            self.assertEqual(metrics.cgroup_memory(root/'proc',root/'cg'),(500,100))
            (root/'cg/memory/memory.limit_in_bytes').write_text(str(2**63));self.assertIsNone(metrics.cgroup_memory(root/'proc',root/'cg'))
    def test_metrics_allowlist_no_paths_or_process_commandlines(self):
        result=metrics.snapshot();self.assertIn('sampled_at',result);json.dumps(result)
        for key in ['env','cmdline','hostname','username','prompt','token','home','profiles']:
            self.assertNotIn(key,result)
        if result['available']:
            self.assertGreaterEqual(result['memory']['available_bytes'],0);self.assertIsNone(result['cpu_percent_one_core'])
    def test_registration_is_readonly_tool(self):
        package=load('hot_package_test',ROOT/'__init__.py',True)
        class Ctx:
            def register_tool(self,**kw):self.tool=kw
        ctx=Ctx();package.register(ctx);self.assertEqual(ctx.tool['name'],'hot_hermes_status')
        self.assertIsInstance(json.loads(ctx.tool['handler']({})),dict)
    def test_sampler_tree_reports_partial_coverage_and_deduplicates(self):
        from types import SimpleNamespace
        class Error(Exception): pass
        ps=SimpleNamespace(Error=Error)
        class Process:
            def __init__(self,pid,fail=False): self.pid=pid;self.fail=fail
            def children(self,recursive): return [Process(2),Process(2),Process(3,True)]
            def cpu_times(self):
                if self.fail: raise Error()
                return SimpleNamespace(user=1,system=2)
            def memory_info(self): return SimpleNamespace(rss=100)
        rows,cpu,coverage=metrics.process_tree(Process(1),ps)
        self.assertEqual(len(rows),2);self.assertEqual(cpu,6)
        self.assertEqual(coverage['unreadable_processes'],1)
        self.assertEqual(coverage['scope'],'sampler subtree only')
        _,_,coverage=metrics.process_tree(Process(1),ps,1)
        self.assertTrue(coverage['truncated'])
    def test_sampler_enumeration_failure_is_visible(self):
        from types import SimpleNamespace
        class Error(Exception): pass
        class Process:
            pid=1
            def children(self,recursive): raise Error()
            def cpu_times(self): return SimpleNamespace(user=0,system=0)
            def memory_info(self): return SimpleNamespace(rss=100)
        rows,_,coverage=metrics.process_tree(Process(),SimpleNamespace(Error=Error))
        self.assertEqual(len(rows),1);self.assertTrue(coverage['children_query_failed'])
    def test_api_shared_namespace_has_no_mutating_route(self):
        from fastapi import FastAPI
        from fastapi.testclient import TestClient
        mod=load('hot_api_test',ROOT/'dashboard/plugin_api.py')
        app=FastAPI();app.include_router(mod.router,prefix='/api/plugins/hot-hermes')
        client=TestClient(app);response=client.get('/api/plugins/hot-hermes/status')
        self.assertEqual(response.status_code,200);self.assertEqual(response.json()['api'],1)
        self.assertEqual(client.post('/api/plugins/hot-hermes/status',json={}).status_code,405)

if __name__=='__main__':unittest.main()
