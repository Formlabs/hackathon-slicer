attribute vec2 v; // Vertex position

uniform mat4 view;
uniform mediump vec2 bounds; // Z bounds
uniform mediump float frac;  // Z fraction (0 to 1)

varying mediump vec2 uv;

void main() {
    gl_Position = view * vec4(v, (1.0 - frac) * bounds[0] + frac * bounds[1], 1);
    uv = (v + 1.0) / 2.0;
}
