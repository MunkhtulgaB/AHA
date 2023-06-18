import { writeImageData } from "./firebase.js";


var current_object = null;
var inappropriate_attempt_count = 0;
const INAPPROPRIATE_ATTEMPT_LIMIT = 3;


$("#start-btn").click(function() {
    // Remove the cover content
    $("#coverContent").fadeOut(500, function() {
        $(this).remove();   
        // Replace with option screen
        const options = [
            "Bird",
            "Cat",
            "Dog",
            "Fish",
            "Horse",
            "Human",
            "Monkey",
            "Octopus",
            "Snake",
            "Spider",
            "Other"
        ];
        const optionButtons = options.map(function(option, idx) {
            return `<input type="radio" name="options" id="option${idx}" class="btn-check" autocomplete="off" value="${option}">
            <label class="btn btn-light" for="option${idx}">${option}</label>`
        })
        const optionScreen = $(`
            <div id="optionsContainer">
            <h2>Choose your animal/object</h2>
            <br>
            <div>
                ${optionButtons.join("")}
            </div>
            </div>
        `)
       
        optionScreen.hide().appendTo("#cover").fadeIn(500);
        $("input[name='options']").change(function() {
            const selected = $("input[name=options]:checked").val();
            current_object = selected;

            $("#optionsContainer").fadeOut(500, function() {
                initDrawInteraction();
                $("#cover").remove();
            })
        })
    });
})



function initDrawInteraction() {
    $("#canvas-header").html(current_object)
    $("#drawr-container3 .demo-canvas").drawr({ "enable_tranparency" : true, undo_max_levels: 100 });
    $("#drawr-container3 .demo-canvas").drawr("start");

    // add restart action
    $("#restart-btn").on("click", function() {
        $("#drawr-container3 .demo-canvas").drawr("stop");
        // Confirm with an overlay and reload
        const overlay = $(`
            <div id="overlay" style="z-index: 1000; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                <div id="overlayBackground" style="z-index: 1000; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5)">
                <div class="card" id="imgForm" onclick="event.stopPropagation()" style="z-index: 10000; position: absolute; margin: auto;
                    left: 0; right: 0; top: 0; bottom: 0; width: fit-content; height: fit-content;">

                    Do you really want to restart?
                    <div style="flex-direction: row">
                        <input id="confirm-restart" class="btn btn-danger" type="submit" value="Yes, restart">
                        <input id="cancel-restart" class="btn btn-success" type="submit" value="No, continue drawing">
                    </div>
                </div>
            </div>
        `)
        
        overlay.appendTo("body");
        $("#overlayBackground").on("click", (e) => {
            $("#overlay").remove();
            $("#drawr-container3 .demo-canvas").drawr("start");
        });

        $("#cancel-restart").click(removeOverlay);
        $("#confirm-restart").click(function() {
            location.reload();
        });
    });

    // add submit action
    $("#done-btn").on("click", function() {
        $("#drawr-container3 .demo-canvas").drawr("stop");
        var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
        const date = new Date();

        // Create overlay that asks for info
        const overlay = $(`
            <div id="overlay" style="z-index: 1000; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                <div id="overlayBackground" style="z-index: 1000; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5)">
                <div class="card" id="imgForm" onclick="event.stopPropagation()" style="z-index: 10000; position: absolute; margin: auto;
                    left: 0; right: 0; top: 0; bottom: 0; width: fit-content; height: fit-content;">

                    <label for="name">Suggest a <b>title</b> that accurately describes your drawing</label>
                    <input maxlength="80" type="text" id="name" name="name" placeholder="Cat from simple shapes"><br>
                    <label for="lname">Give more <b>details</b> on your drawing</label>
                    <textarea maxlength="150"  rows="5" placeholder="The big circle is the head, the three lines on each side are the whiskers..." type="text" id="description" name="description"></textarea>
                    <br>
                    <input id="submit-btn" type="submit" value="Submit">
                </div>
            </div>
        `)
        
        overlay.appendTo("body");
        $("#overlayBackground").on("click", removeOverlay);
        $("#submit-btn").on("click", onSubmit);
    });
    $("#container").hide().fadeIn(1000);
}


