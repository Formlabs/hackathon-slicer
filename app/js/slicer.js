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
        let data = viewport.getSliceAt(i / n);

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

        if (i == n - 1)
        {
            viewport.setStatus("Saving .zip file...");
        }
        requestAnimationFrame(function() { next(i + 1, n); });
    }
    else
    {
        let content = zip.generate({type: 'blob'});
        fs.saveAs(content, "slices.zip");
        viewport.setStatus("");
        viewport.enableButtons();
    }
}

// Assign callback to the "slices" button
document.getElementById("slice").onclick = function(event)
{
    if (!viewport.hasModel())
    {
        viewport.setStatus("No model loaded!");
        return;
    }

    viewport.disableButtons();

    let microns = document.getElementById("height").value;
    let bounds = viewport.getBounds();

    // We map 3 inches to +/-1 on the X axis, so we use that ratio
    // to convert to Z in inches
    let zrange_um = (bounds.zmax - bounds.zmin) * (3 * 25.4e3) / 2.;
    let count = Math.floor(zrange_um / microns);

    zip = new JSZip();
    viewport.setStatus("Slicing...");
    slices = zip.folder("slices");
    next(0, count);
}
