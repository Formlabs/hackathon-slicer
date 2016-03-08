'use strict';

let viewport = require('./viewport.js');
let parseSTL = require('parse-stl');

require('./upload.js');
require('./slicer.js');
var JSZip = require("jszip");

// Base-64 encoded example string, or false
let sample = false;

function main()
{
    viewport.init();
    window.requestAnimationFrame(function() {
        if (sample)
        {
            let buf = new Buffer(sample, 'base64');
            let zip = new JSZip(buf);
            let stl = new Buffer(zip.files["example.stl"].asBinary(), 'binary');
            let mesh = parseSTL(stl);
            viewport.loadMesh(mesh);
        }});
}

main();
