# Nifty Site Template

The shared "framework" code every Nifty client site runs. The dashboard's
**Site Updates** page reads `framework/manifest.json` and pushes these files to
every client site repo at once, so a capability update reaches all sites with
one click.

- `framework/manifest.json` — version + the list of shared files.
- `framework/<path>` — the canonical copy of each shared file.

To ship an update: replace the changed files here, bump `version`, push, then
click **Update all sites** in the dashboard.
