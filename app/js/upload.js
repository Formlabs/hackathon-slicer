'use strict';
let loadModel = require('./loadModel.js');
let viewport = require('./viewport.js');

document.getElementById("upload").onchange = function(evt) {
    let fileInput = document.getElementById("upload");
    let file = fileInput.files[0];

    viewport.setStatus("Loading...");
    viewport.disableButtons();

    let reader = new FileReader();

    reader.onload = function() {
        let STL = reader.result;
        loadModel(STL);
    }
    reader.readAsArrayBuffer(file);
}
