const path = require("path");
const express = require("express");
const fs = require("fs");
const turf = require("@turf/turf");
const GeoJSONPathFinder = require("geojson-path-finder").default;

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve frontend files
app.use(express.static(path.join(__dirname, "public")));

// Load paths GeoJSON (graph for navigation)
const paths = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./public/data/paths.geojson"))
);
const pathFinder = new GeoJSONPathFinder(paths, {
    precision: 16
});

// Route to calculate shortest path
app.post("/route", (req, res) => {
  console.log("BODY RECEIVED:", req.body);

  const { start, end } = req.body;

  if (!start || !end) {
    return res.status(400).json({ error: "Missing start or end" });
  }
  

  try {
    const route = pathFinder.findPath(
      turf.point(start), // [lng, lat]
      turf.point(end)    // [lng, lat]
    );

    if (!route) {
      return res.status(404).json({ error: "No route found" });
    }

    res.json({ path: route.path });
  } catch (err) {
    console.error("💥 Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 MNIT Map server running → http://localhost:${PORT}`);
});
