import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, ref, set, push, child, get, update } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"

const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();



// Helper methods
function writeUserData(userId, name, email, imageUrl) {
  const write_location = 'users/' + userId;
  
  return get(child(ref(db), write_location))
  .then((snapshot) => {
    if (!snapshot.exists()) {
      return set(ref(db, write_location), {
        username: name,
        email: email,
        profile_picture : imageUrl
      });
    }
  });
}


function writeImageData(imgData) {
  return push(ref(db, 'images/'), imgData);
}


function updateImageData(imgKey, imgData) {
  const updates = {};

  for (const key in imgData) {
    updates[`images/${imgKey}/${key}`] = imgData[key];
  }
  return update(ref(db), updates);
}


function getData(userId) {
    get(child(ref(db), `users/${userId}`)).then((snapshot) => {
      if (snapshot.exists()) {
        console.log(snapshot.val());
      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });
}

export { writeUserData, writeImageData, updateImageData }