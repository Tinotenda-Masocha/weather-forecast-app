require("dotenv").config({ path: "./private/.env" });
const express = require("express");
const axios = require("axios");
const app = express();

const PORT = 5503;

app.use(express.static("public"));

// Log all incoming requests for debugging
app.use((req, res, next) => {
  console.log("INCOMING ->", req.method, req.path);
  next();
});

// Enhanced logging for unexpected errors and unhandled rejections
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err && (err.stack || err));
});
process.on("unhandledRejection", (reason, promise) => {
  console.error(
    "Unhandled Rejection at:",
    promise,
    "reason:",
    reason && (reason.stack || reason),
  );
});

// This MUST match the "/weather/" part of your JS URL
app.get("/weather/:cityName", async (req, res) => {
  const cityName = req.params.cityName;
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  const days = req.query.days || 2;

  // Log request details for debugging intermittent issues
  console.log("/weather request params:", {
    params: req.params,
    query: req.query,
    ip: req.ip,
  });

  const API_URL = `https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
    cityName,
  )}&days=${days}`;

  try {
    // Log the outgoing API call (mask the key)
    const maskedUrl = API_URL.replace(WEATHER_API_KEY || "", "***");
    console.log("Calling WeatherAPI:", maskedUrl);

    const response = await axios.get(API_URL);
    console.log("WeatherAPI status:", response.status);

    if (response.data && response.data.error) {
      console.warn("WeatherAPI returned error payload:", response.data.error);
      return res
        .status(502)
        .json({ error: "Upstream API error", details: response.data.error });
    }

    res.json(response.data); // Send the real data back to your script.js
  } catch (error) {
    console.error(
      "Weather API error:",
      error.response?.data || error.message || error,
    );
    console.error("Weather API error stack:", error && error.stack);

    res.status(error.response?.status || 500).json({
      error: "API Error",
      details: error.response?.data || error.message || "Unknown error",
    });
  }
});

// quick test endpoint
app.get("/ping", (req, res) => {
  console.log("/ping received");
  res.json({ pong: true });
});

const server = app.listen(PORT);

server.on("listening", () => {
  const addr = server.address();
  const host = (addr && (addr.address || "localhost")) || "localhost";
  const port = (addr && addr.port) || PORT;

  console.log(`✅ Server live at http://${host}:${port}`);
  console.log("Process PID:", process.pid);
  console.log("Server address:", addr);
});

server.on("error", (err) => {
  console.error("Server error:", err && (err.stack || err));
});

// Log whether the API key was loaded (don't print the key itself)
console.log("WEATHER_API_KEY loaded:", !!process.env.WEATHER_API_KEY);
