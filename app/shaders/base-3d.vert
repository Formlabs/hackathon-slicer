attribute vec3 v;

uniform mat4 m;

void main() {
    gl_Position = m * vec4(v, 1);
}
