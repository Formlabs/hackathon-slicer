attribute vec3 v; // Vertex position
attribute vec3 n; // Vertex normal

uniform mat4 model;
uniform mat4 view;

varying mediump vec3 norm;

void main() {
    gl_Position = view * model * vec4(v, 1);
    gl_Position.w = (gl_Position.z + 1.0);
    norm = ((view * vec4(n, 1) + 1.0) / 2.0).xyz;
}
