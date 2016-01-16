'use strict';

let resolution = {"x": 1280, "y": 800};
let width_mm = 25.4 * 3;

function aspectRatio()
{
    return resolution.x / resolution.y;
}

function pixels()
{
    return resolution.x * resolution.y;
}

// Returns a scale ratio of OpenGL units per mm
function getGLscale()
{
    return 2 * aspectRatio() / width_mm;
}

module.exports = {'resolution': resolution,
                  'aspectRatio': aspectRatio,
                  'pixels': pixels,
                  'getGLscale': getGLscale};
