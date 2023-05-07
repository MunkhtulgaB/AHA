import { writeImageData } from "./firebase.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, onChildChanged, ref, set, push, child, get } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
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
        onChildAdded(imagesRef, addImage);
        onChildChanged(imagesRef, updateImage);
        onChildRemoved(imagesRef, function(data) {
          $(`div#card${data.key}`).remove();
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


function addImage(data, addPosition) {
  const imgData = data.val();
  console.log("loaded image", imgData.name);

  if (!imgData.isHidden) {
    // Add card image
    const content =             
      `<div id="card${data.key}" class="img-card card" style="width: 300px">
          <img class="card-img-top" id="${data.key}" src="${imgData.imageBase64}" width="300px;"/>
          <div class="card-body">
          </div>
      </div>`;

    if (addPosition == "end") {
      $(content).hide().appendTo("#img_wall").fadeIn(1000);
    } else {
      $(content).hide().prependTo("#img_wall").fadeIn(1000);
    }

    // Add card body
    const titleText = imgData.name;
    const title = $(`<div><b>${titleText}</b></div>`);
    title.appendTo(`#card${data.key} .card-body`);

    const descriptionText = imgData.description;
    if (descriptionText) {
      const description = $(`<div>${descriptionText}</div>`);
      description.appendTo(`#card${data.key} .card-body`);  
    }

    const authorTypeText = imgData.authorType;
    if (authorTypeText) {
      const authorType = $(`<div style="text-align: right;">${authorTypeText}</div>`)
      authorType.appendTo(`#card${data.key} .card-body`);
    }
  }
}

function updateImage(data) {
  const imgData = data.val();
  console.log("updating image", imgData.name);
  const imgBase64 = imgData.imageBase64;

  // In any case, remove the image card
  $(`div#card${data.key}`).remove();

  // Re-add it back at the end with the updates
  if (!imgData.isHidden) {
    addImage(data, "end");
  }
}