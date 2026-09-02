# Rubbish Collection Points System

A Supabase-powered web application for tracking faction rubbish collection points and managing teacher accounts, badges, tags, and activity logs.

## Features

- Public home page with live faction point totals
- Teacher portal for adding, removing, and resetting faction points
- Profile editing with avatars, bios, tags, and badges
- Admin dashboard with tabbed navigation
- Member role management for admins, testers, and teachers
- Badge creation, deletion, and awarding
- Tag creation and deletion
- Searchable member list
- Filterable audit log with CSV export
- Automatic point refresh on public and teacher pages

## Pages

| Page | Purpose |
| --- | --- |
| `index.html` | Public faction scoreboard and login entry point |
| `login.html` | User authentication |
| `teacherpage.html` | Teacher point and profile management |
| `Admin.html` | Administrative management dashboard |
| `members.html` | Member listing |

## Requirements

- A modern web browser
- A Supabase project configured with the application tables
- Python 3.9+ and the packages in `server.py` if using the included server

## Running Locally

From the project directory, install the server dependencies:

```powershell
pip install -r requirements.txt
```

Start the local server:

```powershell
python server.py
```

Open `http://127.0.0.1:3000` in a browser.

The pages can also be served with another static web server, but opening them through HTTP is recommended for consistent authentication and asset loading.

## Deployment

The included server is ready for hosts such as Render, Railway, or any service that runs a Python web process. Use this start command:

```text
uvicorn server:app --host 0.0.0.0 --port $PORT
```

The server uses port `3000` locally and automatically uses the host-provided `PORT` value in deployment. The `GET /health` endpoint returns a JSON health response for hosting-service checks.

Set the deployment environment to Python 3.9 or newer and install dependencies with:

```text
pip install -r requirements.txt
```

## Supabase Tables

The application uses these tables:

- `profiles`
- `factions`
- `point_logs`
- `badges`
- `tags`
- `profile_badges`
- `profile_tags`

Authentication is handled through Supabase Auth. Row-level security policies should be configured so users can only perform the actions appropriate for their role.

## Project Files

- `main.js` handles the public scoreboard.
- `login.js` handles authentication.
- `teacher.js` handles teacher features and point updates.
- `Admin.js` handles administrator features.
- `server.py` serves the website and provides the deployment health endpoint.
- `requirements.txt` lists the FastAPI and Uvicorn server dependencies.

## License

Copyright (c) 2026 Ben Rodda @ PCACS  
All Rights Reserved.

Unauthorized copying, modification, distribution, or use of this software, via any medium, is strictly prohibited.
