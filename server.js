// server.js
import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || "supersecret";
const DB_FILE = process.env.DB_FILE || "telemetry.db";

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(express.static("public"));

// simple rate limiter
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// setup DB
const db = new Database(DB_FILE);
db.exec(`
  CREATE TABLE IF NOT EXISTS readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT,
    ts INTEGER,
    temp TEXT,
    gsr REAL,
    fsr TEXT,
    accel TEXT,
    gyro TEXT,
    flex REAL
  )
`);

// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ingest data
app.post("/ingest", (req, res) => {
  try {
    const { device_id, temp, gsr, fsr, accel, gyro, flex, ts } = req.body;
    if (!device_id) return res.status(400).json({ error: "device_id required" });
    const timestamp = ts || Date.now();

    const stmt = db.prepare(
      `INSERT INTO readings (device_id, ts, temp, gsr, fsr, accel, gyro, flex)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    stmt.run(
      device_id,
      timestamp,
      JSON.stringify(temp || []),
      gsr,
      JSON.stringify(fsr || []),
      JSON.stringify(accel || []),
      JSON.stringify(gyro || []),
      flex
    );

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "failed to ingest" });
  }
});

// latest reading
app.get("/latest", (req, res) => {
  const device_id = req.query.device_id;
  if (!device_id) return res.status(400).json({ error: "device_id required" });

  const row = db
    .prepare(
      "SELECT * FROM readings WHERE device_id = ? ORDER BY ts DESC LIMIT 1"
    )
    .get(device_id);

  if (!row) return res.json({});

  res.json({
    ...row,
    temp: JSON.parse(row.temp),
    fsr: JSON.parse(row.fsr),
    accel: JSON.parse(row.accel),
    gyro: JSON.parse(row.gyro),
  });
});

// history
app.get("/history", (req, res) => {
  const device_id = req.query.device_id;
  const limit = parseInt(req.query.limit || "10", 10);
  if (!device_id) return res.status(400).json({ error: "device_id required" });

  const rows = db
    .prepare(
      "SELECT * FROM readings WHERE device_id = ? ORDER BY ts DESC LIMIT ?"
    )
    .all(device_id, limit);

  res.json(
    rows.map((r) => ({
      ...r,
      temp: JSON.parse(r.temp),
      fsr: JSON.parse(r.fsr),
      accel: JSON.parse(r.accel),
      gyro: JSON.parse(r.gyro),
    }))
  );
});

// CSV export
app.get("/export.csv", (req, res) => {
  const device_id = String(req.query.device_id || "");
  if (!device_id) return res.status(400).type("text/plain").send("device_id required");

  const since = Number(req.query.since || 0);
  const until = Number(req.query.until || Date.now() + 1e12);

  const rows = db
    .prepare("SELECT * FROM readings WHERE device_id = ? AND ts BETWEEN ? AND ? ORDER BY ts ASC")
    .all(device_id, since, until);

  const header = [
    "ts","temp1","temp2","temp3","temp4","temp5",
    "gsr","fsr1","fsr2","accelX","accelY","accelZ","gyroX","gyroY","gyroZ","flex"
  ];
  const lines = [header.join(",")];

  for (const r of rows) {
    const t = JSON.parse(r.temp || "[]");
    const f = JSON.parse(r.fsr || "[]");
    const a = JSON.parse(r.accel || "[]");
    const g = JSON.parse(r.gyro || "[]");
    lines.push([
      r.ts,
      t[0] ?? "", t[1] ?? "", t[2] ?? "", t[3] ?? "", t[4] ?? "",
      r.gsr ?? "",
      f[0] ?? "", f[1] ?? "",
      a[0] ?? "", a[1] ?? "", a[2] ?? "",
      g[0] ?? "", g[1] ?? "", g[2] ?? "",
      r.flex ?? ""
    ].join(","));
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="export.csv"');
  res.send(lines.join("\n"));
});

// start server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});

