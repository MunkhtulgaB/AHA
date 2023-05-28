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
      `<div id="card${data.key}" class="img-card card">
          <img class="card-img-top" id="${data.key}" src="${imgData.imageBase64}" width="300px;"/>
          <div class="card-body" style="margin-top: 10px;">
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

    // Detect objects from image
    detectFromImage(data.key, imgData);
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


function detectFromImage(imgKey, data) {
  console.log("detecting from image", data.name);

  const imgBase64 = data.imageBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
  const api_endpoint = "https://vision.googleapis.com/v1/images:annotate";
  const request_data = {
      "requests": [
        {
          "image": {
            "content": imgBase64,
          },
          "features": [
            {
              "type": "OBJECT_LOCALIZATION",
              "maxResults": 3,
            }
          ]
        }
      ],
    };
  const payload = JSON.stringify(request_data);
  const handler = function(data, status) {
    if (status == "success") {
      annotateImage(imgKey, data["responses"][0]["localizedObjectAnnotations"]);
    }
  }
  
  $.ajax({
    url: `${api_endpoint}?key=AIzaSyDwb1Ng1tFKkM4xbMSCDaPjM5xcqB5auJc`, 
    type: "POST",
    data: payload, 
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: handler
  });
}


function annotateImage(imgKey, annotations) {
  annotations.forEach(function(annotation) {
    // Draw the bounding box
    const bbox = annotation["boundingPoly"]["normalizedVertices"];
    const normX = bbox[0].x;
    const normY = bbox[0].y;
    const normW = bbox[2].x - bbox[0].x;
    const normH = bbox[2].y - bbox[0].y;

    const width = $(`img#${imgKey}`).width();
    const height = $(`img#${imgKey}`).height();

    const x = width * normX, 
          y = height * normY, 
          w = width * normW, 
          h = height * normH;
    const bbox_div = $(`
      <div style="position: absolute; border: 5px solid blue;
            left: ${x}px; top: ${y}px; width: ${w}px; height: ${h}px">

      </div>
    `);
    bbox_div.hide().appendTo(`#card${imgKey}`).fadeIn(1000);

    // Add the label and confidence
    const label_div = $(`
        <div style="position: absolute; 
            padding: 2px;
            left: ${x}px; top: ${y + h}px; 
            color: blue; font-weight: bold;
            background-color: rgba(255, 255, 255, 0.8);">
          ${annotation.name} ${(annotation.score * 100).toFixed(1)}%
        </div>
    `);
    label_div.appendTo(`#card${imgKey}`).fadeIn(1000);
  });
}