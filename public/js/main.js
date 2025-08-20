// --- Setup Map ---
const map = L.map("map", {
  zoomControl: true,
  minZoom: 15,
  maxZoom: 20,
}).setView([26.864, 75.815], 16);

// Blank background instead of OSM
L.tileLayer(
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8Xw8AAnsB9p9GZPkAAAAASUVORK5CYII=",
  { attribution: "", maxZoom: 20 }
).addTo(map);

let allFeatures = [];
let clusteredPOIs, detailedPOIs;
let activeRoute;

// --- Clustered & Detailed POIs ---
Promise.all([
  fetch("/data/campus_boundary.geojson").then((res) => res.json()),
  fetch("/data/buildings.geojson").then((res) => res.json()),
  fetch("/data/paths.geojson").then((res) => res.json()),
  fetch("/data/clustered_pois.geojson").then((res) => res.json()),
  fetch("/data/newpois.geojson").then((res) => res.json()),
]).then(([boundary, buildings, paths, clustered, detailed]) => {
  // --- Campus boundary ---
  const campusLayer = L.geoJSON(boundary, {
    style: {
      color: "#124f95ff",
      weight: 10,
      opacity: 1,
      padding: "20px",
      lineJoin: "round",
      lineCap: "round",
    }
  }).addTo(map);
  map.fitBounds(campusLayer.getBounds());
  dimOutside(boundary);

  // --- Buildings ---
  L.geoJSON(buildings, {
    style: {
      color: "#b4b4b4ff",
      weight: 1.5
    },
    onEachFeature: (feature, layer) => {
      allFeatures.push(layer);
      layer.bindPopup(`
        <div class="popup-title">${feature.properties.name || "Building"}</div>
        <div class="popup-desc">${feature.properties.description || ""}</div>
      `);
    },
  }).addTo(map);

  // --- Paths ---
  const pathLayer = L.geoJSON(paths, {
    style: {
      color: "#796dffff",
      weight: 4.5,
      opacity: 1,
      lineJoin: "round",
      lineCap: "round",
    },
  }).addTo(map);

  // Keep path visually constant like Google Maps
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    const newWeight = 3 * Math.pow(1.5, zoom - 15);
    pathLayer.setStyle({
      color: "#796dffff",
      weight: newWeight,
      opacity: 1,
      lineJoin: "round",
      lineCap: "round",
    });
  });

  // --- Clustered POIs (default) ---
  clusteredPOIs = L.geoJSON(clustered, {
    pointToLayer: (feature, latlng) =>
      L.marker(latlng, { icon: getIcon(feature.properties.category) })
        .bindPopup(`
        <b>${feature.properties.name}</b><br>
        ${feature.properties.poi_count || 1} POIs merged
        <button onclick="navigateTo([${latlng.lng}, ${latlng.lat}])" style="
  position: absolute; top: 10px; right: 10px; z-index: 1000;
  padding: 8px 12px; border-radius: 8px; border: none; background: #007bff; color: white;
">Navigate</button>
      `),
  }).addTo(map);

  // --- Detailed POIs (hidden initially) ---
  detailedPOIs = L.geoJSON(detailed, {
    pointToLayer: (feature, latlng) =>
      L.marker(latlng, { icon: getIcon(feature.properties.category) }).bindPopup(`
        <b>${feature.properties.name}</b><br>
        <button onclick="navigateTo([${latlng.lng}, ${latlng.lat}])">Navigate</button>
      `),
  });

  // --- Toggle POIs based on zoom ---
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    if (zoom >= 19) {
      if (map.hasLayer(clusteredPOIs)) map.removeLayer(clusteredPOIs);
      if (!map.hasLayer(detailedPOIs)) map.addLayer(detailedPOIs);
    } else {
      if (map.hasLayer(detailedPOIs)) map.removeLayer(detailedPOIs);
      if (!map.hasLayer(clusteredPOIs)) map.addLayer(clusteredPOIs);
    }
    updateMask();
  });
});

