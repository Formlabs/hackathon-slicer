'use strict';
let parseSTL = require('parse-stl-binary');

module.exports = loadModel;

function loadModel(STLasArrayBuffer) {
    let buf = new Buffer(STLasArrayBuffer);
    let MESH = parseSTL(buf);
    console.log(MESH);
}
