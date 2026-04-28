# PYQ Finder

A FastAPI website for browsing and downloading previous year question papers from an FTP-backed archive.

The app keeps browsing fast by indexing the FTP file tree into SQLite. Downloads are served from local disk when a file exists in `data/papers`, otherwise the file is fetched from FTP on demand.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

## Build the Index

```powershell
python sync_ftp.py
```

The default FTP settings use anonymous access to `103.220.82.76:21`.
If directory listing stalls on your network, try changing `FTP_PASSIVE` in `.env`.

If you change the metadata parser but do not need to rescan FTP, rebuild labels from the saved paths:

```powershell
python rebuild_metadata.py
```

## Run Locally

```powershell
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`.

API docs are available at `http://127.0.0.1:8000/docs`.

## Deploy on Railway

This repo includes `railway.json`, so Railway starts the app with:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Before deploying:

1. Make sure `data/papers.db` exists locally.
2. Run `python rebuild_metadata.py` if parser labels changed.
3. Commit the repo, including `data/papers.db`.
4. Push to GitHub.
5. In Railway, create a new project from the GitHub repo.
6. Add these service variables if needed:

```env
APP_NAME=PYQ Finder
DATABASE_PATH=data/papers.db
PAPERS_DIR=data/papers
FTP_HOST=103.220.82.76
FTP_PORT=21
FTP_USER=anonymous
FTP_PASSWORD=
FTP_ROOT=/
FTP_TIMEOUT=60
FTP_PASSIVE=true
FTP_ENCODING=cp1252
FTP_USE_MLSD=false
FTP_RETRIES=2
FTP_TRY_ALTERNATE_MODE=true
```

After the first successful deploy, open the service settings and generate a public domain.

## Structure

```text
app/
  main.py              FastAPI entrypoint
  database.py          SQLite schema and queries
  config.py            Environment-based settings
  routers/             Page and API routes
  sync/ftp_sync.py     FTP traversal, metadata inference, file fetching
static/                CSS and browser JavaScript
templates/             Jinja2 pages
data/                  SQLite database and optional local PDFs
```
