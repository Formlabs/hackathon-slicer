attribute vec2 v; // Vertex position

uniform mat4 view;
uniform mediump vec2 bounds; // Z bounds
uniform mediump float frac;  // Z fraction (0 to 1)
uniform mediump float aspect; // Aspect ratio

varying mediump vec2 uv;

void main() {
    gl_Position = view * vec4(
            v.x * aspect, v.y,
            (1.0 - frac) * bounds[0] + frac * bounds[1], 1);
    gl_Position.w = (gl_Position.z + 1.0);
    uv = (v + 1.0) / 2.0;
}
