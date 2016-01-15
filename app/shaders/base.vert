attribute vec2 v; // Vertex position

uniform mat4 view; // Model transform matrix
uniform mediump float zmin;

varying mediump vec2 uv;

void main() {
    gl_Position = view * vec4(v*0.8, zmin - 0.01, 1);
    uv = (v + 1.0) / 2.0;
}
