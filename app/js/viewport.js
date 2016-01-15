'use strict';

let _ = require('underscore');
let glslify = require('glslify')
let glm = require('gl-matrix');

////////////////////////////////////////////////////////////////////////////////

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

let mouse = {};

// Model object
let mesh = {"loaded": false, "roll": 0, "pitch": 0};
let quad = makeQuad();

let scene = {"roll": 0, "pitch": 0};

////////////////////////////////////////////////////////////////////////////////

document.getElementById("slider").oninput = function(event)
{
    quad.frac = event.target.valueAsNumber / 100.0;
    draw();
}

////////////////////////////////////////////////////////////////////////////////

function mouseDownListener(event)
{
    mouse.down = true;
    mouse.pos = {"x": event.clientX,
                 "y": event.clientY};
    mouse.shift = event.shiftKey;
}

function mouseUpListener(event)
{
    mouse.down = false;
}

function mouseMoveListener(event)
{
    if (mouse.down)
    {
        if (mouse.shift)
        {
            mesh.roll  += (mouse.pos.x - event.clientX) / 100.0;
            mesh.pitch += (mouse.pos.y - event.clientY) / 100.0;
            getMeshBounds();
        }
        else
        {
            scene.roll  += (mouse.pos.x - event.clientX) / 100.0;
            scene.pitch += (mouse.pos.y - event.clientY) / 100.0;
        }

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

function makeProgram(vert, frag, uniforms, attribs)
{
    let v = buildShader(vert, gl.VERTEX_SHADER);
    let f = buildShader(frag, gl.FRAGMENT_SHADER);

    let prog = gl.createProgram();
    gl.attachShader(prog, v);
    gl.attachShader(prog, f);
    gl.linkProgram(prog);

    if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    {
        throw "Could not link program:" + gl.getProgramInfoLog(prog);
    }

    setUniforms(prog, uniforms);
    setAttribs(prog, attribs);

    return prog;
}

function makeMeshProgram()
{
    return makeProgram(
        glslify(__dirname + '/../shaders/mesh.vert'),
        glslify(__dirname + '/../shaders/mesh.frag'),
        ['view', 'model'], ['v', 'n']);
}

function makeQuadProgram()
{
    return makeProgram(
        glslify(__dirname + '/../shaders/quad.vert'),
        glslify(__dirname + '/../shaders/quad.frag'),
        ['view','tex','frac','bounds'], ['v']);
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
    let v = glm.mat4.create();
    glm.mat4.rotateX(v, v, scene.pitch);
    glm.mat4.rotateZ(v, v, scene.roll);
    glm.mat4.scale(v, v, [0.5, 0.5, 0.5]);

    return v;
}

function modelMatrix()
{
    let m = glm.mat4.create();
    glm.mat4.rotateZ(m, m, mesh.roll);
    glm.mat4.rotateX(m, m, mesh.pitch);

    let out = glm.mat4.create();
    glm.mat4.mul(out, m, mesh.M);
    return out;
}

function drawMesh(mesh)
{
    gl.useProgram(mesh.prog);

    gl.uniformMatrix4fv(mesh.prog.uniform.view, false, viewMatrix());
    gl.uniformMatrix4fv(mesh.prog.uniform.model, false, modelMatrix());

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vert);
    gl.enableVertexAttribArray(mesh.prog.attrib.v);
    gl.vertexAttribPointer(mesh.prog.attrib.v, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.norm);
    gl.enableVertexAttribArray(mesh.prog.attrib.n);
    gl.vertexAttribPointer(mesh.prog.attrib.n, 3, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);
}

function drawQuad(quad)
{
    gl.useProgram(quad.prog);

    gl.uniformMatrix4fv(quad.prog.uniform.view, false, viewMatrix());

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, quad.tex);
    gl.uniform1i(quad.prog.uniform.tex, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.vert);
    gl.enableVertexAttribArray(quad.prog.attrib.v);
    gl.vertexAttribPointer(quad.prog.attrib.v, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(quad.prog.uniform.frac, quad.frac);
    gl.uniform2f(quad.prog.uniform.bounds, mesh.bounds.zmin, mesh.bounds.zmax);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function draw()
{
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (mesh.loaded)
    {
        drawMesh(mesh);
        drawQuad(quad);
    }
}

function makeQuad()
{
    let quad = {};
    quad.prog = makeQuadProgram();
    quad.vert = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad.vert);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1,
                          -1,  1,
                           1, -1,
                           1,  1]),
        gl.STATIC_DRAW);

    quad.tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, quad.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 2, 0, gl.RGBA, gl.UNSIGNED_BYTE,
              new Uint8Array([255, 0, 255, 255, 0, 255, 255, 255]));

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    quad.frac = 0.5;
    return quad;
}

function getMeshBounds()
{
    let M = modelMatrix();

    let vs = _.map(mesh.verts, function(v){
        let out = glm.vec3.create();
        glm.mat4.mul(out, M, [v[0], v[1], v[2], 1]);
        return out;});

    // Find bounds and center, then store them in matrix M
    let xyz = _.unzip(vs);

    mesh.bounds = {};
    mesh.bounds.xmin = _.min(xyz[0]);
    mesh.bounds.xmax = _.max(xyz[0]);

    mesh.bounds.ymin = _.min(xyz[1]);
    mesh.bounds.ymax = _.max(xyz[1]);

    mesh.bounds.zmin = _.min(xyz[2]);
    mesh.bounds.zmax = _.max(xyz[2]);
}

function loadMesh(stl)
{
    // Reset pitch and roll
    mesh.roll = 0;
    mesh.pitch = 0;

    // Compile shader program for mesh
    mesh.prog = makeMeshProgram();

    // Store unique vertices
    mesh.verts = _.unique(stl.positions);

    // Create identity transform matrix
    mesh.M = glm.mat4.create();

    // Find bounds and center, then store them in matrix M
    getMeshBounds();

    let scale = 1.5 / Math.sqrt(
        Math.pow(mesh.bounds.zmax - mesh.bounds.zmin, 2) +
        Math.pow(mesh.bounds.ymax - mesh.bounds.ymin, 2) +
        Math.pow(mesh.bounds.xmax - mesh.bounds.xmin, 2));

    // Store mesh transform matrix
    mesh.M = glm.mat4.create();
    glm.mat4.scale(mesh.M, mesh.M, [scale, scale, scale]);
    glm.mat4.translate(mesh.M, mesh.M, [
        -(mesh.bounds.xmin + mesh.bounds.xmax) / 2,
        -(mesh.bounds.ymin + mesh.bounds.ymax) / 2,
        -(mesh.bounds.zmin + mesh.bounds.zmax) / 2]);

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

    // Get bounds with new transform matrix applied
    getMeshBounds();
    mesh.loaded = true;

    draw();
}

module.exports = {'init': init, 'loadMesh': loadMesh};
