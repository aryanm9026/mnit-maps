import map from "./main.js"
const Arrowicon = L.icon({
  iconUrl: 'imgs/compass.png' ,
  iconSize: [26, 26],    
  iconAnchor: [13, 13],    
}) 

let usermarker = L.marker([26.864823, 75.808977],{
  icon: Arrowicon,
  rotationAngle: 0,



}).addTo(map)


navigator.geolocation.watchPosition(
  (position) =>{
    let lat = position.coords.latitude;
    let long = position.coords.longitude;
    usermarker.setLatLng([lat,long]);
  }
)