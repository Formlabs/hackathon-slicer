'use strict';

let _ = require('underscore');
let glslify = require('glslify')
let glm = require('gl-matrix');

////////////////////////////////////////////////////////////////////////////////

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

let mesh_prog = makeMeshProgram();

let mouse = {};
let roll = 0;
let pitch = 0;

// Model object
let mesh = {"loaded": false};

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

    prog.uniform = {}
    prog.uniform.view = gl.getUniformLocation(prog, "view");
    prog.uniform.model = gl.getUniformLocation(prog, "model");

    prog.attrib = {}
    prog.attrib.vert = gl.getAttribLocation(prog, "v");
    prog.attrib.norm = gl.getAttribLocation(prog, "n");

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
        gl.useProgram(mesh_prog);

        gl.uniformMatrix4fv(mesh_prog.uniform.view, false, viewMatrix());
        gl.uniformMatrix4fv(mesh_prog.uniform.model, false, mesh.M);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
        gl.enableVertexAttribArray(mesh_prog.attrib.norm);
        gl.vertexAttribPointer(mesh_prog.attrib.norm, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vert);
        gl.enableVertexAttribArray(mesh_prog.attrib.vert);
        gl.vertexAttribPointer(mesh_prog.attrib.vert, 3, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);
    }
}

function makeQuad()
{

}

function loadMesh(stl)
{
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
