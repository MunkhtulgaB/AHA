import { writeUserData, writeImageData } from "./firebase.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, ref, update} from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js";


const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);


const eye_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
<path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
<path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
</svg>`

const eye_slash_icon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash" viewBox="0 0 16 16">
<path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
<path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
<path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
</svg>`


onAuthStateChanged(auth, (user) => {
    if (user) {
        const imagesRef = ref(db, "images");
        onChildAdded(imagesRef, function(data) {
            const imgData = data.val();
            console.log("loaded image", imgData.name);
            const imgBase64 = imgData.imageBase64;
            const btn = $(`<a href="#" key="${data.key}" class="btn ${ (imgData.isHidden) ? "btn-secondary": "btn-light" }">
                            ${(imgData.isHidden) ? eye_slash_icon : eye_icon}
                        </a>`)
            btn.unbind("click").click((imgData.isHidden) ? showImage: hideImage);
            const content =             
            `<div id="card${data.key}" class="img-card card">
                <img class="card-img-top" id="${data.key}" src="${imgBase64}"/>
                <div class="card-body card-body-admin">
                </div>
            </div>`;

            if (imgData.isHidden) {
                $(content).hide().appendTo("#img_wall").fadeIn(1000);
            } else {
                $(content).hide().prependTo("#img_wall").fadeIn(1000);
            }
            btn.appendTo(`#card${data.key} .card-body`);

            // Add image metadata
            ["name", "description", "authorType"].forEach(function(attr) {
                const imgInfo = $(`<div><b>${attr}</b>: ${imgData[attr]}</div>`);
                imgInfo.appendTo(`#card${data.key} .card-body`)
            });
            
            const excludedAttrs = ["imageBase64", "isHidden", "name", "description", "authorType"];
            for (const attr in imgData) {
                if (!excludedAttrs.includes(attr)) {
                    const imgInfo = $(`<div><b>${attr}</b>: ${imgData[attr]}</div>`);
                    imgInfo.appendTo(`#card${data.key} .card-body`)
                }
            }
        });

        onChildRemoved(imagesRef, function(data) {
          $(`#card${data.key}`).remove();
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
            writeUserData(user.uid, user.displayName, user.email, user.photoURL);

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

function hideImage() {
    const imgKey = $(this).attr("key");
    console.log("Hiding image", imgKey);
    const updates = {};
    updates[`/images/${imgKey}/isHidden`] = true;
    update(ref(db), updates)
        .then(() => {
            console.log("update successful");
            const btn = $(`a[key=${imgKey}]`);
            btn.removeClass("btn-light");
            btn.addClass("btn-secondary");
            btn.html(eye_slash_icon);
            btn.unbind("click").click(showImage);
        });
}

function showImage() {
    const imgKey = $(this).attr("key");
    console.log("Showing image", imgKey);
    const updates = {};
    updates[`/images/${imgKey}/isHidden`] = false;
    update(ref(db), updates)
        .then(() => {
            console.log("update successful");
            const btn = $(`a[key=${imgKey}]`);
            btn.removeClass("btn-secondary");
            btn.addClass("btn-light");
            btn.html(eye_icon);
            btn.unbind("click").click(hideImage);
        });
}