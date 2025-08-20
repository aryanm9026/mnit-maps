function getIcon(category) {
  switch (category) {
    case "Departments":
      return L.icon({
        iconUrl: "../imgs/icons/departments-icon.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });
    case "Hostels":
      return L.icon({
        iconUrl: "../imgs/icons/hostel-icon.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });
    case "Cafes":
      return L.icon({
        iconUrl: "../imgs/icons/food-icon.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });
    default:
      return L.icon({
        iconUrl: "../imgs/icons/default-poi.png",
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28]
      });
  }
}
