import datetime
import json
import os
from argparse import ArgumentParser
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Response, UploadFile, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import grapat.export
from grapat.convert import convert
from grapat.db import db_execute, db_fetch_results

arg_parser = ArgumentParser()
arg_parser.add_argument("--root-path", default="", type=str, help="REST API hostname")
arg_parser.add_argument("--hostname", default="0.0.0.0", type=str, help="REST API hostname")
arg_parser.add_argument("--port", default=8080, type=int, help="REST API port")
arg_parser.add_argument("--reload", action="store_true", help="Reload service on file changes")
args = arg_parser.parse_args()


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("db", exist_ok=True)
    db_execute("""  CREATE TABLE IF NOT EXISTS results (
                        `username` text ,
                        `annotation_bundle` text , 
                        `sentence` text , 
                        `graph` longtext, 
                        `layout` longtext, 
                        `time` TIMESTAMP
                        );""")

    db_execute("""CREATE TABLE IF NOT EXISTS `users` (
                      `firstname` varchar(128) DEFAULT NULL,
                      `lastname` varchar(128) DEFAULT NULL,
                      `username` varchar(128) DEFAULT NULL
                    );
                    """)
    yield
    # something for shutdown
    grapat.export.export_db()


app = FastAPI(lifespan=lifespan)
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.get("/resources", tags=["api"])
async def get_resources(request: Request):
    return enumerate(os.listdir('static/data'))


@app.get("/resources/{fname}", tags=["api"])
async def get_resource(fname, request: Request):
    data = open(os.path.join('static/data/', fname)).read()
    return Response(content=data, media_type="application/xml")


@app.get("/users", tags=["api"])
async def get_resources(request: Request):
    users = db_fetch_results("SELECT firstname, lastname, username FROM users;")
    return [{'firstname': u[0], 'lastname': u[1], 'username': u[2]} for u in users]


@app.post("/users", tags=["api"])
async def get_resources(request: Request):
    data = dict(await request.form())
    if not data['firstname'] or not data['lastname'] or not data['username']:
        return HTTPException(status_code=404, detail="Item empty")
    db_execute("INSERT INTO users(firstname, lastname, username) "
               "VALUES(?, ?, ?) ;",
               (data['firstname'], data['lastname'], data['username']),
               commit=True)


@app.get("/grapat", tags=["api"])
async def load_from_db(bundle_id: str, sentence_id: str, username: str = "Default"):
    """
    Load annotations from DB
    """
    results = db_fetch_results(
        "SELECT graph, time, layout FROM results WHERE username=? AND annotation_bundle=? AND sentence=?",
        (username, bundle_id, sentence_id)
    )
    if results:
        results.sort(key=lambda row: row[1], reverse=True)
        graph, _, layout = results[0]
        graph = json.loads(graph)
        layout = json.loads(layout)
    else:
        graph, layout = None, None
    return {
        'graph': graph,
        'layout': layout
    }


# TODO fix: request object raises error
# class GrapatRequest(BaseModel):
#     annotation_bundle: str
#     sentence: str
#     layout: str
#     graph: str
#     annotator: str
#

@app.post("/grapat", tags=["api"])
async def post_grapat(r: Request):
    """
    Save annotations into DB
    """
    data = dict(await r.form())
    if not data['graph']:
        return {}
    username = data.get('annotator', "default")
    # TODO get username from current session
    db_execute("INSERT INTO results(username, annotation_bundle, sentence, graph, layout, time) "
               "VALUES(?, ?, ?, ?, ?, ?) ;",
               (username, data['annotation_bundle'], data['sentence'], data['graph'], data['layout'],
                datetime.datetime.now()),
               commit=True)


@app.post("/grapat/add", tags=["api"])
async def uploade_new_documents(files: list[UploadFile]):
    for file in files:
        contents = await file.read()
        convert(file.filename, contents.decode())


@app.post("/grapat/export", tags=["api"])
async def export_db(r: Request):
    """
    Export annotations into DB
    """
    grapat.export.export_db()


@app.get("/", tags=["templates"], response_class=HTMLResponse)
async def get_main_page(request: Request):
    return templates.TemplateResponse("grapat.html", {"request": request})


if __name__ == '__main__':
    uvicorn.run("app:app", host=args.hostname, port=args.port, log_level="debug", reload=args.reload,
                root_path=args.root_path)
