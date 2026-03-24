import time
from typing import Tuple, Optional

import joblib
import numpy as np
from sklearn.ensemble import RandomForestRegressor

from config import MODEL_PATH, WINDOW_SIZE, HORIZON_MINUTES
from data_loader import load_history


def build_dataset(rows, window: int, horizon_minutes: int):
  if len(rows) < window + 2:
      return None, None

  X, y = [], []
  horizon_ms = horizon_minutes * 60 * 1000

  for i in range(len(rows)):
      if i < window - 1:
          continue

      end_ts = rows[i][0]
      target_ts = end_ts + horizon_ms

      future = None
      for j in range(i + 1, len(rows)):
          if rows[j][0] >= target_ts:
              future = rows[j]
              break
      if future is None:
          break

      window_slice = rows[i - window + 1 : i + 1]
      feats = []
      for (_, pm25, pm10, co2, temp, hum, aqi) in window_slice:
          feats.extend([pm25, pm10, co2, temp, hum, aqi])
      X.append(feats)
      y.append(future[-1])

  if not X:
      return None, None
  return np.array(X, float), np.array(y, float)


def train_model() -> Tuple[int, Optional[RandomForestRegressor]]:
  rows = load_history()
  X, y = build_dataset(rows, WINDOW_SIZE, HORIZON_MINUTES)
  if X is None:
      return 0, None

  model = RandomForestRegressor(
      n_estimators=100, max_depth=8, random_state=42, n_jobs=-1
  )
  model.fit(X, y)

  bundle = {
      "model": model,
      "trained_at_ms": int(time.time() * 1000),
      "window": WINDOW_SIZE,
      "horizon_minutes": HORIZON_MINUTES,
  }
  joblib.dump(bundle, MODEL_PATH)
  return len(y), model
