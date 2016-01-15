attribute vec3 v; // Vertex position
attribute vec3 n; // Vertex normal

uniform mat4 m;

varying mediump vec3 norm;

void main() {
    gl_Position = m * vec4(v, 1);
    norm = abs(m * vec4(n, 1)).xyz;
}
