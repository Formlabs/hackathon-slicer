'use strict';

var glslify = require('glslify')
var upload  = require('./upload.js');

var canvas = document.getElementById("canvas");
var gl = canvas.getContext("experimental-webgl");

function build_shader(txt, type)
{
    var s = gl.createShader(type);
    gl.shaderSource(s, txt);
    gl.compileShader(s);

    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    {
        throw "Could not compile shader:" + gl.getShaderInfoLog(s);
    }
    return s;
}

function make_program()
{
    var v = build_shader(
        glslify(__dirname + '/../shaders/base-2d.vert'), gl.VERTEX_SHADER);
    var f = build_shader(
        glslify(__dirname + '/../shaders/base-2d.frag'), gl.FRAGMENT_SHADER);

    var prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);

    return prog;
}

function main()
{
    var prog = make_program();
    gl.useProgram(prog);

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0]),
        gl.STATIC_DRAW);
    var vpos_loc = gl.getAttribLocation(prog, "vert_pos");
    gl.enableVertexAttribArray(vpos_loc);
    gl.vertexAttribPointer(vpos_loc, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(gl.getUniformLocation(prog, "width"), canvas.width);
    gl.uniform1f(gl.getUniformLocation(prog, "height"), canvas.height);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

main();
