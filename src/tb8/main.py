from fastapi import FastAPI
import os
import tubeulator

app = FastAPI()
port = int(os.environ.get("PORT", 4000))

@app.get("/")
def read_root():
    return {"🚨": "It's time for the tubeulator"}

@app.get("/lines")
def read_tubeulate_lines():
    lines = tubeulator.load_lines()
    return lines.to_dicts()

@app.get("/lines-by-station")
def read_tubeulate_lines_by_station():
    lines = tubeulator.load_lines_by_station()
    return lines.to_dicts()

@app.get("/stations")
def read_tubeulate_stations():
    stations = tubeulator.load_stations()
    return stations.to_dicts()

def serve():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
