let userMarker = null;
let userAccuracyCircle = null;
let autoFollow = true;

// --- Pulsing icon (CSS needed separately) ---
function makePulsingIcon() {
  return L.divIcon({
    className: "",
    html: '<div class="pulse-marker pulse-flicker"></div>',
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  });
}

// --- Smooth transition for marker movement ---
function smoothMoveMarker(marker, fromLatLng, toLatLng, duration = 500) {
  const start = performance.now();

  function animate(time) {
    const progress = Math.min((time - start) / duration, 1);

    const lat = fromLatLng.lat + (toLatLng.lat - fromLatLng.lat) * progress;
    const lng = fromLatLng.lng + (toLatLng.lng - fromLatLng.lng) * progress;

    marker.setLatLng([lat, lng]);

    if (progress < 1) {
      requestAnimationFrame(animate);
    }
  }

  requestAnimationFrame(animate);
}

// --- Handle user position updates ---
function handlePosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const newLatLng = L.latLng(lat, lng);

  if (!userMarker) {
    // First time → just place marker
    userMarker = L.marker(newLatLng, {
      icon: makePulsingIcon(),
      zIndexOffset: 1000
    }).addTo(map).bindPopup("📍 You are here").openPopup();
  } else {
    // Smooth transition
    const oldLatLng = userMarker.getLatLng();
    smoothMoveMarker(userMarker, oldLatLng, newLatLng, 600);
  }

  // Accuracy circle
  if (userAccuracyCircle) map.removeLayer(userAccuracyCircle);
  userAccuracyCircle = L.circle(newLatLng, {
    radius: position.coords.accuracy || 20,
    color: "#2680ff",
    weight: 1,
    fillColor: "#2680ff",
    fillOpacity: 0.12
  }).addTo(map);

  // Auto-follow user
  if (autoFollow) {
    map.panTo(newLatLng, { animate: true, duration: 0.5 });
  }
}

// --- Stop following when user drags the map ---
map.on("dragstart", () => {
  autoFollow = false;
});

// --- Button to re-enable following ---
window.enableFollowMe = function () {
  autoFollow = true;
  if (userMarker) {
    map.panTo(userMarker.getLatLng(), { animate: true, duration: 0.5 });
  }
};

// --- Start watching user location ---
navigator.geolocation.watchPosition(handlePosition, console.error, {
  enableHighAccuracy: true,
  maximumAge: 1000,
  timeout: 10000,
});

