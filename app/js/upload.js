'use strict';
let loadModel = require('./loadModel.js');

document.getElementById("upload").onchange = function(evt) {
    let fileInput = document.getElementById("upload");
    let file = fileInput.files[0];

    let reader = new FileReader();

    reader.onload = function() {
        let STL = reader.result;
        loadModel(STL);
    }
    reader.readAsArrayBuffer(file);
}
