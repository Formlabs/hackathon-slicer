var canvas = document.getElementById("canvas");
var gl = canvas.getContext("experimental-webgl");

var glslify = require('glslify')
var src = glslify(__dirname + '/../shaders/base-2d.vert')