// --- Mask outside campus ---
function dimOutside(boundaryGeoJSON) {
  const world = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [-180, -90],
          [180, -90],
          [180, 90],
          [-180, 90],
          [-180, -90],
        ],
      ],
    },
  };
  const mask = turf.difference(world, boundaryGeoJSON.features[0]);
  L.geoJSON(mask, {
    style: { fillColor: "#2b2b2b", fillOpacity: 0.55, stroke: false },
  }).addTo(map);
}

// --- Mask for focus effect ---
function updateMask() {
  const mask = document.getElementById("focusMask");
  if (!mask) return;
  mask.style.display = map.getZoom() >= 20 ? "block" : "none";
}


// --- Category clusters from poiList.js ---
const categories = {
  Departments: L.markerClusterGroup(),
  Hostels: L.markerClusterGroup(),
  Cafes: L.markerClusterGroup(),
  Sports: L.markerClusterGroup(),
};


// --- Search box ---
const searchBox = document.getElementById("search-box");
const suggestions = document.getElementById("suggestions");
let highlightMarker = null;

searchBox.addEventListener("input", () => {
  const q = searchBox.value.trim().toLowerCase();
  suggestions.innerHTML = "";
  if (!q) return (suggestions.style.display = "none");

  const matches = poiList.filter((p) => p.name.toLowerCase().includes(q));
  if (!matches.length) return (suggestions.style.display = "none");

  matches.forEach((poi) => {
    const li = document.createElement("li");
    li.textContent = poi.name;
    li.onclick = () => goToPOI(poi);
    suggestions.appendChild(li);
  });
  suggestions.style.display = "block";
});

function goToPOI(poi) {
  suggestions.style.display = "none";
  searchBox.value = poi.name;

  if (highlightMarker) map.removeLayer(highlightMarker);

  highlightMarker = L.marker(poi.coords)
    .addTo(map)
    .bindPopup(
      `
      <div style="text-align:center;">
        <h3 style="margin:6px 0 4px;">${poi.name}</h3>
        <p class="popup-desc">${poi.description || ""}</p>
        <p><strong>Timings:</strong> ${poi.timings || "-"}</p>
        <button onclick="navigateTo([${poi.coords[1]}, ${
        poi.coords[0]
      }])">Navigate</button>
      </div>
      `
    )
    .openPopup();

  map.setView(poi.coords, 18, { animate: true });
}

// --- Navigation ---
window.navigateTo = function (endCoords) {
  if (!navigator.geolocation) {
    alert("Geolocation not supported");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      // Find nearest POI to user
      let nearestPOI = null;
      let minDist = Infinity;

      poiList.forEach((poi) => {
        const d = turf.distance(
          turf.point([userLng, userLat]),
          turf.point([poi.coords[1], poi.coords[0]]), // careful: check your poi coords order!
          { units: "kilometers" }
        );
        if (d < minDist) {
          minDist = d;
          nearestPOI = poi;
        }
      });

      if (!nearestPOI) {
        alert("No POIs available for navigation");
        return;
      }

      const startCoords = [nearestPOI.coords[1], nearestPOI.coords[0]]; // [lng, lat]

      // Request shortest route
      fetch("/route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: startCoords, end: endCoords }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (activeRoute) map.removeLayer(activeRoute);
          if (!data.path) return alert("No route found");

          activeRoute = L.polyline(
            data.path.map((c) => [c[1], c[0]]),
            { color: "blue", weight: 8 }
          ).addTo(map);

          map.fitBounds(activeRoute.getBounds(), { padding: [30, 30] });
        })
        .catch((err) => console.error("Route error:", err));
    },
    (error) => {
      console.error("Error getting location:", error);
      alert("Unable to get your location.");
    }
  );
};

// One-time locate user
window.locateUser = function () {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      // Add marker for user location
      const userMarker = L.marker([lat, lng], {
        title: "You are here",
        icon: pulsingIcon,
      })
        .addTo(map)
        .bindPopup("📍 Areh idhar toh dekho")
        .openPopup();

      // Center map on user location
      map.setView([lat, lng], 18, { animate: true });
    },
    (error) => {
      console.error("Error getting location:", error);
      alert("Unable to retrieve your location. Please allow location access.");
    }
  );
};

// Create a reusable pulsing icon (no external libs)
