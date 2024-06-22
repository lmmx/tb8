import os
from datetime import datetime, timedelta, timezone

import tubeulator as tube
from fastapi import FastAPI, Request
from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, model_validator

app = FastAPI()
port = int(os.environ.get("PORT", 4000))

lines = tube.load_lines()
lines_by_station = tube.load_lines_by_station()
stations = tube.load_stations()


def time_now() -> AwareDatetime:
    return datetime.utcnow().replace(tzinfo=timezone.utc)


class MetaData(BaseModel):
    model_config = ConfigDict(ser_json_timedelta="float")
    request_time: AwareDatetime
    response_time: AwareDatetime
    response_latency: timedelta
    query: str

    @model_validator(mode="before")
    @classmethod
    def calculate_duration(cls, data: dict) -> dict:
        request_time = data.get("request_time")
        if request_time:
            data["response_time"] = time_now()
            data["response_latency"] = data["response_time"] - request_time
        return data


class Response(BaseModel):
    context: MetaData
    results: list[dict]


@app.get("/")
def read_root():
    return {"🚨": "It's time for the tubeulator"}


@app.get("/lines")
def read_lines(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = lines.sql(query).to_dicts()
    ctx = MetaData(request_time=received, query=query)
    return Response(context=ctx, results=results)


@app.get("/lines-by-station")
def read_lines_by_station(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = lines_by_station.sql(query).to_dicts()
    ctx = MetaData(request_time=received, query=query)
    return Response(context=ctx, results=results)


@app.get("/stations")
def read_stations(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = stations.sql(query).to_dicts()
    ctx = MetaData(request_time=received, query=query)
    return Response(context=ctx, results=results)


def serve():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port)
