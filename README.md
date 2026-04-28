# PYQ Finder

FastAPI website for browsing and downloading previous year question papers from an FTP-backed archive.

The app keeps browsing fast by indexing the FTP file tree into SQLite. The PDF list is served from `data/papers.db`; downloads are fetched from FTP on demand unless a file is cached locally in `data/papers/`.

## Features

- Browse by course, branch, exam category, session, semester, and year
- Search by paper name, branch, year, semester, or original FTP path
- Fast SQLite-backed listing
- Direct PDF download endpoint
- Responsive HTML/CSS/JS frontend
- FastAPI docs at `/docs`
- Railway-ready deployment config

## Project Structure

```text
pyq-site/
  app/
    main.py              FastAPI app entrypoint
    config.py            Environment settings
    database.py          SQLite schema and queries
    models.py            API response models
    routers/
      pages.py           HTML page routes
      papers.py          API and download routes
    sync/
      ftp_sync.py        FTP traversal and metadata parser
  data/
    papers.db            SQLite paper index, committed for deployment
    papers/              Optional local PDF cache, not committed
  docs/
    implementation-plan.txt
  static/
    css/style.css
    js/app.js
  templates/
    base.html
    index.html
    browse.html
  rebuild_metadata.py    Rebuild labels from saved FTP paths
  sync_ftp.py            Rescan FTP and update SQLite
  railway.json           Railway start/healthcheck config
  runtime.txt            Python runtime hint
  requirements.txt
```

## Local Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

## Build Or Refresh The Index

Run this when you need to rescan the FTP server:

```powershell
python sync_ftp.py
```

Run this when you changed only the metadata parser and want to update labels from existing paths:

```powershell
python rebuild_metadata.py
```

## Run Locally

```powershell
python -m uvicorn app.main:app --reload
```

Open:

```text
http://127.0.0.1:8000
```

## Git Push Checklist

These should be committed:

- `app/`
- `static/`
- `templates/`
- `data/papers.db`
- `data/papers/.gitkeep`
- `docs/`
- `.env.example`
- `.gitignore`
- `README.md`
- `railway.json`
- `runtime.txt`
- `requirements.txt`
- `sync_ftp.py`
- `rebuild_metadata.py`

These should not be committed:

- `.env`
- `.venv/`
- `__pycache__/`
- `*.log`
- downloaded PDFs in `data/papers/`

Push commands:

```powershell
git status --short
git add .
git commit -m "Prepare PYQ Finder for Railway deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

If the remote already exists, skip `git remote add origin` or update it:

```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
```

## Deploy On Railway

This repo includes `railway.json`. Railway will run:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Railway steps:

1. Create a new Railway project.
2. Choose Deploy from GitHub repo.
3. Select this repository.
4. Wait for the deployment to finish.
5. Open the service Networking settings.
6. Generate a public domain.

Optional Railway variables:

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
