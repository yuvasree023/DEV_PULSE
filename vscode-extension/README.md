# DevPulse for VS Code

See your DevPulse engineering dashboard without leaving the editor.

## What it does

- Adds a **DevPulse** view to the Activity Bar showing your commits, pull requests, repositories, and AI-adoption stats from your own DevPulse backend.
- Signs in through your DevPulse backend with a GitHub Personal Access Token. The token is exchanged for a DevPulse session token, which is stored in VS Code SecretStorage. Your GitHub token itself is never stored by the extension.
- Read-only: the extension only calls GET endpoints after sign-in.

## Setup (from source)

1. `cd vscode-extension && npm install && npm run compile`
2. Press `F5` in VS Code to launch an Extension Development Host, or package with `npx vsce package` and install the `.vsix` via "Extensions: Install from VSIX...".
3. Set `devpulse.backendUrl` in Settings to your deployed DevPulse backend URL.
4. Run **DevPulse: Sign in with GitHub Token** from the Command Palette. Public repositories need no token scopes; for private repositories use a fine-grained token with read-only access to the repositories you choose.

## Notes

- Data shown is whatever your DevPulse backend has synced from GitHub. Public-only sign-in shows public repositories only.
- The extension does not collect or send telemetry anywhere except your own configured backend.
