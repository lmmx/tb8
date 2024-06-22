import os

import tubeulator as tube
from fastapi import FastAPI, Request
from pydantic import BaseModel

app = FastAPI()
port = int(os.environ.get("PORT", 4000))

lines = tube.load_lines()
lines_by_station = tube.load_lines_by_station()
stations = tube.load_stations()


class Response(BaseModel):
    query: str
    results: list[dict]


@app.get("/")
def read_root():
    return {"🚨": "It's time for the tubeulator"}


@app.get("/lines")
def read_lines(request: Request, query: str = "SELECT * FROM self;"):
    return Response(query=query, results=lines.sql(query).to_dicts())


@app.get("/lines-by-station")
def read_lines_by_station(request: Request, query: str = "SELECT * FROM self;"):
    return Response(query=query, results=lines_by_station.sql(query).to_dicts())


@app.get("/stations")
def read_stations(request: Request, query: str = "SELECT * FROM self;"):
    return Response(query=query, results=stations.sql(query).to_dicts())


def serve():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port)
