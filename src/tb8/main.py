from fastapi import FastAPI
import os

app = FastAPI()
port = int(os.environ.get("PORT", 4000))

@app.get("/")
def read_root():
    return {"Hello": "world"}

def serve():
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=port)
