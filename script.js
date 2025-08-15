// Firebase config 
const firebaseConfig = {
  apiKey: "AIzaSyAB23uWG6QXCJypFWI3k3g052Zkkuke8vE",
  authDomain: "pinningyoudown.firebaseapp.com",
  projectId: "pinningyoudown",
  storageBucket: "pinningyoudown.appspot.com",
  messagingSenderId: "112114120917",
  appId: "1:112114120917:web:e7e2362968aa4a9b5cca5c",
  measurementId: "G-2VEVMWB53P"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Initialize Mapbox
mapboxgl.accessToken = 'pk.eyJ1IjoicmlhbmFtIiwiYSI6ImNtOG85dThvZzAwZWUybHM4Y3kxc2NxMXkifQ.V8ORue4RIHI98JS4ZYipXQ';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/outdoors-v12',
  center: [78.9629, 20.5937], // Centered on India
  zoom: 2
});

// Create a marker element with popup and right-click delete
function createMarker(docId, lngLat, text) {
  const el = document.createElement('div');
  el.className = 'marker';
  el.textContent = '📍';

  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${text}</h3>`);

  const marker = new mapboxgl.Marker(el)
    .setLngLat(lngLat)
    .setPopup(popup)
    .addTo(map);

  // Show popup on hover
  el.addEventListener('mouseenter', () => {
    marker.togglePopup();
  });

  // Hide popup when hover ends
  el.addEventListener('mouseleave', () => {
    marker.togglePopup();
  });

  //  Optional: also toggle on click 
  // el.addEventListener('click', () => {
  //   marker.togglePopup();
  // });

  // Delete pin on right-click
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm("Delete this memory?")) {
      db.collection("pins").doc(docId).delete().then(() => {
        el.remove();
      });
    }
  });
}


// Load all existing pins
db.collection("pins").get().then((querySnapshot) => {
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    createMarker(doc.id, [data.lng, data.lat], data.text);
  });
});

// Add new pins on map click
map.on('click', (e) => {
  const lngLat = e.lngLat;
  const text = prompt("caption it!");

  if (text) {
    db.collection("pins").add({
      lng: lngLat.lng,
      lat: lngLat.lat,
      text: text
    }).then((docRef) => {
      createMarker(docRef.id, [lngLat.lng, lngLat.lat], text);
    });
  }
});

// Add zoom & rotation controls to the map
const nav = new mapboxgl.NavigationControl({
  visualizePitch: true, // optional: shows 3D pitch angle
  showZoom: true,       // shows the + / - zoom buttons
  showCompass: true     // shows the compass to rotate north
});
map.addControl(nav, 'bottom-right'); // or 'top-left', 'top-right', 'bottom-left'




    

