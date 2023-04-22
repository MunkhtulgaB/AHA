import { writeImageData } from "./firebase.js";

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