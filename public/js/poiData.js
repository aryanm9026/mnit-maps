// poiData.js
// No exports, just a global variable

const poiList = [
  {
    name: "Central Library",
    coords: [26.8635, 75.8112],
    category: "Departments",
    description: "MNIT's main library with thousands of books.",
    timings: "9:00 AM - 8:00 PM"
  },
  {
    name: "Boys Hostel 1",
    coords: [26.8650, 75.8125],
    category: "Hostels",
    description: "Comfortable accommodation for students.",
    timings: "24/7"
  },
  {
    name: "Campus Cafe",
    coords: [26.8642, 75.8105],
    category: "Cafes",
    description: "Popular spot for snacks & coffee.",
    timings: "8:00 AM - 10:00 PM"
  }
];

// Make it available globally
window.poiList = poiList;
