'use strict';

let _ = require('underscore');
let glslify = require('glslify')
let glm = require('gl-matrix');

////////////////////////////////////////////////////////////////////////////////

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

let mouse = {};
let roll = 0;
let pitch = 0;

// Model object
let mesh = {"loaded": false};
let quad = {};

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

function buildShader(txt, type)
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

function setUniforms(prog, u)
{
    prog.uniform = {};
    _.each(u, function(u){ prog.uniform[u] = gl.getUniformLocation(prog, u); });
}

function setAttribs(prog, a)
{
    prog.attrib = {};
    _.each(a, function(a){ prog.attrib[a] = gl.getAttribLocation(prog, a); });
}

function makeMeshProgram()
{
    let v = buildShader(
        glslify(__dirname + '/../shaders/mesh.vert'), gl.VERTEX_SHADER);
    let f = buildShader(
        glslify(__dirname + '/../shaders/mesh.frag'), gl.FRAGMENT_SHADER);

    let prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    {
        throw "Could not link program:" + gl.getProgramInfoLog(prog);
    }

    setUniforms(prog, ["view", "model"]);
    setAttribs(prog, ["v", "n"]);

    console.log(prog);
    return prog;
}

function init()
{
    canvas.addEventListener("mousedown", mouseDownListener, false);
    canvas.addEventListener("mousemove", mouseMoveListener, false);
    canvas.addEventListener("mouseup",   mouseUpListener, false);

    gl.enable(gl.DEPTH_TEST);
    draw();
}

function viewMatrix()
{
    let view = glm.mat4.create();
    glm.mat4.rotateY(view, view, roll);
    glm.mat4.rotateX(view, view, pitch);

    return view;
}

function draw()
{
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (mesh.loaded)
    {
        gl.useProgram(mesh.prog);

        gl.uniformMatrix4fv(mesh.prog.uniform.view, false, viewMatrix());
        gl.uniformMatrix4fv(mesh.prog.uniform.model, false, mesh.M);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
        gl.enableVertexAttribArray(mesh.prog.attrib.n);
        gl.vertexAttribPointer(mesh.prog.attrib.n, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vert);
        gl.enableVertexAttribArray(mesh.prog.attrib.v);
        gl.vertexAttribPointer(mesh.prog.attrib.v, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);
    }
}

function makeQuad()
{
    quad.vert = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad.vert);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1,
                          -1,  1,
                           1, -1,
                           1,  1]),
        gl.STATIC_DRAW);
}

function loadMesh(stl)
{
    // Compile shader program for mesh
    mesh.prog = makeMeshProgram();

    // Find bounds and center, then store them in matrix M
    let xyz = _.unzip(stl.positions);

    let xmin = _.min(xyz[0]);
    let xmax = _.max(xyz[0]);

    let ymin = _.min(xyz[1]);
    let ymax = _.max(xyz[1]);

    let zmin = _.min(xyz[2]);
    let zmax = _.max(xyz[2]);

    let scale = 1.5 / _.max([zmax - zmin, ymax - ymin, xmax - xmin]);

    // Store mesh transform matrix
    mesh.M = glm.mat4.create();
    glm.mat4.scale(mesh.M, mesh.M, glm.vec3.fromValues(scale, scale, scale));
    glm.mat4.translate(mesh.M, mesh.M, glm.vec3.fromValues(-(xmin + xmax) / 2,
                                                           -(ymin + ymax) / 2,
                                                           -(zmin + zmax) / 2));

    // Load vertex positions into a buffer
    let flattened = _.flatten(stl.positions);
    mesh.vert = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vert);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(flattened),
        gl.STATIC_DRAW);

    // Load normals into a second buffer
    let norms = new Float32Array(flattened.length);
    for (let i=0; i < stl.positions.length; i += 3)
    {
        let a = glm.vec3.create();
        let b = glm.vec3.create();
        let c = glm.vec3.create();

        glm.vec3.sub(a, stl.positions[i], stl.positions[i+1]);
        glm.vec3.sub(b, stl.positions[i], stl.positions[i+2]);
        glm.vec3.cross(c, a, b);
        glm.vec3.normalize(c, c);

        for (let j=0; j < 3; ++j)
        {
            for (let k=0; k < 3; ++k)
            {
                norms[i*3 + j*3 + k] = c[k];
            }
        }
    }
    mesh.norm = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        norms,
        gl.STATIC_DRAW);

    // Store the number of triangles
    mesh.triangles = stl.positions.length;

    mesh.loaded = true;

    draw();
}

module.exports = {'init': init, 'loadMesh': loadMesh};
