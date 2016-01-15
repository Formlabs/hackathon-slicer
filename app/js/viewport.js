'use strict';

////////////////////////////////////////////////////////////////////////////////

let glslify = require('glslify')
let glm = require('gl-matrix');

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

let prog = make_program();

let mouse = {};
let roll = 0;
let pitch = 0;

////////////////////////////////////////////////////////////////////////////////

function mouseDownListener(event)
{
    mouse.down = true;
    mouse.pos = {"x": event.clientX,
                 "y": event.clientY};
}

function mouseUpListener(event)
{
    mouse.down = false;
}

function mouseMoveListener(event)
{
    if (mouse.down)
    {
        roll  += (mouse.pos.x - event.clientX) / 100.0;
        pitch += (mouse.pos.y - event.clientY) / 100.0;

        mouse.pos = {"x": event.clientX,
                     "y": event.clientY};
        console.log(roll);
        console.log(pitch);
        draw();
    }
}

function build_shader(txt, type)
{
    let s = gl.createShader(type);
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
    let v = build_shader(
        glslify(__dirname + '/../shaders/base-3d.vert'), gl.VERTEX_SHADER);
    let f = build_shader(
        glslify(__dirname + '/../shaders/base-3d.frag'), gl.FRAGMENT_SHADER);

    let prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);

    return prog;
}

function init()
{
    canvas.addEventListener("mousedown", mouseDownListener, false);
    canvas.addEventListener("mousemove", mouseMoveListener, false);
    canvas.addEventListener("mouseup",   mouseUpListener, false);

    gl.useProgram(prog);

    let buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,

            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
             0.0, 0.0, 0.0,

             0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.0, 0.0, 0.0,

            -0.5,  0.5, -0.5,
            -0.5, -0.5, -0.5,
             0.0, 0.0, 0.0]),
        gl.STATIC_DRAW);

    gl.useProgram(prog);
    let v = gl.getAttribLocation(prog, "v");
    gl.enableVertexAttribArray(v);
    gl.vertexAttribPointer(v, 3, gl.FLOAT, false, 0, 0);

    draw();
}

function draw()
{
    let m = glm.mat4.create();
    console.log(glm.mat4.rotateX);
    glm.mat4.rotateX(m, m, pitch);
    glm.mat4.rotateY(m, m, roll);

    gl.uniformMatrix4fv(gl.getUniformLocation(prog, "m"), false, m);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 12);
}

module.exports = {'init': init};
