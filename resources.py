"""Bounded, metadata-only metrics. No command lines, credentials or transcripts."""
from __future__ import annotations
import hashlib
import os
import platform
import threading
import time
from pathlib import Path

_LOCK = threading.Lock()
_LAST = None
_CACHED = None


def cgroup_memory(proc=Path("/proc"), mount=Path("/sys/fs/cgroup")):
    """Resolve v2 ancestry and v1 memory hierarchy; smallest finite ancestor wins."""
    candidates = []
    try:
        for line in (proc / "self/cgroup").read_text().splitlines():
            _, controllers, relative = line.split(":", 2)
            if controllers == "":
                base, names = mount, ("memory.max", "memory.current")
            elif "memory" in controllers.split(","):
                base, names = mount / "memory", ("memory.limit_in_bytes", "memory.usage_in_bytes")
            else:
                continue
            # Container cgroup namespaces can expose / even when the host path differs.
            relative_parts = Path(relative.lstrip("/")).parts
            if ".." in relative_parts:
                continue
            leaf = base.joinpath(*relative_parts)
            for folder in (leaf, *leaf.parents):
                if folder != base and base not in folder.parents:
                    continue
                try:
                    raw = (folder / names[0]).read_text().strip()
                    limit = int(raw) if raw != "max" else 0
                    current = int((folder / names[1]).read_text().strip())
                    if 0 < limit < 2**60 and current >= 0:
                        candidates.append((limit, current))
                except (OSError, ValueError):
                    pass
    except (OSError, ValueError):
        pass
    if not candidates:
        return None
    limit = min(x[0] for x in candidates)
    available = min(max(0, cap-used) for cap, used in candidates)
    return limit, max(0, limit-available)


def memory_budget(total, available, group=None):
    result = {"total_bytes": total, "available_bytes": available, "scope": "host/container view", "measurement": "OS memory visible to this process"}
    if group:
        limit, used = group
        result = {"total_bytes": min(total, limit),
                  "available_bytes": max(0, min(available, limit-used)),
                  "scope": "container/cgroup", "cgroup_limit_bytes": limit,
                  "cgroup_used_bytes": used}
    return result


def process_tree(current, psutil_module, limit=256):
    """Report coverage rather than implying this sampler owns every Hermes process."""
    coverage = {"scope": "sampler subtree only", "child_limit": limit,
                "children_query_failed": False, "truncated": False,
                "discovered_children": None, "unreadable_processes": 0}
    children = []
    try:
        found = current.children(recursive=True)
        coverage["discovered_children"] = len(found)
        coverage["truncated"] = len(found) > limit
        children = found[:limit]
    except psutil_module.Error:
        coverage["children_query_failed"] = True
    seen, rows, cpu_total = set(), [], 0.0
    for process in [current, *children]:
        if process.pid in seen:
            continue
        seen.add(process.pid)
        try:
            cpu = process.cpu_times()
            mem = process.memory_info()
            cpu_total += cpu.user + cpu.system
            rows.append({"pid": process.pid, "rss_bytes": mem.rss})
        except (psutil_module.Error, OSError):
            coverage["unreadable_processes"] += 1
    coverage["sampled_processes"] = len(rows)
    return rows, cpu_total, coverage


def snapshot():
    global _LAST, _CACHED
    with _LOCK:
        now = time.monotonic()
        if _CACHED and now-_CACHED[0] < 2:
            return dict(_CACHED[1])
        try:
            import psutil
        except ImportError:
            return {"api": 1, "version": "0.1.2", "sampled_at": time.time(),
                    "available": False, "reason": "psutil is unavailable in this Hermes runtime; no dependency was installed."}
        try:
            current = psutil.Process()
            rows, cpu_total, coverage = process_tree(current, psutil)
            elapsed = now-_LAST[0] if _LAST else None
            cpu_pct = max(0, (cpu_total-_LAST[1])/elapsed*100) if elapsed and elapsed > 0 else None
            _LAST = (now, cpu_total)
            memory = psutil.virtual_memory()
            budget = memory_budget(memory.total, memory.available,
                                   cgroup_memory() if platform.system() == "Linux" else None)
            # Hash only a machine identifier. No raw hostname, address or paths in output.
            host_id = hashlib.sha256(platform.node().encode()).hexdigest()[:16]
            result = {"api": 1, "version": "0.1.2", "available": True,
                      "host_id": host_id, "sampled_at": time.time(), "pid": os.getpid(),
                      "memory": budget, "backend_tree_rss_bytes": sum(x["rss_bytes"] for x in rows),
                      "process_count": len(rows), "tree_scan_limit": 256,
                      "process_scope": "sampler subtree only", "process_tree_coverage": coverage,
                      "sampler_parent_pid": current.ppid(),
                      "cpu_percent_one_core": cpu_pct, "cpu_sample_seconds": elapsed,
                      "logical_cpus": psutil.cpu_count(),
                      "limitations": ["RSS sums can double-count shared pages.",
                                      "Sampler subtree only: other Hermes processes and sidecars may be outside this tree. This is not total Hermes RAM or a per-profile allocation.",
                                      "CPU is sampled backend-tree activity, not a prediction of idle CPU."]}
        except (psutil.Error, OSError, ValueError):
            result = {"api": 1, "version": "0.1.2", "sampled_at": time.time(),
                      "available": False, "reason": "Host metrics are unavailable to this process."}
        _CACHED = (now, result)
        return dict(result)
