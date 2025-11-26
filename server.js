// =======================================================
// TELEMETRY GLOVE BACKEND (FULLY WORKING + ALERTS) — DEPLOY SAFE
// =======================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ----------------------------
// THRESHOLDS
// ----------------------------
const THRESHOLDS = {
  temp: 38.5,
  gsr: 500,
  force_left: 30,
  force_right: 30,
  hall_x: 2,
  hall_y: 2,
  hall_z: 2,
  flex: 90
};

// ----------------------------
// MEMORY
// ----------------------------
let latestReading = null;
let history = [];
let alertHistory = [];

// ----------------------------
// ALERT CHECK (NO EMOJIS) — DEPLOY SAFE
// ----------------------------
function checkAlerts(r) {
  const a = [];

  if (r.temp > THRESHOLDS.temp) a.push("Temperature Too High");
  if (r.gsr > THRESHOLDS.gsr) a.push("GSR Too High (Stress)");
  if (r.force_left > THRESHOLDS.force_left) a.push("Left Grip Unsafe");
  if (r.force_right > THRESHOLDS.force_right) a.push("Right Grip Unsafe");
  if (r.hall_x > THRESHOLDS.hall_x) a.push("Hall X Abnormal");
  if (r.hall_y > THRESHOLDS.hall_y) a.push("Hall Y Abnormal");
  if (r.hall_z > THRESHOLDS.hall_z) a.push("Hall Z Abnormal");
  if (r.flex > THRESHOLDS.flex) a.push("Flex Too Large");

  return a;
}

// ===========================================================
// POST DATA
// ===========================================================
app.post('/ingest', (req, res) => {
  const b = req.body || {};

  const reading = {
    ts: Date.now(),
    device_id: b.device_id || "demo",
    temp: b.temp ?? 0,
    gsr: b.gsr ?? 0,
    force_left: b.force_left ?? 0,
    force_right: b.force_right ?? 0,
    hall_x: b.hall_x ?? 0,
    hall_y: b.hall_y ?? 0,
    hall_z: b.hall_z ?? 0,
    flex: b.flex ?? 0,
  };

  latestReading = reading;
  history.push(reading);
  if (history.length > 200) history.shift();

  const alerts = checkAlerts(reading);
  if (alerts.length > 0) {
    alertHistory.push({
      ts: reading.ts,
      alerts
    });
    if (alertHistory.length > 200) alertHistory.shift();
  }

  res.json({
    ok: true,
    reading,
    alerts
  });
});

// ===========================================================
// GET LATEST
// ===========================================================
app.get('/latest', (req, res) => {
  if (!latestReading) return res.json({ ok: false });
  res.json({
    ...latestReading,
    alerts: checkAlerts(latestReading)
  });
});

// ===========================================================
// HISTORY
// ===========================================================
app.get('/history', (req, res) => {
  res.json(history.slice(-100));
});

// ===========================================================
// ALERTS — IMPORTANT
// ===========================================================
app.get('/alerts', (req, res) => {
  res.json(alertHistory.slice(-100));
});

// ===========================================================
// STATIC FRONTEND
// ===========================================================
app.use(express.static(path.join(__dirname, "public")));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===========================================================
// SERVER
// ===========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server Running on PORT:", PORT);
});