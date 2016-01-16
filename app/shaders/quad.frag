varying mediump vec2 uv;
uniform sampler2D tex;

void main()
{
    if (texture2D(tex, uv).r == 0.0)
    {
        discard;
    }
    gl_FragColor = vec4(texture2D(tex, uv).rgb, 0.5);
}
