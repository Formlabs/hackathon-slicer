varying mediump vec3 norm;

void main() {
    mediump vec3 base3 = vec3(0.99, 0.96, 0.89);
    mediump vec3 base2 = vec3(0.92, 0.91, 0.83);
    mediump vec3 base00 = vec3(0.40, 0.48, 0.51);

    mediump float a = dot(norm, vec3(0.0, 0.0, -1.0));
    mediump float b = dot(norm, vec3(-0.57, 0.57, -0.57));

    gl_FragColor = vec4((a*base2 + (1.0 - a)*base00)*0.5 +
                        (b*base3 + (1.0 - b)*base00)*0.5, 1.0);
}
