
console.log("hi")

const map = L.map("map", { zoomControl: true }).setView([26.864, 75.815], 16);

const Arrowicon = L.icon({
  iconUrl: 'imgs/compass.png' ,
  iconSize: [40, 40],    
  iconAnchor: [20, 20],    
}) 

let usermarker = L.marker([26.864823, 75.808977],{
  icon: Arrowicon,
  rotationAngle: 0,



}).addTo(map)