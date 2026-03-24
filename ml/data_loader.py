import sqlite3
from typing import List, Tuple
from config import DB_PATH


def load_history() -> List[Tuple]:
  conn = sqlite3.connect(DB_PATH)
  cur = conn.cursor()
  cur.execute(
      """
      SELECT timestamp_ms, pm25, pm10, co2, temp, humidity, aqi
      FROM sensor_readings
      ORDER BY timestamp_ms ASC
      """
  )
  rows = cur.fetchall()
  conn.close()
  return rows
