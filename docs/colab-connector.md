# Optional: log Google Colab sessions to DevPulse

DevPulse can record Colab notebook sessions alongside your editor activity.
This is optional; the dashboard works without it.

## Setup

1. In the DevPulse dashboard, create a session token (PAT) for the activity API.
2. In a Colab notebook, run the cell below once per session. Set `BACKEND_URL`
   to your deployed backend and paste your token.

```python
import getpass, datetime, json, urllib.request, atexit

BACKEND_URL = "https://YOUR-BACKEND.onrender.com"  # no trailing slash
TOKEN = getpass.getpass("DevPulse session token: ")

start = datetime.datetime.now(datetime.timezone.utc)

def log_session():
    end = datetime.datetime.now(datetime.timezone.utc)
    payload = json.dumps({
        "sessions": [{
            "project": "colab-notebook",
            "language": "python",
            "editor": "colab",
            "started_at": start.isoformat(),
            "ended_at": end.isoformat(),
            "duration_seconds": int((end - start).total_seconds()),
        }]
    }).encode()
    req = urllib.request.Request(
        f"{BACKEND_URL}/api/activity/sessions",
        data=payload,
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"},
    )
    print("DevPulse:", urllib.request.urlopen(req).status)

atexit.register(log_session)  # or call log_session() manually when you finish
```

## Limitations and token hygiene

- `atexit` runs only when the Python kernel exits cleanly. Colab runtimes that are
  stopped, recycled, or time out may never fire it, so durations are best-effort,
  not reliable telemetry. For an exact record, call `log_session()` manually in
  the last cell.
- Never paste your token directly into a notebook cell: notebooks get shared and
  saved to Drive. The snippet uses `getpass`, which hides what you type. Colab's
  built-in Secrets panel (key icon in the left sidebar) works too - read it with
  `from google.colab import userdata; TOKEN = userdata.get('DEVPULSE_TOKEN')`.

## What it sends

Only session metadata: a fixed project label, the language, the editor name, and
start/end times. It never sends cell contents, file names, or outputs.
