from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates

from app.config import ROOT_DIR


router = APIRouter(tags=["pages"])
templates = Jinja2Templates(directory=ROOT_DIR / "templates")


@router.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@router.get("/browse", response_class=HTMLResponse)
def browse(request: Request):
    return templates.TemplateResponse("browse.html", {"request": request})
