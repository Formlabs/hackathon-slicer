'use strict';

let fs = require('filesaver.js');
let JSZip = require('JSZip');

let viewport = require('./viewport.js');

////////////////////////////////////////////////////////////////////////////////

// Create a 2D canvas to store our rendered image
let canvas = document.createElement('canvas');
canvas.width = viewport.resolution.x;
canvas.height = viewport.resolution.y;
let context = canvas.getContext('2d');

let zip = null;
let slices = null;

function next(i, n)
{
    if (i < n)
    {
        let data = viewport.getSliceAt(i / 100);

        // Copy the pixels to a 2D canvas
        let image = context.createImageData(
                viewport.resolution.x, viewport.resolution.y);
        image.data.set(data);

        // Load data into the context
        context.putImageData(image, 0, 0);

        // Convert data to a DataURL and save to the zip file
        let png = canvas.toDataURL();
        let index = i + "";
        while (index.length < 4) index = "0" + index;
        slices.file("out" + index + ".png",
                    png.slice(png.indexOf(',') + 1, -1),
                    {base64: true});

        requestAnimationFrame(function() { next(i + 1, n); });
    }
    else
    {
        let content = zip.generate({type: 'blob'});
        fs.saveAs(content, "slices.zip");
    }
}

// Assign callback to the "slices" button
document.getElementById("slice").onclick = function(event) {
    let microns = document.getElementById("height").value;

    zip = new JSZip();
    slices = zip.folder("slices");
    next(0, 100);
}
