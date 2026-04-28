from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.config import ROOT_DIR, get_settings
from app.database import init_db
from app.routers import pages, papers


@asynccontextmanager
async def lifespan(app: FastAPI):
    get_settings().ensure_paths()
    init_db()
    yield


app = FastAPI(
    title="Previous Year Paper Finder",
    description="Searchable index for college previous year question papers.",
    version="0.1.0",
    lifespan=lifespan,
)

app.mount("/static", StaticFiles(directory=ROOT_DIR / "static"), name="static")
app.include_router(pages.router)
app.include_router(papers.router)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
