const BACKEND_BASE = window.location.origin;
const ML_BASE = "http://localhost:8000";

const routes = {
  home: renderHome,
  live: renderLive,
  predict: renderPredict,
  history: renderHistory,
  settings: renderSettings,
};

const pageRoot = document.getElementById("page-root");
const sidebar = document.getElementById("sidebar");
const menuToggle = document.getElementById("menuToggle");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));

menuToggle.addEventListener("click", () => {
  sidebar.classList.toggle("is-open");
});

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("load", handleRouteChange);

function handleRouteChange() {
  const hash = window.location.hash || "#/home";
  const route = hash.replace("#/", "") || "home";

  navLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.route === route);
  });
  sidebar.classList.remove("is-open");

  const renderer = routes[route] || renderHome;
  renderer();
}

async function renderHome() {
  const latest = await fetchLatest();
  pageRoot.innerHTML = `
    <section class="card">
      <div class="home-hero">
        <div>
          <div class="hero-main-title">Welcome to AetherGuard</div>
          <p class="hero-subtitle">
            Live air quality from your device with short‑term predictions powered by machine learning.
          </p>
          <div class="hero-badges">
            <span class="badge green">ESP32‑S3 Hardware</span>
            <span class="badge blue">Java + Python ML</span>
            <span class="badge">Real‑time dashboard</span>
          </div>
          ${
            latest
              ? `<p>Current AQI: <span class="highlight-aqi">${latest.aqi.toFixed(0)}</span></p>
                 <p class="timestamp">Last reading at ${new Date(latest.timestamp_ms).toLocaleTimeString()}</p>`
              : `<p class="timestamp">No sensor data yet. Waiting for first reading…</p>`
          }
        </div>
        <div>
          <h2>System Status</h2>
          <ul class="timestamp">
            <li>Backend: <strong>${BACKEND_BASE}</strong></li>
            <li>ML Service: <strong>${ML_BASE}</strong></li>
            <li>Hardware → <code>/api/sensor/ingest</code></li>
          </ul>
        </div>
      </div>
    </section>
  `;
}

let liveIntervalId = null;

async function renderLive() {
  pageRoot.innerHTML = `
    <section class="card">
      <h2>Live Sensor Readings</h2>
      <div class="metrics-grid">
        ${metricCard("PM2.5", "pm25", "µg/m³")}
        ${metricCard("PM10", "pm10", "µg/m³")}
        ${metricCard("CO₂", "co2", "ppm")}
        ${metricCard("Temperature", "temp", "°C")}
        ${metricCard("Humidity", "humidity", "%")}
        ${metricCard("AQI", "aqi", "", true)}
      </div>
      <p class="timestamp">Last update: <span id="liveLastUpdate">--</span></p>
    </section>
  `;
  if (liveIntervalId) clearInterval(liveIntervalId);
  await updateLiveOnce();
  liveIntervalId = setInterval(updateLiveOnce, 5000);
}

function metricCard(label, id, unit, highlight = false) {
  return `
    <div class="metric ${highlight ? "highlight" : ""}">
      <label>${label}</label>
      <span id="${id}">--</span>
      ${unit ? `<small>${unit}</small>` : ""}
    </div>
  `;
}

async function updateLiveOnce() {
  const data = await fetchLatest();
  if (!data) return;
  setText("pm25", data.pm25.toFixed(1));
  setText("pm10", data.pm10.toFixed(1));
  setText("co2", data.co2.toFixed(0));
  setText("temp", data.temp.toFixed(1));
  setText("humidity", data.humidity.toFixed(1));
  setText("aqi", data.aqi.toFixed(0));
  setText("liveLastUpdate", new Date(data.timestamp_ms).toLocaleTimeString());
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

let predictIntervalId = null;

async function renderPredict() {
  pageRoot.innerHTML = `
    <section class="card">
      <h2>15‑Minute AQI Prediction</h2>
      <div class="forecast-number" id="predictedAqi">--</div>
      <p id="forecastMeta" class="timestamp">Waiting for ML service…</p>
    </section>
  `;
  if (predictIntervalId) clearInterval(predictIntervalId);
  await updateForecastOnce();
  predictIntervalId = setInterval(updateForecastOnce, 30000);
}

async function updateForecastOnce() {
  try {
    const res = await fetch(`${ML_BASE}/predict15`);
    if (!res.ok) {
      document.getElementById("forecastMeta").textContent = "ML service offline.";
      return;
    }
    const data = await res.json();
    if (data.n_samples === 0) {
      document.getElementById("forecastMeta").textContent = "Not enough history to train model.";
      return;
    }
    document.getElementById("predictedAqi").textContent =
      data.predicted_aqi_15min.toFixed(0);
    document.getElementById("forecastMeta").textContent =
      `Trained on ${data.n_samples} samples • updated ` +
      new Date(data.trained_at_ms).toLocaleTimeString();
  } catch (err) {
    console.error(err);
    document.getElementById("forecastMeta").textContent = "Error contacting ML service.";
  }
}

function renderHistory() {
  pageRoot.innerHTML = `
    <section class="card">
      <h2>Air Quality History</h2>
      <div class="history-filters">
        <button class="chip active" data-range="daily">Daily</button>
        <button class="chip" data-range="weekly">Weekly</button>
        <button class="chip" data-range="monthly">Monthly</button>
      </div>
      <p class="timestamp">
        Backend should expose <code>/api/sensor/history?range=daily|weekly|monthly</code>
        – hook that here later.
      </p>
      <div id="historyContent" class="timestamp">
        Select a range to view a summary (placeholder).
      </div>
    </section>
  `;
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const range = chip.dataset.range;
      document.getElementById("historyContent").textContent =
        `Would fetch aggregated ${range} data from backend.`;
    });
  });
}

function renderSettings() {
  pageRoot.innerHTML = `
    <section class="card">
      <h2>Settings</h2>
      <div class="settings-grid">
        <div class="settings-item">
          <label>Refresh interval (seconds)</label>
          <input type="number" min="3" value="5" />
        </div>
        <div class="settings-item">
          <label>Backend base URL</label>
          <input type="text" value="${BACKEND_BASE}" />
        </div>
        <div class="settings-item">
          <label>ML service URL</label>
          <input type="text" value="${ML_BASE}" />
        </div>
      </div>
      <p class="timestamp">
        Wire these to localStorage and fetch() if you want fully dynamic config.
      </p>
    </section>
  `;
}

async function fetchLatest() {
  try {
    const res = await fetch(`${BACKEND_BASE}/api/sensor/latest`);
    const data = await res.json();
    if (data.error) return null;
    return data;
  } catch (err) {
    console.error("Error fetching latest:", err);
    return null;
  }
}
