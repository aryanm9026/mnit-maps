// No imports anymore — poiList comes from poiData.js

const map = L.map("map", {
  zoomControl: true,
  minZoom: 15,
  maxZoom: 20
}).setView([26.864, 75.815], 16);

// Blank/white background instead of OSM tiles
L.tileLayer(
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEX///+nxBvIAAAAAXRSTlMAQObYZgAAAApJREFUCNdjYAAAAAIAAeIhvDMAAAAASUVORK5CYII=",
  {
    attribution: "",
    maxZoom: 20
  }
).addTo(map);

let allFeatures = [];

// Load GeoJSON layers
Promise.all([
  fetch("/data/campus_boundary.geojson").then(res => res.json()),
  fetch("/data/buildings.geojson").then(res => res.json()),
  fetch("/data/paths.geojson").then(res => res.json()),
  fetch("/data/pois.geojson").then(res => res.json())
]).then(([boundary, buildings, paths, pois]) => {
  // Campus boundary
  const campusLayer = L.geoJSON(boundary).addTo(map);
  map.fitBounds(campusLayer.getBounds());
  dimOutside(boundary);

  // Buildings
  L.geoJSON(buildings, {
    onEachFeature: (feature, layer) => {
      allFeatures.push(layer);
      layer.bindPopup(
        `<div class="popup-title">${feature.properties.name || "Building"}</div>
         <div class="popup-desc">${feature.properties.description || ""}</div>`
      );
    }
  }).addTo(map);

  // Paths
  L.geoJSON(paths, {
    style: {
      color: "#242424ff",
      weight: 4,
      opacity: 1,
      lineJoin: "round",
      lineCap: "round"
    }
  }).addTo(map);

  // POIs with "Navigate" button
  L.geoJSON(pois, {
    pointToLayer: (feature, latlng) =>
      L.marker(latlng).bindPopup(`
        <b>${feature.properties.name}</b><br>
        <button onclick="navigateTo([${latlng.lng}, ${latlng.lat}])">Navigate</button>
      `)
  }).addTo(map);

  // Geocoder
  L.Control.geocoder({
    defaultMarkGeocode: false,
    geocoder: L.Control.Geocoder.nominatim(),
    placeholder: "Search building or place..."
  })
    .on("markgeocode", e => map.fitBounds(e.geocode.bbox))
    .addTo(map);
});

// Mask outside campus
function dimOutside(boundaryGeoJSON) {
  const world = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]
      ]]
    }
  };
  const mask = turf.difference(world, boundaryGeoJSON.features[0]);
  L.geoJSON(mask, {
    style: { fillColor: "#2b2b2b", fillOpacity: 0.55, stroke: false }
  }).addTo(map);
}

// Marker clusters by category
const categories = {
  Departments: L.markerClusterGroup(),
  Hostels: L.markerClusterGroup(),
  Cafes: L.markerClusterGroup(),
  Sports: L.markerClusterGroup()
};

// Add POIs from global poiList
poiList.forEach(poi => {
  const marker = L.marker(poi.coords, { title: poi.name })
    .bindTooltip(poi.name, { direction: "top" })
    .bindPopup(
      `<div style="text-align:center;">
        <h3 style="margin:6px 0 4px;">${poi.name}</h3>
        <p class="popup-desc">${poi.description || ""}</p>
        <p><strong>Timings:</strong> ${poi.timings || "-"}</p>
      </div>`
    );

  if (categories[poi.category]) {
    categories[poi.category].addLayer(marker);
  }
});

L.control.layers(null, categories, { collapsed: false }).addTo(map);
Object.values(categories).forEach(g => map.addLayer(g));

// Search box logic
const searchBox = document.getElementById("search-box");
const suggestions = document.getElementById("suggestions");
let highlightMarker = null;

searchBox.addEventListener("input", () => {
  const q = searchBox.value.trim().toLowerCase();
  suggestions.innerHTML = "";
  if (!q) {
    suggestions.style.display = "none";
    return;
  }

  const matches = poiList.filter(p => p.name.toLowerCase().includes(q));
  if (!matches.length) {
    suggestions.style.display = "none";
    return;
  }

  matches.forEach(poi => {
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

  highlightMarker = L.marker(poi.coords).addTo(map)
    .bindPopup(`<b>${poi.name}</b><br>${poi.description || ""}`)
    .openPopup();

  map.setView(poi.coords, 18, { animate: true });
}

// Navigation: test route from fixed point to clicked POI
let activeRoute;

window.navigateTo = function(endCoords) {
  const startCoords = [75.81237, 26.86413]; // [lng, lat]

 fetch("/route", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start: startCoords, end: endCoords })
})
    .then(res => res.json())
    .then(data => {
      if (activeRoute) map.removeLayer(activeRoute);
      console.log(data)
      if (!data.path) {
        alert("No this route found");
        return;
      }

      activeRoute = L.polyline(
        data.path.map(c => [c[1], c[0]]), // [lng, lat] -> [lat, lng]
        { color: "blue", weight: 5 }
      ).addTo(map);

      map.fitBounds(activeRoute.getBounds(), { padding: [30, 30] });
    })
    .catch(err => console.error("Route error:", err));
};
