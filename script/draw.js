import { writeImageData } from "./firebase.js";

$("#drawr-container3 .demo-canvas").drawr({ "enable_tranparency" : true });
$("#drawr-container3 .demo-canvas").drawr("start");

//add submit button
$("#submit-btn").on("click",function(data){
    var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
    writeImageData("userInput", imagedata)
});

//add custom file picker button
var buttoncollection = $("#drawr-container3 .demo-canvas").drawr("button", {
    "icon":"mdi mdi-folder-open mdi-24px"
}).on("touchstart mousedown",function(){
    //alert("demo of a custom button with your own functionality!");
    $("#file-picker").click();
});

$("#file-picker")[0].onchange = function(){
    var file = $("#file-picker")[0].files[0];
    var reader = new FileReader();
    reader.onload = function(e) { 
        $("#drawr-container3 .demo-canvas").drawr("load",e.target.result);
    };
    reader.readAsDataURL(file);
};

// add custom file save button
var buttoncollection = $("#drawr-container3 .demo-canvas").drawr("button", {
    "icon":"mdi mdi-content-save mdi-24px"
}).on("touchstart mousedown",function(){
    var imagedata = $("#drawr-container3 .demo-canvas").drawr("export","image/png");
    var element = document.createElement('a');
    element.setAttribute('href', imagedata);// 'data:text/plain;charset=utf-8,' + encodeURIComponent("sillytext"));
    element.setAttribute('download', "test.png");
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
});