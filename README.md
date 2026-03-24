<<<<<<< HEAD
# Mini_Project
AI – Powered Predictive Air Intelligence System ,To deliver real-time monitoring, predictive analytics, and timely intervention for indoor air quality, minimizing health risks and environmental hazards in homes, commercial kitchens, factories, and laboratories.
=======
# AetherGuard Web Stack

- Java backend (`backend_java`) with SQLite via JDBC and JSON ingest endpoint.
- Frontend (`frontend`) shows live sensor data and 15‑minute AQI forecast.
- Python ML service (`ml`) trains and serves predictions.

## Run

1. Build backend:

   ```bash
   cd aetherguard_web/backend_java
   mvn package
   java -cp "target/classes;target/dependency/*" com.aetherguard.backend.SensorServer
   ```

2. Start ML service:

   ```bash
   cd ../ml
   pip install -r requirements.txt
   python model_service.py
   ```

3. Configure your ESP32 to POST sensor JSON to:

   `http://<pc-ip>:8080/api/sensor/ingest`

4. Open the UI:

   `http://<pc-ip>:8080/`
>>>>>>> 8067e2d (Initial commit: AetherGuard web + backend + ML)
