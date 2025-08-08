// Firebase config (replace with yours if different)
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
  el.title = text;
  el.textContent = '📍';

  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${text}</h3>`);

  const marker = new mapboxgl.Marker(el)
    .setLngLat(lngLat)
    .setPopup(popup)
    .addTo(map);

  // Click to toggle popup (important for mobile)
  el.addEventListener('click', () => {
    marker.togglePopup();
  });

  //  Right-click to delete
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



const memoryToggle = document.getElementById("memoryToggle");
const memoryPanel = document.getElementById("memoryPanel");
const closePanel = document.getElementById("closePanel");
const memoryList = document.getElementById("memoryList");
let allMarkers = []; // store references to markers

memoryToggle.addEventListener("click", () => {
  memoryPanel.classList.add("open");
});

closePanel.addEventListener("click", () => {
  memoryPanel.classList.remove("open");
});

// Helper: Get readable place name using reverse geocoding
async function getPlaceName(lat, lng) {
  const response = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`);
  const data = await response.json();
  return data.features[0]?.place_name || "Unknown place";
}

function createMarker(docId, lngLat, text) {
  const el = document.createElement('div');
  el.className = 'marker';
  el.title = text;
  el.textContent = '📍';

  const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`<h3>${text}</h3>`);

  const marker = new mapboxgl.Marker(el)
    .setLngLat(lngLat)
    .setPopup(popup)
    .addTo(map);

  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (confirm("Delete this memory?")) {
      db.collection("pins").doc(docId).delete().then(() => {
        el.remove();
        loadMemoryList(); // refresh panel
      });
    }
  });

  el.addEventListener('click', () => {
    marker.togglePopup();
  });

  allMarkers.push({ docId, marker, lngLat, text }); // store marker

  return marker;
}

// Load & display all memories
function loadMemoryList() {
  memoryList.innerHTML = "";
  allMarkers = [];

  db.collection("pins").get().then(async (querySnapshot) => {
    const promises = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const lngLat = [data.lng, data.lat];
      const caption = data.text;
      const customName = data.placeName || null;

      const marker = createMarker(doc.id, lngLat, caption);

      promises.push(
        getPlaceName(data.lat, data.lng).then(placeName => {
          const displayName = customName || placeName;

          const item = document.createElement('div');
          item.className = 'memory-item';

          item.innerHTML = `
            <div class="memory-place" contenteditable="true" data-doc="${doc.id}">${displayName}</div>
            <div class="memory-caption">${caption}</div>
          `;

          // On click, zoom to marker
          item.addEventListener('click', () => {
            map.flyTo({ center: lngLat, zoom: 8 });
            marker.togglePopup();
          });

          // On edit (blur), save to Firestore
          const placeDiv = item.querySelector(".memory-place");
          placeDiv.addEventListener("blur", () => {
            const newName = placeDiv.textContent.trim();
            db.collection("pins").doc(doc.id).update({ placeName: newName });
          });

          memoryList.appendChild(item);
        })
      );
    });

    await Promise.all(promises);
  });
}





    