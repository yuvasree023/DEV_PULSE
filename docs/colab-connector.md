# Google Colab: explicit notebook intervals

This logger records elapsed notebook time, not focused coding time or AI usage. It sends no cells, outputs, filenames or code. Abrupt runtime loss cannot be reported reliably, so use an explicit stop call instead of atexit.

1. Sign in to [DevPulse](https://devpulse-app-snowy.vercel.app) with GitHub.
2. Open Connections and choose "Copy my dashboard session". This is a temporary DevPulse account session, not a GitHub PAT. It allows access to your account. Do not share it or paste it into source code or chat.
3. In Colab's Secrets panel, add `DEVPULSE_TOKEN` and enable access for this notebook. Refresh the secret from the dashboard if it expires.
4. Run this setup cell, then call `start()` before work and `stop()` when finished. A successful stop clears the interval, so calling it again does not duplicate the report. If sending fails, it keeps the same interval for a retry. A network timeout after the server accepts a request can still cause a duplicate on retry; verify your recent sessions first.

```python
import datetime, json, urllib.request
from google.colab import userdata

BACKEND_URL = "https://devpulse-backend-8mk1.onrender.com"
_interval = None

def start():
    global _interval
    if _interval is not None:
        raise RuntimeError("An interval is already open. Stop it first.")
    _interval = {"start": datetime.datetime.now(datetime.timezone.utc), "end": None}
    print("Notebook interval started. Call stop() when finished.")

def stop():
    global _interval
    if _interval is None:
        print("No open interval. Call start() first.")
        return
    if _interval["end"] is None:
        _interval["end"] = datetime.datetime.now(datetime.timezone.utc)
    begin, end = _interval["start"], _interval["end"]
    seconds = int((end - begin).total_seconds())
    if seconds > 86400:
        raise RuntimeError("Interval exceeds 24 hours. Do not report a stale runtime.")
    payload = {"sessions": [{"project": "colab-notebook", "language": "python",
        "editor": "colab", "started_at": begin.isoformat(), "ended_at": end.isoformat(),
        "duration_seconds": seconds}]}
    req = urllib.request.Request(BACKEND_URL + "/api/activity/sessions",
        data=json.dumps(payload).encode(), headers={"Authorization": "Bearer " + userdata.get("DEVPULSE_TOKEN"),
        "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=90) as response:
        result = json.load(response)
    if result.get("accepted") != 1:
        raise RuntimeError("The server did not confirm the interval. Check your dashboard.")
    _interval = None
    print("One notebook interval received. Refresh your DevPulse workspace.")
```

The extension and notebook logger use the same authenticated, per-user activity API. Notebook duration and editor focus are separate kinds of observations; neither measures the productivity of Antigravity or another AI agent. This code does not connect your Google account to DevPulse. No paid API or billing card is needed.
