varying mediump vec2 uv;

void main() {
    mediump float u = mod(uv.x * 10.0, 1.0);
    mediump float v = mod(uv.y * 10.0, 1.0);

    mediump float t = (u > 0.1 && u < 0.9 &&
                       v > 0.1 && v < 0.9) ? 0.3 : 0.5;
    gl_FragColor = vec4(t, t, t, 1);
}
