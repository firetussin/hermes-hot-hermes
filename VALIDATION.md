# Hot Hermes 0.1.2 validation

Checked November 11, 2026. This is an experimental installation/test package. The prior 0.1.0 package was installed on CT114 and Windows Desktop by the maintenance agent. The new 0.1.1 package has not yet been installed there. No model call or speed benchmark was performed by this development session.

## Passed

- 15 Node behavior tests: planner arithmetic/unknowns/invalid inputs, connection-qualified identity, stale status, sequential acquisition, cancellation, late timeout cleanup, failed verification, replacement/disposal and before/after sample identity checks.
- 13 Python tests: cgroup v1/v2 memory ancestry, machine/container budgets, metadata output, tool registration, read-only FastAPI route, installer dry run, allowlisted copies, existing-install refusal and backup replacement.
- 14 browser checks against the real generated Desktop page using an offline synthetic SDK: passive monitoring does not wake profiles; preview five; explicit apply; connection verification; measured warm-up comparison; release; eight-profile request; disconnect demotion; narrow layout; Settings navigation; no browser runtime errors.
- JavaScript module syntax check and successful self-contained build.
- Hermes plugin doctor: no findings; one tool and no hooks registered.
- Hermes catalog validator: 16/16 checks, no warnings, safe security scan, no core overrides, public Desktop surface. Raw structured result is VALIDATION.json.

Hermes doctor/validator functions were loaded from the local source tree whose HEAD is `3b421578588243f920886e6fe79a6faa87ea026e`, using Python 3.13 and the existing runtime's dependency directory as a supplemental read path. HERMES_HOME was isolated to this workspace and bytecode writes were disabled for that validation. The packaged 3.14 interpreter could not execute under the sandbox permissions. These are real source-loaded admission checks, not a full target-runtime launch. Repeat admission checks on Host8.

## Visual inspection

Inspected the full Desktop fixture screenshot and tested a 760px layout for horizontal page overflow. Screenshots in preview/ are synthetic and visibly labelled. No real profile names or telemetry are embedded.

## Reproduce

```text
python tools/build.py
node --test tests/logic.test.mjs
python -m unittest discover -s tests -p "test_*.py" -v
```

For the optional synthetic browser check, use an existing local Node dependency directory containing React, React DOM, scheduler and esbuild, plus a preinstalled Playwright Chromium browser:

```text
python tools/build_preview.py --node-modules /path/to/existing/node_modules
python tests/browser_check.py
```

The preview builder copies those existing dependencies into .test-vendor for local fixture compilation only. No installer or network fetch is run. Vendor files and the large preview bundle are excluded from the distribution. To view preview/index.html, build the fixture bundle first.

## Required live acceptance

Follow INSTALL.md. Verify Desktop SDK route/retention support, the correct backend host, no unexpected wake on page open, behavior under real capacity limits, cleanup, actual switching latency and resource changes. No configurable pool-limit setting was found on the tested build; the earlier value five is unconfirmed. All-layer readiness and automatic capacity attribution remain unimplemented.

## Host8 feedback driving this release

v0.1.0 target installation/staging passed. Available memory and gateway RSS matched server observations. Feedback identified hidden primary actions, vertical sprawl, incorrect additional-profile wording, ambiguous process/container scope and a shared gateway already serving all profiles. The 0.1.1 release addresses those presentation/attribution findings and makes no new live speed claim.

0.1.2 adds replacement/discovery regression coverage. Host8 confirmed 0.1.1 Start with three and all eleven held connections; Release and latency/CPU A/B results are still pending.

The 0.1.2 replacement regression also ran Hermes' actual directory scanner after replacing a staged 0.1.1 manifest. Exactly one hot-hermes manifest was discovered, reporting 0.1.2. Backups remained outside the scanned directory.
