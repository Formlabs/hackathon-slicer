attribute vec3 v; // Vertex position

uniform mat4 model; // Model transform matrix
uniform mediump vec2 bounds; // Z bounds
uniform mediump float frac;  // Z fraction (0 to 1)
uniform mediump float aspect; // Aspect ratio

void main() {
    float fz = (1.0 - frac) * bounds[0] + frac * bounds[1];
    gl_Position = model * vec4(v, 1);
    gl_Position.z += (1.0 - fz);
    gl_Position.x /= aspect;
}
