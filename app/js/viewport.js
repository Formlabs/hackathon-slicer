'use strict';


////////////////////////////////////////////////////////////////////////////////

let _ = require('underscore');
let glslify = require('glslify')
let glm = require('gl-matrix');

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

let prog = make_program();

let mouse = {};
let roll = 0;
let pitch = 0;
let triangles = 0;

// Model transform matrix
let M = glm.mat4.create();

let loaded = false;

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

    draw();
}

function draw()
{
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (loaded)
    {
        let m = glm.mat4.create();
        glm.mat4.rotateX(m, m, pitch);
        glm.mat4.rotateY(m, m, roll);
        glm.mat4.multiply(m, m, M);

        gl.uniformMatrix4fv(gl.getUniformLocation(prog, "m"), false, m);
        gl.drawArrays(gl.TRIANGLES, 0, triangles);
    }
}

function loadMesh(stl) {
    let buffer = gl.createBuffer();

    let flattened = _.flatten(stl.positions);
    let xyz = _.unzip(stl.positions);

    let xmin = _.min(xyz[0]);
    let xmax = _.max(xyz[0]);

    let ymin = _.min(xyz[1]);
    let ymax = _.max(xyz[1]);

    let zmin = _.min(xyz[2]);
    let zmax = _.max(xyz[2]);

    let scale = 1 / _.max([zmax - zmin, ymax - ymin, xmax - xmin]);
    M = glm.mat4.create();
    glm.mat4.scale(M, M, glm.vec3.fromValues(scale, scale, scale));
    glm.mat4.translate(M, M, glm.vec3.fromValues(-(xmin + xmax) / 2,
                                                 -(ymin + ymax) / 2,
                                                 -(zmin + zmax) / 2));

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(flattened),
        gl.STATIC_DRAW);

    gl.useProgram(prog);
    let v = gl.getAttribLocation(prog, "v");
    gl.enableVertexAttribArray(v);
    gl.vertexAttribPointer(v, 3, gl.FLOAT, false, 0, 0);

    triangles = stl.positions.length;

    loaded = true;
    draw();
}

module.exports = {'init': init, 'loadMesh': loadMesh};
