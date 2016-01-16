'use strict';

let _ = require('underscore');
let glslify = require('glslify')
let glm = require('gl-matrix');

////////////////////////////////////////////////////////////////////////////////

let ui = require('./ui.js');
let printer = require('./printer.js');

let canvas = document.getElementById("canvas");
let gl = canvas.getContext("experimental-webgl");

////////////////////////////////////////////////////////////////////////////////

let mouse = {};

// Model object
let mesh = {"loaded": false};
let quad = makeQuad();
let base = makeBase();

let scene = {"roll": 45, "pitch": 45};

let slice = makeSlice();

////////////////////////////////////////////////////////////////////////////////

function makeSlice()
{
    let slice = {"fbo": gl.createFramebuffer(),
                 "tex": gl.createTexture(),
                 "buf": gl.createRenderbuffer()};

    slice.prog = makeProgram(
        glslify(__dirname + '/../shaders/slice.vert'),
        glslify(__dirname + '/../shaders/slice.frag'),
        ['model','bounds','frac','aspect'], ['v']);

    gl.bindTexture(gl.TEXTURE_2D, slice.tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
                  printer.resolution.x, printer.resolution.y,
                  0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindTexture(gl.TEXTURE_2D, null);

    return slice;
}

////////////////////////////////////////////////////////////////////////////////

document.getElementById("slider").oninput = function(event)
{
    quad.frac = event.target.valueAsNumber / 100.0;
    renderSlice();
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
            renderSlice();
        }
        else
        {
            scene.roll  -= (mouse.pos.x - event.clientX) / 100.0;
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
    glm.mat4.scale(v, v, [1, 1, 0.5]);
    glm.mat4.rotateX(v, v, scene.pitch);
    glm.mat4.rotateZ(v, v, scene.roll);
    glm.mat4.scale(v, v, [0.5, 0.5, -0.5]);

    return v;
}

function modelMatrix()
{
    let m = glm.mat4.create();
    glm.mat4.rotateZ(m, m, mesh.roll);
    glm.mat4.rotateX(m, m, mesh.pitch);
    glm.mat4.rotateY(m, m, mesh.yaw);

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

function drawBase(base)
{
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.useProgram(base.prog);
    gl.uniformMatrix4fv(base.prog.uniform.view, false, viewMatrix());
    gl.uniform1f(base.prog.uniform.zmin, mesh.bounds.zmin);
    gl.uniform1f(base.prog.uniform.aspect, printer.aspectRatio());

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.bindBuffer(gl.ARRAY_BUFFER, base.vert);
    gl.enableVertexAttribArray(base.prog.attrib.v);
    gl.vertexAttribPointer(base.prog.attrib.v, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disable(gl.CULL_FACE);
}

function drawQuad(quad)
{
    gl.useProgram(quad.prog);

    gl.disable(gl.DEPTH_TEST);
    gl.uniformMatrix4fv(quad.prog.uniform.view, false, viewMatrix());

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, slice.tex);
    gl.uniform1i(quad.prog.uniform.tex, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, quad.vert);
    gl.enableVertexAttribArray(quad.prog.attrib.v);
    gl.vertexAttribPointer(quad.prog.attrib.v, 2, gl.FLOAT, false, 0, 0);

    gl.uniform1f(quad.prog.uniform.frac, quad.frac);
    gl.uniform1f(quad.prog.uniform.aspect, printer.aspectRatio());
    gl.uniform2f(quad.prog.uniform.bounds, mesh.bounds.zmin, mesh.bounds.zmax);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.enable(gl.DEPTH_TEST);
}

function draw()
{
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (mesh.loaded)
    {
        drawMesh(mesh, true);
        drawQuad(quad);
        drawBase(base);
    }
}

function makeQuad()
{
    let quad = {};
    quad.prog = makeProgram(
        glslify(__dirname + '/../shaders/quad.vert'),
        glslify(__dirname + '/../shaders/quad.frag'),
        ['view','tex','frac','aspect','bounds'], ['v']);

    quad.vert = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad.vert);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1,
                          -1,  1,
                           1, -1,
                           1,  1]),
        gl.STATIC_DRAW);

    quad.frac = 0.5;
    return quad;
}

