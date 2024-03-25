import datetime
import json
import os
from argparse import ArgumentParser
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, Request, Response
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

import grapat.export
from grapat.db import db_execute, db_fetch_results

arg_parser = ArgumentParser()
arg_parser.add_argument("--root-path", default="", type=str, help="REST API hostname")
arg_parser.add_argument("--hostname", default="0.0.0.0", type=str, help="REST API hostname")
arg_parser.add_argument("--port", default=8080, type=int, help="REST API port")
arg_parser.add_argument("--reload", action="store_true", help="Reload service on file changes")
args = arg_parser.parse_args()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_execute("""  CREATE TABLE IF NOT EXISTS results (
                        `id` int(11), 
                        `username` text ,
                        `annotation_bundle` text , 
                        `sentence` text , 
                        `graph` longtext, 
                        `layout` longtext, 
                        `time` TIMESTAMP,
                        PRIMARY KEY (`id`))""")

    db_execute("""CREATE TABLE IF NOT EXISTS `users` (
                      `id` int(32),
                      `FirstName` varchar(128) DEFAULT NULL,
                      `LastName` varchar(128) DEFAULT NULL,
                      `UserName` varchar(128) DEFAULT NULL,
                      `Password` varchar(255) DEFAULT NULL,
                      PRIMARY KEY (`id`));
                    """)
    yield
    # something for shutdown


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
    username = data.get('username', "Default")
    # TODO get username from current session
    db_execute("INSERT INTO results(username, annotation_bundle, sentence, graph, layout, time) "
               "VALUES(?, ?, ?, ?, ?, ?) ;",
               (username, data['annotation_bundle'], data['sentence'], data['graph'], data['layout'],
                datetime.datetime.now()),
               commit=True)


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
