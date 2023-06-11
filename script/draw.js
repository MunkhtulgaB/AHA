import { writeImageData } from "./firebase.js";


var current_object = null;


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

    writeImageData({
        name: name || current_object, 
        date: date.toDateString(),
        imageBase64: imagedata,
        authorType: "Human (anonymous)",
        description: description,
        objectType: current_object,
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
}