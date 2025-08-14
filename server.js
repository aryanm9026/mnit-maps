const path = require("path");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve everything in /public
app.use(express.static(path.join(__dirname, "public")));

// (Optional) Example API route if later you want AJAX loading:
// app.get("/api/pois", (req, res) => {
//   res.sendFile(path.join(__dirname, "public", "data", "pois.geojson"));
// });

app.listen(PORT, () => {
  console.log(`MNIT Map server running → http://localhost:${PORT}`);
});
