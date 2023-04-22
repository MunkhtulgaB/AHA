import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, ref, set, push, child, get } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"

const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase();



// Helper methods
function writeUserData(userId, name, email, imageUrl) {
    set(ref(db, 'users/' + userId), {
        username: name,
        email: email,
        profile_picture : imageUrl
    });
}


function writeImageData(name, imageBase64) {
  push(ref(db, 'images/'), {
    name: name,
    imageBase64: imageBase64
  });
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

export { writeImageData }