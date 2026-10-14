# DevPulse editor activity

Install the latest `.vsix` from the repository Releases page using VS Code's Extensions menu > Install from VSIX. Default backend: https://devpulse-backend-8mk1.onrender.com.

Sign in to https://devpulse-app-snowy.vercel.app with GitHub, open Connections and copy your dashboard session. In VS Code run **DevPulse: Connect Dashboard Session** and paste it into the hidden prompt. Do not put tokens in settings, source code or chat. The session is stored with VS Code SecretStorage. Reconnect when it expires. No GitHub PAT is required.

Tracking begins after connecting. Edit in a project for at least 10 seconds, then run **DevPulse: Send Activity Now** and refresh the dashboard to confirm receipt. The extension excludes intervals after 120 seconds without activity. It records folder name, language, editor name and timings, not code or full paths. Session metadata queues locally while offline. Pause from the status bar; sign out to stop and clear the local queue. Never reuse a queued profile for another account.

This is editor activity, not proof of AI use or productivity. Google's Antigravity extension can run in VS Code according to its official docs; DevPulse cannot identify agent runs. Standalone Antigravity IDE compatibility is untested.

Build: `npm install && npm run compile && npx @vscode/vsce package`. No Marketplace publication is implied.
