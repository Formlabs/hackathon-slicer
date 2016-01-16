'use strict';

let parseSTL = require('parse-stl');

let viewport = require('./viewport.js');
let ui = require('./ui.js');

document.getElementById("upload").onchange = function(evt) {
    let fileInput = document.getElementById("upload");
    let file = fileInput.files[0];

    ui.setStatus("Loading...");
    ui.disableButtons();

    let reader = new FileReader();

    reader.onload = function() {
        let buf = new Buffer(reader.result);
        let mesh = parseSTL(buf);
        viewport.loadMesh(mesh);

        ui.setStatus("");
        ui.enableButtons();
    }
    reader.readAsArrayBuffer(file);
}
