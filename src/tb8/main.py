import os
import polars as pl
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
arrivable_line_names = lines.filter(pl.col("Name") != "national-rail")["Name"].unique().sort().to_list()
lines_by_station = tube.load_lines_by_station()
stations = tube.load_stations()
platforms = tube.load_platforms_with_stations_and_services()
station_points = tube.load_station_points().join(stations, on="StationUniqueId")
station_centroids = (
    station_points.filter(
        [
            ~pl.col("AreaName").str.starts_with("Bus"),
            pl.col("Level").eq(0),
        ]
    ).groupby("StationUniqueId").agg(
        [
            pl.col("Lat").mean(),
            pl.col("Lon").mean(),
        ]
    )
)
substations = platforms.group_by("StationUniqueId").agg(pl.col("StopAreaNaptanCode").unique().alias("ComponentStations"))
station_centroids = station_centroids.join(substations, on="StationUniqueId", how="left")
stations = stations.join(station_centroids, on="StationUniqueId")

modes = {mode.ModeName: mode for mode in tube.fetch.line.meta_modes()}
undisrupted_modes = "interchange-keep-sitting,interchange-secure,walking".split(",")
disrupted_modes = [m for m in modes if m not in undisrupted_modes]

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
    success: bool = True
    results: list[dict]


class Error(BaseModel):
    context: MetaData
    success: bool = False
    error: str


@app.get("/")
def read_root():
    return {"🚨": "It's time for the tubeulator"}


@app.get("/lines")
def read_lines(request: Request, query: str = "SELECT * FROM self;"):
    print(f"Received {query=}")
    received = time_now()
    try:
        results = lines.sql(query).to_dicts()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/lines-by-station")
def read_lines_by_station(request: Request, query: str = "SELECT * FROM self;"):
    print(f"Received {query=}")
    received = time_now()
    try:
        results = lines_by_station.sql(query).to_dicts()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/stations")
def read_stations(request: Request, query: str = "SELECT * FROM self;"):
    print(f"Received {query=}")
    received = time_now()
    try:
        results = stations.sql(query).to_dicts()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/platforms")
def read_platforms(request: Request, query: str = "SELECT * FROM self;"):
    print(f"Received {query=}")
    received = time_now()
    try:
        results = platforms.sql(query).to_dicts()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/station-points")
def read_station_points(request: Request, query: str = "SELECT * FROM self;"):
    print(f"Received {query=}")
    received = time_now()
    try:
        results = station_points.sql(query).to_dicts()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/disruption-by-modes")
def read_disruption_by_modes(request: Request, query: str = ",".join(disrupted_modes)):
    print(f"Received {query=}")
    received = time_now()
    try:
        for mode_csv in query.split(","):
            err_msg = f"Received unknown mode: {mode_csv!r}. Choose from: {list(disrupted_modes)}"
            assert mode_csv in disrupted_modes, err_msg
        result_models = tube.fetch.line.disruption_by_modes(modes=query)
        results = [rm.model_dump() for rm in result_models]
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/route-by-modes")
def read_route_by_modes(request: Request, query: str = "tube"):
    print(f"Received {query=}")
    received = time_now()
    try:
        for mode_csv in query.split(","):
            err_msg = f"Received unknown mode: {mode_csv!r}. Choose from: {list(disrupted_modes)}"
            assert mode_csv in disrupted_modes, err_msg
        result_models = tube.fetch.line.route_by_modes(modes=query)
        results = [rm.model_dump() for rm in result_models]
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )

@app.get("/route-sequence-by-line-direction")
def read_route_sequence_by_line_direction(request: Request, line: str, direction: str):
    print(f"Received {line=} {direction=}")
    query = f"line={line},direction={direction}"
    received = time_now()
    try:
        err_msg = f"Received unknown line: {line!r}. Choose from: {arrivable_line_names}"
        assert line in arrivable_line_names, err_msg
        result = tube.fetch.line.route_sequence_by_id_direction(
            id=line, direction=direction
        ).model_dump()
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=[result]
        )


@app.get("/arrivals-by-lines")
def read_arrivals_by_lines(request: Request, query: str = ",".join(arrivable_line_names)):
    print(f"Received {query=}")
    received = time_now()
    try:
        for line_csv in query.split(","):
            err_msg = f"Received unknown line: {line_csv!r}. Choose from: {arrivable_line_names}"
            assert line_csv in arrivable_line_names, err_msg
        result_models = tube.fetch.line.arrivals_by_ids(ids=query)
        results = [rm.model_dump() for rm in result_models]
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


@app.get("/arrivals-by-station")
def read_arrivals_by_station(request: Request, query: str, lines: str = ",".join(arrivable_line_names)):
    print(f"Received {query=}")
    received = time_now()
    try:
        for line_csv in lines.split(","):
            err_msg = f"Received unknown line: {line_csv!r}. Choose from: {arrivable_line_names}"
            assert line_csv in arrivable_line_names, err_msg
        result_models = tube.fetch.line.arrivals_by_ids_stop(ids=lines, stopPointId=query)
        results = [rm.model_dump() for rm in result_models]
    except Exception as exc:
        return Error(
            context=MetaData(request_time=received, query=query), error=str(exc)
        )
    else:
        return Response(
            context=MetaData(request_time=received, query=query), results=results
        )


def serve():
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=port)
