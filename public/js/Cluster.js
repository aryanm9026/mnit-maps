import map from "./main.js";

const Arrowicon = L.icon({
  iconUrl: "imgs/compass.png",
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

let usermarker = L.marker([26.864, 75.815], {
  icon: Arrowicon,
}).addTo(map);

function handlePosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;
  const speed = position.coords.speed;


  usermarker.setLatLng([lat, lng]);

  
  document.getElementById("speed").innerHTML =
    speed !== null ? `${speed.toFixed(2)} m/s` : "No speed data";


  map.setView([lat, lng], map.getZoom(), { animate: true });
}

function handleError(error) {
  console.error("Geolocation error:", error);
}

navigator.geolocation.watchPosition(handlePosition, handleError, {
  enableHighAccuracy: true,
  maximumAge: 1000,   
  timeout: 10000,     
});
