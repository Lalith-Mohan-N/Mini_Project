import time
import numpy as np
import joblib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import MODEL_PATH, WINDOW_SIZE, HORIZON_MINUTES
from data_loader import load_history
from model_train import train_model

app = FastAPI(title="AetherGuard AQI 15‑min ML")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrainResponse(BaseModel):
  n_samples: int
  trained_at_ms: int


class PredictResponse(BaseModel):
  predicted_aqi_15min: float
  n_samples: int
  trained_at_ms: int


def load_bundle():
  try:
      return joblib.load(MODEL_PATH)
  except FileNotFoundError:
      return None


@app.post("/train", response_model=TrainResponse)
def train_endpoint():
  n, model = train_model()
  if model is None:
      return TrainResponse(n_samples=0, trained_at_ms=int(time.time() * 1000))
  bundle = load_bundle()
  return TrainResponse(
      n_samples=n,
      trained_at_ms=bundle["trained_at_ms"] if bundle else int(time.time() * 1000),
  )


@app.get("/predict15", response_model=PredictResponse)
def predict_15():
  bundle = load_bundle()
  if bundle is None:
      n, model = train_model()
      bundle = load_bundle()
      if bundle is None:
          return PredictResponse(
              predicted_aqi_15min=-1.0,
              n_samples=0,
              trained_at_ms=int(time.time() * 1000),
          )

  model = bundle["model"]
  window = bundle["window"]
  rows = load_history()
  if len(rows) < window:
      return PredictResponse(
          predicted_aqi_15min=-1.0,
          n_samples=len(rows),
          trained_at_ms=bundle["trained_at_ms"],
      )

  window_slice = rows[-window:]
  feats = []
  for (_, pm25, pm10, co2, temp, hum, aqi) in window_slice:
      feats.extend([pm25, pm10, co2, temp, hum, aqi])
  X = np.array(feats, float).reshape(1, -1)
  pred = float(model.predict(X)[0])

  return PredictResponse(
      predicted_aqi_15min=pred,
      n_samples=len(rows),
      trained_at_ms=bundle["trained_at_ms"],
  )


@app.get("/")
def root():
  return {"service": "AetherGuard ML", "endpoints": ["/train", "/predict15"]}


if __name__ == "__main__":
  import uvicorn
  uvicorn.run(app, host="0.0.0.0", port=8000)
