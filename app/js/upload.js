'use strict';
var slicing = require('./slice.js');

document.getElementById("upload").onchange = function(evt) {
    let fileInput = document.getElementById("upload");
    let file = fileInput.files[0];

    let reader = new FileReader();

    reader.onload = function(evt) {
        let STL = reader.result;
        slice(STL);
    }
    reader.readAsArrayBuffer(file);
}
