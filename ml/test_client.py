import requests

BASE = "http://localhost:8000"

print("Triggering training...")
r = requests.post(f"{BASE}/train")
print("Train response:", r.status_code, r.json())

print("Requesting 15‑minute forecast...")
r = requests.get(f"{BASE}/predict15")
print("Predict response:", r.status_code, r.json())
