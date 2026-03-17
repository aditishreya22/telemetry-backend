This project is a wearable rehabilitation monitoring system designed to track recovery progress after hand/wrist injuries.
It combines sensor-based hardware + real-time web dashboard to provide continuous, data-driven insights into patient recovery.

Problem Statement

Post-fracture rehabilitation is often unmonitored and inconsistent, especially after plaster removal.
Patients rely on subjective feedback like pain or comfort, which leads to:
	•	Improper healing
	•	Muscle stiffness
	•	Long-term disability

Solution

A sensor-integrated wearable glove that:
	•	Tracks movement, grip strength, stress, and temperature
	•	Sends real-time data to a cloud-based dashboard
	•	Helps doctors and patients monitor recovery remotely

  Flow
	1.	Sensors collect physiological data
	2.	ESP32 sends data via HTTP (JSON)
	3.	Backend processes + stores data
	4.	Dashboard displays real-time insights

Hardware Components
	•	ESP32 (WiFi-enabled microcontroller)
	•	Flex Sensor (joint bending)
	•	FSR Sensors (grip force)
	•	GSR Sensor (stress/sweat response)
	•	Temperature Sensor (inflammation detection)
	•	Hall Effect Sensor (motion/orientation tracking)

Software Stack

Frontend
	•	HTML, CSS, JavaScript
	•	Chart.js (real-time graphs)

Backend
	•	Node.js
	•	Express.js (REST APIs)

APIs
	•	POST /ingest → receive sensor data
	•	GET /latest → latest reading
	•	GET /history → past data

Key Features
	•	Real-time sensor visualization
	• Automatic alert generation (threshold-based)
	•	Multi-patient login simulation
	• Data export (CSV)
	•	Email report functionality
	•	Historical data tracking

Alerts System

The system flags abnormal conditions such as:
	•	High temperature (inflammation)
	•	Unsafe grip force
	•	Excessive joint bending
	•	Abnormal motion patterns
	•	Elevated stress levels

How It Works
	1.	ESP32 sends JSON data:
  {
  "temp": 36.5,
  "gsr": 420,
  "force_left": 20,
  "force_right": 22,
  "flex": 45,
  "hall_x": 1.2,
  "hall_y": 0.8,
  "hall_z": 1.0
}
2.	Backend processes data and checks thresholds
	3.	Dashboard updates every ~1.5 seconds
  Deployment
	•	Backend deployed on Render
	•	Frontend hosted as static site (public folder)

Use Cases
	•	Post-fracture rehabilitation monitoring
	•	Physiotherapy progress tracking
	•	Remote patient monitoring
	•	Home-based recovery programs

Limitations
	•	Not a diagnostic medical device
	•	Sensor readings are trend-based, not lab-grade precision
	•	Requires internet connectivity

Future Scope
	•	AI-based recovery prediction
	•	Doctor dashboard with patient comparison
	•	Mobile app integration
	•	Database integration for long-term tracking
  
