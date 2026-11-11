# Changelog

## 0.1.2 — November 11, 2026

- Fix replacement backups shadowing the live plugin: backups and staging now live under Hermes-home/plugin-backups, outside both scanned plugin directories.
- Add backend and Desktop replacement regressions verifying only the new install remains in the discovery root and the old files survive outside it.
- Host8 confirms 0.1.1 held three and then all eleven profile connections. No new per-profile server backends appeared; latency benefit and polling CPU attribution remain unmeasured. Release verification is pending.

## 0.1.1 â€” November 11, 2026

- Compact flame/ember dashboard redesign with a prominent red-orange keep-hot action next to selection and planning.
- Detect and explain when all listed profiles are already served by one shared gateway; do not imply separate cold backends or a measured speed benefit.
- Count all profiles served once, including the current profile; separate connection retention from gateway service and tool/session residency.
- Correct the earlier pool-setting premise: no configurable Desktop backend-pool limit was found on the tested v0.23.1 build; the reported value five remains unconfirmed.
- Label OS memory as the host/container view visible to the process when no finite cgroup limit is exposed, including lxcfs-backed LXC views.
- Label process measurements as the sampler's subtree and report enumeration failures, unreadable processes and truncation. The measured subtree is not total Hermes footprint.
- Document that Hermes enabling the tool can add hot_hermes to platform toolset lists.

## 0.1.0 â€” November 11, 2026

Initial experimental release. Passive monitoring, explicit Desktop socket retention, five/eight/custom/all selection, resource planning and before/after host-memory observation. Host8 CT114 installation and Windows Desktop installation passed; retention benefit remains unmeasured.
