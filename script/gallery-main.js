import { writeImageData } from "./firebase.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, ref, set, push, child, get } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js";


const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);


onAuthStateChanged(auth, (user) => {
    if (user) {
        const imagesRef = ref(db, "images");
        onChildAdded(imagesRef, function(data) {
          const imgData = data.val();
          console.log("loaded image", imgData.name);
          const imgBase64 = imgData.imageBase64;
          $("#img_wall").append(
            `<img id="${data.key}" src="${imgBase64}" width="300px;"/>`
          )
        });
        onChildRemoved(imagesRef, function(data) {
          $(`img#${data.key}`).remove();
        });

    } else {
        // User is signed out
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
        .then((result) => {
            // This gives you a Google Access Token. You can use it to access the Google API.
            const credential = GoogleAuthProvider.credentialFromResult(result);
            const token = credential.accessToken;
            // The signed-in user info.
            const user = result.user;
            // IdP data available using getAdditionalUserInfo(result)
            // ...



        }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
            console.log(errorMessage)
        });
    }
});


const img_input = document.querySelector("#img");
img_input.addEventListener("change", function() {
    const img_name = img_input.value;
    const reader = new FileReader();
    reader.addEventListener("load", function() {
        const imgBase64 = reader.result;
        // document.querySelector("#img_container").src = imgBase64;
        writeImageData(img_name, imgBase64);
    });
    reader.readAsDataURL(this.files[0]);
})