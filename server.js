// =======================================================
// TELEMETRY GLOVE BACKEND (FULLY WORKING + ALERTS)
// =======================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

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

// ----------------------------
// ALERT CHECK
// ----------------------------
function checkAlerts(r) {
  const a = [];

  if (r.temp > THRESHOLDS.temp) a.push("🔥 Temperature Too High");
  if (r.gsr > THRESHOLDS.gsr) a.push("⚡️ GSR too high (stress/sweat)");
  if (r.force_left > THRESHOLDS.force_left) a.push("🤜 Left Grip Unsafe");
  if (r.force_right > THRESHOLDS.force_right) a.push("🤛 Right Grip Unsafe");
  if (r.hall_x > THRESHOLDS.hall_x) a.push("🧲 Hall X abnormal");
  if (r.hall_y > THRESHOLDS.hall_y) a.push("🧲 Hall Y abnormal");
  if (r.hall_z > THRESHOLDS.hall_z) a.push("🧲 Hall Z abnormal");
  if (r.flex > THRESHOLDS.flex) a.push("🦾 Flex too large");

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
    temp: b.temp ?? null,
    gsr: b.gsr ?? null,
    force_left: b.force_left ?? null,
    force_right: b.force_right ?? null,
    hall_x: b.hall_x ?? null,
    hall_y: b.hall_y ?? null,
    hall_z: b.hall_z ?? null,
    flex: b.flex ?? null,
  };

  latestReading = reading;
  history.push(reading);
  if (history.length > 200) history.shift();

  res.json({
    ok: true,
    reading,
    alerts: checkAlerts(reading)
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
  const limit = parseInt(req.query.limit || 100);
  res.json(history.slice(-limit));
});

// ===========================================================
// STATIC FRONTEND
// ===========================================================
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===========================================================
// SERVER
// ===========================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server Running on port" + PORT);
});