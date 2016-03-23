'use strict';

let fs = require('filesaver.js');
let JSZip = require('jszip');

let viewport = require('./viewport.js');
let printer = require('./printer.js');
let ui = require('./ui.js');

////////////////////////////////////////////////////////////////////////////////

// Create a 2D canvas to store our rendered image
let canvas = document.createElement('canvas');
canvas.width = printer.resolution.x;
canvas.height = printer.resolution.y;
let context = canvas.getContext('2d');

let zip = null;
let slices = null;

function next(i, n)
{
    if (i < n)
    {
        let data = viewport.getSliceAt(i / n);

        // Copy the pixels to a 2D canvas
        let image = context.createImageData(
                printer.resolution.x, printer.resolution.y);
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

        if (i == n - 1)
        {
            ui.setStatus("Saving .zip file...");
        }
        requestAnimationFrame(function() { next(i + 1, n); });
    }
    else
    {
        let content = zip.generate({type: 'blob', compression: 'DEFLATE'});
        let zipName = document.getElementById("filename").value
        fs.saveAs(content, zipName);
        ui.setStatus("");
        ui.enableButtons();
    }
}

// Assign callback to the "slices" button
document.getElementById("slice").onclick = function(event)
{
    if (!viewport.hasModel())
    {
        ui.setStatus("No model loaded!");
        return;
    }

    ui.disableButtons();

    let microns = document.getElementById("height").value;
    let bounds = viewport.getBounds();

    // We map 3 inches to +/-1 on the X axis, so we use that ratio
    // to convert to Z in inches
    let zrange_mm = (bounds.zmax - bounds.zmin) / printer.getGLscale();
    let count = Math.ceil(zrange_mm * 1000 / microns);

    zip = new JSZip();
    ui.setStatus("Slicing...");
    slices = zip.folder("slices");
    next(0, count);
}
