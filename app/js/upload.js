'use strict';

let parseSTL = require('parse-stl');

let viewport = require('./viewport.js');
let ui = require('./ui.js');

document.getElementById("upload").onchange = function(event) {
    let fileInput = document.getElementById("upload");
    let file = fileInput.files[0];

    ui.setStatus("Loading...");
    ui.disableButtons();

    let reader = new FileReader();

    reader.onload = function() {
        let buf = new Buffer(reader.result);
        let mesh = parseSTL(buf);

        document.getElementById("filename").value = file.name.slice(0, -4);

        viewport.loadMesh(mesh);

        ui.setStatus("");
        ui.enableButtons();
    }
    reader.readAsArrayBuffer(file);
}
