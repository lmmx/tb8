import os
from datetime import datetime, timedelta, timezone

import tubeulator as tube
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import AwareDatetime, BaseModel, ConfigDict, model_validator

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
port = int(os.environ.get("PORT", 4000))

lines = tube.load_lines()
lines_by_station = tube.load_lines_by_station()
stations = tube.load_stations()
station_points = tube.load_station_points().join(stations, on="StationUniqueId")


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
    return Response(
        context=MetaData(request_time=received, query=query), results=results
    )


@app.get("/lines-by-station")
def read_lines_by_station(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = lines_by_station.sql(query).to_dicts()
    return Response(
        context=MetaData(request_time=received, query=query), results=results
    )


@app.get("/stations")
def read_stations(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = stations.sql(query).to_dicts()
    return Response(
        context=MetaData(request_time=received, query=query), results=results
    )


@app.get("/station-points")
def read_station_points(request: Request, query: str = "SELECT * FROM self;"):
    received = time_now()
    results = station_points.sql(query).to_dicts()
    return Response(
        context=MetaData(request_time=received, query=query), results=results
    )


def serve():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port)
