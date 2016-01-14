attribute vec2 vert_pos

void main() {
    gl_Position = vec4(vert_pos, 0, 1);
}
