import test from 'node:test';
import assert from 'node:assert/strict';
import {routeKey,planCapacity,compareWarmup,gatewayTopology,monitorRows,RetentionController} from '../src/logic.mjs';
const r=n=>({connectionId:'host-a',profile:n,targetProfile:n});
const profiles=['a','b','c'].map(n=>({name:n,key:routeKey(r(n))}));
const keys=profiles.map(p=>p.key);
const makePlan=extra=>planCapacity({profiles,selected:keys,observedReady:[keys[0]],resources:{memory:{total_bytes:1000*1048576,available_bytes:600*1048576}},lowMB:100,highMB:200,reservePercent:20,...extra});
test('additional allocation excludes observed ready; reserve counted once',()=>{
 const p=makePlan();assert.equal(p.additional,2);assert.equal(p.estimate.additional_high_bytes,400*1048576);assert.equal(p.estimate.available_after_reserve_bytes,400*1048576);assert.equal(p.estimate.fits,'within assumption');
});
test('unknown metrics and missing range never invent capacity',()=>{assert.equal(makePlan({resources:null}).estimate.fits,'unknown');assert.equal(makePlan({lowMB:null}).estimate,null);});
test('invalid numbers are not accepted as usable estimates',()=>{for(const lowMB of [NaN,Infinity,-2,'2'])assert.equal(makePlan({lowMB}).estimate,null);assert.equal(makePlan({lowMB:300,highMB:200}).estimate,null);});
test('reject foreign/duplicate selection and invalid reserve',()=>{assert.throws(()=>makePlan({selected:['other']}));assert.throws(()=>makePlan({selected:[keys[0],keys[0]]}));assert.throws(()=>makePlan({reservePercent:81}));});
test('over budget and uncertain estimates remain distinct',()=>{assert.equal(makePlan({lowMB:300,highMB:400}).estimate.fits,'over budget');assert.equal(makePlan({lowMB:100,highMB:300}).estimate.fits,'uncertain');});
test('same profile names across hosts have distinct identity',()=>assert.notEqual(routeKey(r('a')),routeKey({...r('a'),connectionId:'host-b'})));
test('stale, disconnected and merely listed profiles never become ready',()=>{
 const status={gateway_running:true,gateway_state:'running',gateway_shared_with:['a']};
 assert.equal(monitorRows(profiles,status,true)[0].backend,'served');
 assert.equal(monitorRows(profiles,status,false)[0].backend,'unknown');
 assert.equal(monitorRows(profiles,{...status,gateway_heartbeat_stale_s:1},true)[0].backend,'unknown');
 assert.equal(monitorRows(profiles,status,true)[1].backend,'unknown');
 assert.equal(monitorRows(profiles,status,true,{[keys[0]]:{state:'ready',checkedAt:1,retained:true}},50000)[0].backend,'served');
});
test('acquire sequentially; verify metadata; release once on stop',async()=>{
 let inFlight=0,max=0,released=0,probes=0;
 const c=new RetentionController({acquire:async()=>{inFlight++;max=Math.max(max,inFlight);await new Promise(r=>setTimeout(r,2));inFlight--;return()=>released++;},probe:async()=>{probes++;}});
 await c.start([r('a'),r('b')]);assert.equal(max,1);assert.equal(probes,2);assert.equal(c.states[keys[0]].state,'ready');c.stop();c.stop();assert.equal(released,2);
});
test('cancel during acquisition releases late handle without probing',async()=>{
 let finish,released=0,probes=0;
 const c=new RetentionController({acquire:()=>new Promise(r=>finish=r),probe:async()=>probes++});
 const pending=c.start([r('a')]);c.stop();finish(()=>released++);await pending;assert.equal(released,1);assert.equal(probes,0);assert.deepEqual(c.states,{});
});
test('timed-out acquisition releases late handles',async()=>{
 let finish,released=0;const c=new RetentionController({timeoutMs:5,acquire:()=>new Promise(r=>finish=r),probe:async()=>{}});
 await c.start([r('a')]);assert.equal(c.states[keys[0]].state,'failed');finish(()=>released++);await new Promise(r=>setTimeout(r,10));assert.equal(released,1);c.dispose();
});
test('probe failure releases lease, prevents future automatic probes',async()=>{
 let released=0,probes=0;const c=new RetentionController({acquire:async()=>()=>released++,probe:async()=>{probes++;throw new Error('offline');}});
 await c.start([r('a')]);await c.verify();assert.equal(released,1);assert.equal(probes,1);assert.equal(c.states[keys[0]].retained,false);
});
test('disconnect on verification releases handle and does not retry',async()=>{
 let fail=false,released=0,probes=0;const c=new RetentionController({acquire:async()=>()=>released++,probe:async()=>{probes++;if(fail)throw new Error('offline');}});
 await c.start([r('a')]);fail=true;await c.verify();await c.verify();assert.equal(released,1);assert.equal(probes,2);assert.equal(c.states[keys[0]].state,'failed');
});
test('replacing selection releases earlier lease and disposal clears all',async()=>{
 let released=0;const c=new RetentionController({acquire:async()=>()=>released++,probe:async()=>{}});
 await c.start([r('a')]);await c.start([r('b')]);assert.equal(released,1);c.dispose();assert.equal(released,2);await assert.rejects(()=>c.start([r('a')]));
});

test('warm-up comparison rejects stale or different-host samples and preserves negative deltas',()=>{
 const before={available:true,host_id:'host',sampled_at:1,memory:{scope:'machine',total_bytes:10000000,available_bytes:8000000}};
 const after={...before,sampled_at:2,memory:{...before.memory,available_bytes:6000000}};
 assert.equal(compareWarmup(before,after,2,4).host_memory_change_bytes,2000000);
 assert.equal(compareWarmup(before,{...after,host_id:'other'},2,4),null);
 assert.equal(compareWarmup(before,before,2,4),null);
 assert.equal(compareWarmup(before,after,0,4),null);
 assert.equal(compareWarmup(after,{...before,sampled_at:3},2,4).observed_average_mib,null);
});

test('shared gateway counts all served profiles once, including retained rows',()=>{
 const status={gateway_running:true,gateway_state:'running',gateway_shared_with:['a','b','c','c']};
 assert.deepEqual(gatewayTopology(profiles,status,true),{served:3,allShared:true});
 assert.deepEqual(gatewayTopology(profiles,{...status,gateway_heartbeat_stale_s:2},true),{served:0,allShared:false});
 assert.deepEqual(gatewayTopology(profiles,status,false),{served:0,allShared:false});
 assert.deepEqual(gatewayTopology(profiles,{...status,gateway_shared_with:['a']},true),{served:1,allShared:false});
 assert.deepEqual(gatewayTopology([],status,true),{served:0,allShared:false});
});
