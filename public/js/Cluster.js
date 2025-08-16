import map from "./main.js"

const Arrowicon = L.icon({
  iconUrl: '../imgs/compass.png' ,
  iconSize: [25, 25],    
  iconAnchor: [20, 20],    
}) 

let usermarker = L.marker([26.864823, 75.808977],{
  icon: Arrowicon,
  rotationAngle: 0,

}).addTo(map)