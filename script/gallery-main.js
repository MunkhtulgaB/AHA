import { writeUserData, writeImageData, updateImageData } from "./firebase.js";
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-app.js'
import { getDatabase, onChildAdded, onChildRemoved, onChildChanged, ref, set, push, child, get } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-database.js'
import { GoogleAuthProvider, getAuth, signInWithPopup, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.19.1/firebase-auth.js'
import { config } from "./config.js"
import "https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js";


const firebaseConfig = config;
const app = initializeApp(firebaseConfig);
const db = getDatabase();
const auth = getAuth(app);
const TOO_GENERIC_NAMES = ["animal"];
const MAX_ANNOTATIONS = 1;

const EXPLANATION_DURATION = 20 * 1000;
const INTERVAL = 60 * 1000; 
var interval_counter = 0



// showExplanation();
// setInterval(function() {
//   console.log(interval_counter);

//   showExplanation();
//   interval_counter += 1
// }, INTERVAL)


onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log(user)
        const imagesRef = ref(db, "images");
        writeUserData(user.uid, user.displayName, user.email, user.photoURL)
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


function addImage(data, addPosition) {
  const imgData = data.val();
  console.log("loaded image", imgData.name);

  if (!imgData.isHidden) {
    // Add card image
    const content =             
      `<div id="card${data.key}" class="img-card card">
          <img class="card-img-top" id="${data.key}" src="${imgData.imageBase64}"/>
          <div class="card-body">
          </div>
      </div>`;

    if (addPosition == "end") {
      $(content).hide().appendTo("#img_wall").fadeIn(1000);
    } else {
      $(content).hide().prependTo("#img_wall").fadeIn(1000);
    }

    // Add card body
    const titleText = imgData.name || "Untitled";
    const title = $(`<div><b>${titleText}</b></div>`);
    title.appendTo(`#card${data.key} .card-body`);

    const authorTypeText = imgData.authorType;
    if (authorTypeText) {
      const authorType = $(`<div style="text-align: right;">${authorTypeText}</div>`)
      authorType.appendTo(`#card${data.key} .card-body`);
    }

    // Detect objects from image
    const annotateTimeout = setTimeout(function() {
      if (imgData.annotations) {
        console.log("Reading annotation data from cache.")
        annotateImage(data.key, imgData.annotations);
      } else {
        console.log("Annotation data not cached. Detecting objects.")
        detectFromImage(data.key, imgData);
      }
    }, 1000)

  }
}


/* Currently, this method is only used to hide images */
function updateImage(data) {
  const imgData = data.val();
  console.log("updating image", imgData.name);
  const imgBase64 = imgData.imageBase64;

  const imgCard = $(`div#card${data.key}`);
  if (imgCard.length == 0 && !imgData.isHidden) {
    addImage(data, "end");
  } else if (imgCard.length > 0 && imgData.isHidden) {
    imgCard.remove();
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
              "maxResults": 2,
            }
          ]
        }
      ],
    };
  const payload = JSON.stringify(request_data);
  const handler = function(annotationData, status) {
    if (status == "success") {
      annotateImage(imgKey, annotationData["responses"][0]["localizedObjectAnnotations"]);
      cacheAnnotations(imgKey, annotationData["responses"][0]["localizedObjectAnnotations"]);
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


function cacheAnnotations(imgKey, annotations) {
  if (annotations) {
    updateImageData(imgKey, {"annotations": annotations});
  }
}


function annotateImage(imgKey, annotations) {
  if (!annotations) return;

  var num_annotations = 0;
  annotations.forEach(function(annotation) {
    // Skip generic annotations
    if (annotations.length > 1 && TOO_GENERIC_NAMES.includes(annotation.name.toLowerCase())) return;
    if (num_annotations >= MAX_ANNOTATIONS) return;

    // Draw the bounding box
    const bbox = annotation["boundingPoly"]["normalizedVertices"];
    console.log(bbox)

    if (!(bbox[0] && bbox[2])) {
      return;
    }

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
    num_annotations++;
  });
}


function showExplanation() {
  // Show explanation
  const explanation = $(`
    <div id="cover">
      <div id="coverContent" style="width: fit-content; background-color: white;">
        <div style="text-align: left; margin: 20px; display: flex; flex-direction: row;">
            <img src="images/card-example.drawio.png" width="300px">
            <div style="width: 400px; text-align: left; align-self: center; height: fit-content; margin: 20px;">
                <ol>
                <li class="mb-3">
                The blue box shows the <b>bounding box</b> of an object detected by an AI image processor 
                (Google's Cloud Vision).
                </li>
                <li class="mb-3">
                The annotation and percentage shows <b>the class</b> of object detected and the AI detector's <b>confidence</b> in the detection.
                </li>
                <li class="mb-3">
                The title is <b>either a prompt</b> used to generate the image if the image is AI-generated <b>or a user-provided title</b> describing what is depicted.
                </li>
                <li>
                Finally, the <b>author type</b> specifies whether the image was created by a human or an AI image generator.
                </li>
                </ol>

            </div>
        </div>        
      </div>
    </div>
  `)

  explanation.hide().appendTo("body").fadeIn(500);

  // Remove after a duration
  setTimeout(function() {
    explanation.fadeOut(500, function() {
      explanation.remove();
    });
  }, EXPLANATION_DURATION);
}