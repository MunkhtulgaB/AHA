import { writeImageData } from "./firebase.js";

$("#drawr-container3 .demo-canvas").drawr({ "enable_tranparency" : true, undo_max_levels: 100 });
$("#drawr-container3 .demo-canvas").drawr("start");

//add submit button
$("#done-btn").on("click", function(){
    $("#drawr-container3 .demo-canvas").drawr("stop");
    var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
    const date = new Date();

    // Create overlay that asks for info
    const overlay = $(`
        <div id="overlay" style="z-index: 1000; position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
            <div id="overlayBackground" style="z-index: 1000; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5)">
            <div class="card" id="imgForm" onclick="event.stopPropagation()" style="z-index: 10000; position: absolute; margin: auto;
                left: 0; right: 0; top: 0; bottom: 0; width: fit-content; height: fit-content;">

                <label for="name">Title:</label>
                <input maxlength="30" type="text" id="name" name="name" placeholder="Cat from simple shapes"><br>
                <label for="lname">Description:</label>
                <textarea maxlength="150"  rows="5" placeholder="The big circle is the head, the three lines on each side are the whiskers..." type="text" id="description" name="description"></textarea>
                <br>
                <input id="submit-btn" type="submit" value="Submit">
            </div>
        </div>
    `)
    
    overlay.appendTo("body");
    $("#overlayBackground").on("click", (e) => {
        $("#overlay").remove();
        $("#drawr-container3 .demo-canvas").drawr("start");
    });
    $("#submit-btn").on("click", onSubmit);
});


function onSubmit() {
    var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
    const date = new Date();

    const name = $("input#name").val();
    const description = $("textarea#description").val();

    writeImageData({
        name: name, 
        date: date.toDateString(),
        imageBase64: imagedata,
        authorType: "Human (anonymous)",
        description: description,
    }).then(() => {
        console.log("Image write successful!")
        $("#imgForm")
            .empty()
            .html(`<div class="text-center">Success! &#128079; &#127881;`)

        // $("#overlay").remove();
    }).catch((error) => {
        console.error(error);
    });
}