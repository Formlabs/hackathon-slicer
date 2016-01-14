uniform mediump float width;
uniform mediump float height;

void main() {
    gl_FragColor = vec4(gl_FragCoord.x/width,
                        gl_FragCoord.y/height, 0, 1);
}