function removeOverlay() {
    $("#overlay").remove();
    $("#drawr-container3 .demo-canvas").drawr("start");
}


function onSubmit() {
    var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
    const date = new Date();

    const name = $("input#name").val();
    const description = $("textarea#description").val();


    // Before writing the image, check it is appropriate
    isAppropriate(imagedata)
        .then((result) => {
            console.log(result)
            if (result.isSafe) {
                console.log("Safe to write");
                writeImageData({
                    name: name || current_object, 
                    date: date.toDateString(),
                    imageBase64: imagedata,
                    authorType: "Human (anonymous)",
                    description: description,
                    objectType: current_object,
                    safetyAnnotations: result.safetyAnnotations
                }).then(() => {
                    console.log("Image write successful!")
                    $("#imgForm")
                        .empty()
                        .html(`<div class="text-center">Success! &#128079; &#127881; <br> Returning to start screen...`)

                    setTimeout(function() {
                        location.reload();
                    }, 3000);
                    // $("#overlay").remove();
                }).catch((error) => {
                    console.error(error);
                });
            } else {
                var alert_msg = "This image is possibly inappropriate. <br>Our AI filter says:";
                for (var key in result.reason) {
                    const likeliness = result.reason[key];
                    alert_msg += `<div>${likeliness.replace("_", " ")} <b>${key}</b> content.</div>`;
                }
                // Alert with an overlay
                $("#overlay").remove(); 
                $("#drawr-container3 .demo-canvas").drawr("stop");
                const actionText = (inappropriate_attempt_count == INAPPROPRIATE_ATTEMPT_LIMIT - 1) ? "Draw again" : "Edit drawing";
                const overlay = $(`
                    <div id="overlay" style="z-index: 1000; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
                        <div id="overlayBackground" style="z-index: 1000; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5)">
                        <div class="card" id="imgForm" onclick="event.stopPropagation()" style="z-index: 10000; position: absolute; margin: auto;
                            left: 0; right: 0; top: 0; bottom: 0; width: fit-content; height: fit-content;">
                            ${alert_msg}
                            <input id="edit_drawing" class="btn btn-success" value="${actionText}">
                        </div>
                    </div>
                `)
                
                var removeOverlay = function(e) {
                    $("#overlay").remove();
                    $("#drawr-container3 .demo-canvas").drawr("start");
                    inappropriate_attempt_count += 1;
                    if (inappropriate_attempt_count == INAPPROPRIATE_ATTEMPT_LIMIT) {
                        inappropriate_attempt_count = 0;
                        location.reload();
                    } 
                }
                overlay.appendTo("body");
                $("#overlayBackground").on("click", removeOverlay);
                $("#edit_drawing").on("click", removeOverlay);
            }
        });


}


function isAppropriate(imgBase64) {
    console.log("Checking if image is appropriate");
    
    return new Promise((resolve, reject) => {
        imgBase64 = imgBase64.replace(/^data:image\/(png|jpg|jpeg);base64,/, "");
        const api_endpoint = "https://vision.googleapis.com/v1/images:annotate";
        const request_data = {
            "requests": [
            {
                "image": {
                "content": imgBase64,
                },
                "features": [
                {
                    "type": "SAFE_SEARCH_DETECTION"
                }
                ]
            }
            ],
        };
        const payload = JSON.stringify(request_data);
        const handler = function(data, status) {
            if (status == "success") {
                const safetyAnnotations = data.responses[0].safeSearchAnnotation;

                const result = {};
                var isSafe = true;
                var reason = {}

                console.log(safetyAnnotations)
                // safety tests
                if (!safetyAnnotations.adult.toLowerCase().includes("unlikely")) {
                    isSafe = false;
                    reason.adult = safetyAnnotations.adult;
                }
                if (!safetyAnnotations.violence.toLowerCase().includes("unlikely")) {
                    isSafe = false;
                    reason.violence = safetyAnnotations.violence;
                }
                if (safetyAnnotations.racy.toLowerCase() == "very_likely") {
                    // safe contents are being classified as likely racy
                    isSafe = false;
                    reason.racy = safetyAnnotations.racy;
                }

                result.isSafe = isSafe;
                result.reason = reason;
                result.safetyAnnotations = safetyAnnotations;
                resolve(result);
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
    })
  }