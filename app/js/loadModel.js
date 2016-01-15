'use strict';
let parseSTL = require('parse-stl-binary');

module.exports = loadModel;

function loadModel(STLasArrayBuffer) {
    let buf = new Buffer(STLasArrayBuffer);
    let mesh = parseSTL(buf);
    console.log(mesh);
    console.log(STLasArrayBuffer.byteLength);
}
