import os
import sqlite3
from argparse import ArgumentParser
from datetime import timedelta

import uvicorn
from fastapi import FastAPI, Request, Depends, Response
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi_login import LoginManager
from fastapi_login.exceptions import InvalidCredentialsException

arg_parser = ArgumentParser()
arg_parser.add_argument("--root-path", default="", type=str, help="REST API hostname")
arg_parser.add_argument("--hostname", default="0.0.0.0", type=str, help="REST API hostname")
arg_parser.add_argument("--port", default=8080, type=int, help="REST API port")
arg_parser.add_argument("--reload", action="store_true", help="Reload service on file changes")
args = arg_parser.parse_args()

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

SECRET = "super-secret-key"
manager = LoginManager(
    SECRET,
    "/login",
    use_cookie=True,
    cookie_name='grapat-login'
)

DB = {"users": {"john": {"name": "John Doe", "password": "hunter2"}}}


def get_db_conn():
    con = sqlite3.connect("grapat.db")
    return con.cursor()

@app.on_event("startup")
async def startup_event():
    # init db
    db_cur = get_db_conn()
    db_cur.execute("""  CREATE TABLE IF NOT EXISTS results (
                        `id` int(11), 
                        `username` text , 
                        `annotation_bundle` text , 
                        `sentence` text , 
                        `graph` longtext, 
                        `layout` longtext, 
                        `time` TIMESTAMP,
                        PRIMARY KEY (`id`))""")

    db_cur.execute("""CREATE TABLE IF NOT EXISTS `users` (
                      `id` int(32),
                      `FirstName` varchar(128) DEFAULT NULL,
                      `LastName` varchar(128) DEFAULT NULL,
                      `UserName` varchar(128) DEFAULT NULL,
                      `Password` varchar(255) DEFAULT NULL,
                      PRIMARY KEY (`id`));
                    """)


@manager.user_loader()
def query_user(user_id: str):
    """
    Get a user from the db
    :param user_id: E-Mail of the user
    :return: None or the user object
    """
    return DB["users"].get(user_id)


@app.post("/login")
def login(response: Response, data: OAuth2PasswordRequestForm = Depends()):
    email = data.username
    password = data.password

    user = query_user(email)
    if not user:
        # you can return any response or error of your choice
        return None
    elif password != user["password"]:
        raise InvalidCredentialsException

    access_token = manager.create_access_token(data={"sub": email}, expires=timedelta(hours=12))
    manager.set_cookie(response, access_token)
    return response


@app.get("/resources", tags=["api"])
async def get_resources(request: Request):
    return enumerate(os.listdir('static/data'))


@app.get("/resources/{fname}", tags=["api"])
async def get_resource(fname, request: Request):
    data = open(os.path.join('static/data/', fname)).read()
    return Response(content=data, media_type="application/xml")


@app.get("/Loader", tags=["api"])
async def load_from_db(bundle_id: str, sentence_id: str, request: Request):
    return {
        'graph': None,
        'layout': None
    }


@app.post("/GraPAT", tags=["api"])
async def post_grapat(request: Request):
    return {
        'graph': None,
        'layout': None
    }


@app.get("/", tags=["templates"], response_class=HTMLResponse)
@app.get("/index", tags=["templates"], response_class=HTMLResponse)
async def get_main_page(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/grapat", tags=["templates"], response_class=HTMLResponse)
async def get_view_page(request: Request, user=Depends(manager.optional)):
    if user is None:
        return templates.TemplateResponse("grapat.html", {"request": request})
    else:
        return templates.TemplateResponse("grapat.html", {"request": request})


@app.get("/login", tags=["templates"], response_class=HTMLResponse)
async def get_parser_view_page(request: Request):
    return templates.TemplateResponse("login.html", {"request": request})


if __name__ == '__main__':
    uvicorn.run("app:app", host=args.hostname, port=args.port, log_level="debug", reload=args.reload,
                root_path=args.root_path)
