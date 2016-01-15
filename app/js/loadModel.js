'use strict';
let parseSTL = require('parse-stl-binary');
let viewPort = require('./viewport.js');

module.exports = loadModel;

function loadModel(STLasArrayBuffer) {
    let buf = new Buffer(STLasArrayBuffer);
    let MESH = parseSTL(buf);
    console.log(MESH);
    viewPort.loadMesh(MESH);
}