function makeBase()
{
    let base = {};
    base.prog = makeProgram(
        glslify(__dirname + '/../shaders/base.vert'),
        glslify(__dirname + '/../shaders/base.frag'),
        ['view', 'zmin', 'aspect'], ['v']);

    base.vert = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, base.vert);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1,
                          -1,  1,
                           1, -1,
                           1,  1]),
        gl.STATIC_DRAW);

    base.frac = 0.5;
    return base;
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
    // Clear the status field
    ui.setStatus("");

    // Reset pitch and roll
    mesh.roll = 0;
    mesh.pitch = 0;
    mesh.yaw = 0;

    // Compile shader program for mesh
    mesh.prog = makeProgram(
        glslify(__dirname + '/../shaders/mesh.vert'),
        glslify(__dirname + '/../shaders/mesh.frag'),
        ['view', 'model'], ['v', 'n']);

    // Store unique vertices
    mesh.verts = stl.positions;

    // Create identity transform matrix
    mesh.M = glm.mat4.create();

    // Find bounds and center, then store them in matrix M
    getMeshBounds();

    let scale = 2 / Math.sqrt(
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

    renderSlice();
    draw();
}

////////////////////////////////////////////////////////////////////////////////

function renderSlice()
{
    // We won't be using the depth test in this rendering pass
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.STENCIL_TEST);
    gl.viewport(0, 0, printer.resolution.x, printer.resolution.y);

    // Bind the target framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, slice.fbo);

    // Attach our output texture
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D, slice.tex, 0);

    // Bind the renderbuffer to get a stencil buffer
    gl.bindRenderbuffer(gl.RENDERBUFFER, slice.buf);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL,
                           printer.resolution.x, printer.resolution.y);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT,
                               gl.RENDERBUFFER, slice.buf);

    // Clear texture
    gl.clearColor(0, 0, 0, 1);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    gl.useProgram(slice.prog);

    // Load model matrix
    gl.uniformMatrix4fv(slice.prog.uniform.model, false, modelMatrix());

    // Load slice position and mesh bounds
    gl.uniform1f(slice.prog.uniform.frac, quad.frac);
    gl.uniform1f(slice.prog.uniform.aspect, printer.aspectRatio());
    gl.uniform2f(slice.prog.uniform.bounds, mesh.bounds.zmin, mesh.bounds.zmax);

    // Load mesh vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.vert);
    gl.enableVertexAttribArray(mesh.prog.attrib.v);
    gl.vertexAttribPointer(mesh.prog.attrib.v, 3, gl.FLOAT, false, 0, 0);

    // Draw twice, adding and subtracting values in the stencil buffer
    // based on the handedness of faces that we encounter
    gl.stencilFunc(gl.ALWAYS, 0, 0xFF);
    gl.stencilOpSeparate(gl.BACK,  gl.KEEP, gl.KEEP, gl.INCR);
    gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);

    gl.stencilOpSeparate(gl.BACK,  gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.DECR);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);

    // Clear the color bit in preparation for a redraw
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw again, discarding samples if the stencil buffer != 0
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP, gl.KEEP);
    gl.stencilFunc(gl.NOTEQUAL, 0, 0xFF);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.triangles);

    // Load the data from the framebuffer
    let data = new Uint8Array(printer.pixels() * 4);
    gl.readPixels(0, 0, printer.resolution.x, printer.resolution.y, gl.RGBA,
                  gl.UNSIGNED_BYTE, data);

    // Restore the default framebuffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);

    gl.viewport(0, 0, canvas.width, canvas.height);

    return data;
}

function getSliceAt(frac)
{
    quad.frac = frac;
    document.getElementById("slider").valueAsNumber = frac * 100;
    draw();
    return renderSlice();
}

function getBounds()
{
    return mesh.bounds;
}

function hasModel()
{
    return mesh.loaded;
}

document.getElementById("rot_reset").onclick = function(event) {
    mesh.roll  = 0;
    mesh.pitch = 0;
    mesh.yaw = 0;
    getMeshBounds();
    renderSlice();
    draw();
}

document.getElementById("rot_x_plus").onclick = function(event) {
    mesh.pitch += Math.PI/2;
    getMeshBounds();
    renderSlice();
    draw();
}

document.getElementById("rot_x_minus").onclick = function(event) {
    mesh.pitch -= Math.PI/2;
    getMeshBounds();
    renderSlice();
    draw();
}


document.getElementById("rot_y_plus").onclick = function(event) {
    mesh.yaw += Math.PI/2;
    getMeshBounds();
    renderSlice();
    draw();
}

document.getElementById("rot_y_minus").onclick = function(event) {
    mesh.yaw -= Math.PI/2;
    getMeshBounds();
    renderSlice();
    draw();
}

document.getElementById("rot_z_plus").onclick = function(event) {
    mesh.roll  += Math.PI/2;
    getMeshBounds();
    renderSlice();
    draw();
}

document.getElementById("rot_z_minus").onclick = function(event) {
    mesh.roll  -= Math.PI/2;
    mesh.pitch += 0;
    getMeshBounds();
    renderSlice();
    draw();
}




module.exports = {'init': init,
                  'loadMesh': loadMesh,
                  'getSliceAt': getSliceAt,
                  'getBounds': getBounds,
                  'hasModel': hasModel};
