# Host8 / Desktop installation handoff

This is an experimental package. Read README.md limitations first. In particular, the tested v0.23.1 build has no configurable Desktop backend-pool limit; the earlier value five is unconfirmed.

## Before installation

Record the target Hermes version, installation type and active profile home (`hermes config path` identifies its config). Determine whether Host8 is the gateway server, the Desktop machine, or both. Do not assume `/root/.hermes` is the right destination. Preserve existing profiles and plugin data.

Extract the ZIP into a staging directory; do not extract over a live plugin. Run package checks in that staging directory. The offline installer defaults to a dry run and refuses an existing installation unless `--replace` is specified. Replacement keeps a timestamped directory backup.

## Backend on the Hermes server

Use the Python interpreter for this installation. Replace the explicit HOME path below with the verified profile home:

```sh
python tools/install.py --home /actual/hermes/home --part backend
python tools/install.py --home /actual/hermes/home --part backend --apply
hermes plugins enable hot-hermes
```

Run the local admission checks using the target Hermes runtime:

```sh
hermes plugins doctor /absolute/staging/hot-hermes --ci
hermes plugins validate /absolute/staging/hot-hermes
```

There are no declared new Python dependencies or downloads. psutil is optional and normally supplied by Hermes; absent metrics degrade to unknown. Do not pip-modify a shared managed environment to make metrics appear. Use the installation owner's dependency workflow if needed.

Restart/reload the gateway through its normal maintenance procedure if needed for registration. Coordinate with active work; the installer never restarts it. Test the tool `hot_hermes_status` or the authenticated plugin `/status` route through Hermes. It must report this server's memory, not the Desktop computer's memory.

## Desktop on the user's computer

Use that computer's Hermes home (often `%LOCALAPPDATA%/hermes` on Windows). The installer copies only the public-SDK Desktop page for this part:

```powershell
python tools/install.py --home "C:/actual/hermes/home" --part desktop
python tools/install.py --home "C:/actual/hermes/home" --part desktop --apply
```

Enable Hot Hermes in Capabilities → Plugins; reload Desktop plugins or reopen Desktop if the installed version requires it. The backend plugin must be enabled on the server connection you inspect. No plugin source is downloaded automatically.

## Compatibility and live smoke check

1. Verify the exact Settings label/key the user changed to five and whether it exists in this build. Record whether the supported SDK can read its saved/effective value. This is an outstanding integration requirement.
2. Open Hot Hermes without clicking Start. Profile inventory and current-source metrics should appear without starting cold profile backends. Unknown is valid when a signal is unavailable. Check server logs for unexpected work.
3. Verify exact connection-qualified routes. The same profile name on another host must not receive a request. If routes or retention API are unavailable, do not bypass the SDK.
4. Select two profiles first. Review the request, start it, switch between them and verify real responsiveness. Observe memory/CPU before and after. A row becoming ready proves a responding backend, not tools/session cache readiness.
5. Try five/eight only if capacity permits. Enter a resource assumption based on observation; the planner does not generate one automatically. Record failure if existing limits prevent the target.
6. Release the handles and disable the plugin. Active chats must continue. Test disconnect and plugin reload cleanup. Closing Desktop should release Desktop retention; it need not stop the server gateway.
7. Record actual version, source topology, screenshots, measured latencies and limitations. No performance gain has been established by the supplied synthetic tests.

## Update and rollback

Stop Hot Hermes retention before updating. Run the same installer with `--replace --apply` only after reviewing its dry-run output; it reports the backup path. Desktop and backend versions should match. To roll back, disable the plugin, preserve the new directory separately, restore the reported backup directory, and reload through Hermes normally. Removing Desktop retention is not a request to terminate active backends. The plugin writes no profile configuration and requires no database migration.

## Update from 0.1.0

Inspect the offline installer dry run, then use `--replace --apply` for both backend and Desktop pieces. Keep the timestamped backups. Verify the shared-gateway notice and red-orange primary action at your normal window size. The new process scope/coverage labels should explain that the sampler subtree may omit sibling services.

Enabling the tool caused Hermes to add `hot_hermes` to four platform toolset lists in the 0.1.0 Host8 test. Review those host-managed config changes during installation and rollback. The installer itself does not edit config.yaml.


## Replacement safety — 0.1.2

Backups and staging are now outside discovery directories, under `<home>/plugin-backups/`. Before updating an installation created by 0.1.0 or 0.1.1, inspect `plugins/` and `desktop-plugins/` for `hot-hermes.backup-*` directories. Preserve and move those old backups outside both scanned directories. Confirm `hermes plugins list` reports only the active 0.1.2 copy after the normal reload. New replacement installs do not create scanned backups.
