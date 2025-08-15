import { poiList } from "./poiData.js";

// Initialize map
const map = L.map("map", { zoomControl: true }).setView([26.864, 75.815], 16);

// Basemap (no labels to keep your custom layers clean)
L.tileLayer(
  "https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}{r}.png",
  {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 20
  }
).addTo(map);

// Global feature storage for (future) search by layer
let allFeatures = [];

// Load GeoJSON layers (served by Express static)
Promise.all([
  fetch("/data/campus_boundary.geojson").then(res => res.json()),
  fetch("/data/buildings.geojson").then(res => res.json()),
  fetch("/data/paths.geojson").then(res => res.json()),
  fetch("/data/pois.geojson").then(res => res.json())
]).then(([boundary, buildings, paths, pois]) => {
  // 1) Campus boundary (also used to dim outside)
  const campusLayer = L.geoJSON(boundary, {
    style: {
      color: "#d24a43",          // subtle red outline
      weight: 2.5,
      fillColor: "#eadfdb",      // soft warm fill
      fillOpacity: 0.45
    }
  }).addTo(map);

  map.fitBounds(campusLayer.getBounds());
  dimOutside(boundary);

  // 2) Buildings
  const buildingLayer = L.geoJSON(buildings, {
    style: {
      color: "#2C3E50",
      weight: 1.4,
      lineJoin: "round",
      fillColor: "#A9CCE3",
      fillOpacity: 0.85
    },
    onEachFeature: (feature, layer) => {
      allFeatures.push(layer);
      layer.bindPopup(
        `<div class="popup-title">${feature.properties.name || "Building"}</div>
         <div class="popup-desc">${feature.properties.description || ""}</div>`
      );
    }
  }).addTo(map);

  // 3) Paths – outline + fill for a nice road look
  const pathOutline = L.geoJSON(paths, {
    style: { color: "#323232", weight: 6, opacity: 0.85 }
  }).addTo(map);

  const pathFill = L.geoJSON(paths, {
    style: {
      color: "#c5c1ba",     // warm grey works on cream base
      weight: 4,
      opacity: 1,
      lineJoin: "round",
      lineCap: "round"
    }
  }).addTo(map);

  // 4) POIs from GeoJSON (blue-ish markers for uniformity)
  const poiIcon = L.divIcon({
    html: `<div style="
      background:#ffffff; border:2px solid #6e44ff; width:26px; height:26px;
      border-radius:50%; display:flex; align-items:center; justify-content:center;
      box-shadow:0 0 10px rgba(110,68,255,.35); font-weight:700; color:#6e44ff;">•</div>`,
    className: "poi-icon",
    iconSize: [26, 26]
  });

  L.geoJSON(pois, {
    pointToLayer: (feature, latlng) =>
      L.marker(latlng, { icon: poiIcon }).bindPopup(
        `<b>${feature.properties.name || "POI"}</b><br>${feature.properties.type || ""}`
      )
  }).addTo(map);

  // Leaflet-Control-Geocoder (for general OSM geocoding view)
  L.Control.geocoder({
    defaultMarkGeocode: false,
    geocoder: L.Control.Geocoder.nominatim(),
    placeholder: "Search building or place..."
  })
    .on("markgeocode", e => map.fitBounds(e.geocode.bbox))
    .addTo(map);
});

// Dim everything outside the campus polygon
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

/* --------------------------
   Local POI list: clusters + search
---------------------------*/

// Category groups using marker clustering
const categories = {
  Departments: L.markerClusterGroup(),
  Hostels: L.markerClusterGroup(),
  Cafes: L.markerClusterGroup(),
  Sports: L.markerClusterGroup()
};

// Add POIs from poiData.js to clusters
poiList.forEach(poi => {
  const marker = L.marker(poi.coords, { title: poi.name })
    .bindTooltip(poi.name, { direction: "top" })
    .bindPopup(
      `<div style="text-align:center;">
        <h3 style="margin:6px 0 4px;">${poi.name}</h3>
        <p class="popup-desc">${poi.description || ""}</p>
        <p style="margin:6px 0;"><strong>Timings:</strong> ${poi.timings || "-"}</p>
      </div>`
    );

  if (categories[poi.category]) {
    categories[poi.category].addLayer(marker);
  }
});

// Add layer control for clusters
L.control.layers(null, categories, { collapsed: false }).addTo(map);

// Add cluster layers to map by default
Object.values(categories).forEach(group => map.addLayer(group));

/* --------------------------
   Simple search box (poiData.js)
---------------------------*/
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
export default map