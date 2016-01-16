attribute vec2 v; // Vertex position

uniform mat4 view; // Model transform matrix
uniform mediump float zmin; // Z position of plane
uniform mediump float aspect; // Aspect ratio

varying mediump vec2 uv;

void main() {
    gl_Position = view * vec4(v.x * aspect, v.y, zmin - 0.01, 1);
    uv = (vec2(v.x * aspect, v.y) + 1.0) / 2.0;
}
