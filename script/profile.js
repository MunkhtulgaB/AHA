import { writeUserData, writeImageData, updateImageData } from "./firebase.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, onChildChanged, ref, set, push, child, get } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js";


const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);


onAuthStateChanged(auth, (user) => {
    if (user) {
        const imagesRef = ref(db, "images");
        console.log(user.uid);
        
        // Show user data 
        const userInfo = $(`
            <div id="user-info" style="margin: 20px">
                <img src="${user.photoURL}">
                <p>${user.displayName}</p>
            </div>        
        `)
        userInfo.prependTo("#coverContent");

        // If user is logged in, show sign-out button
        $("#signin-btn").html("Sign out");
        $("#signin-btn").click(signUserOut)
    } else {
        // If no user, show sign-in button
        console.log("No user logged in");
        $("#signin-btn").html("Sign in");
        $("#signin-btn").click(signInUser);
    }
});


function signUserOut() {
    signOut(auth).then(() => {
        console.log("Sign out successful");
        $(this).html("Sign in");
        $("#user-info").remove();
    }).catch((error) => {
        console.error(error)
    });
}


function signInUser() {
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
        writeUserData(user.uid, user.displayName, user.email, user.photoURL)
        
        $(this).html("Sign out");
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