export const VERT = `#version 300 es
precision highp float;
layout(location=0) in vec2 a_pos;
out vec2 v_uv;
void main(){
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

export const FRAG = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_look;
uniform float u_chant;
uniform float u_depth;
uniform float u_bloom;
uniform float u_warp;
uniform vec3 u_tint;

float hash(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p){
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec2 rotate(vec2 p, float a){
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * p;
}

float mandala(vec2 p, float t, float depth){
  float r = length(p);
  float ang = atan(p.y, p.x);
  float petals = 6.0 + floor(depth) * 2.0;
  float wave = sin(ang * petals + t * 1.4 + r * 8.0 - depth);
  float rings = abs(sin(r * (9.0 + depth) - t * 2.0 + wave * 0.6));
  float spokes = abs(sin(ang * (petals * 0.5) + t + fbm(p * 3.0 + t * 0.2) * 2.0));
  float core = smoothstep(0.22, 0.0, r);
  float band = smoothstep(0.08, 0.0, rings) * smoothstep(1.35, 0.15, r);
  float lace = pow(1.0 - spokes, 8.0) * smoothstep(1.2, 0.2, r);
  return band * 0.85 + lace * 0.55 + core * (1.2 + u_chant * 0.8);
}

float fluid(vec2 p, float t){
  vec2 q = p;
  q += 0.35 * vec2(
    fbm(p * 1.8 + vec2(t * 0.15, -t * 0.11)),
    fbm(p * 1.8 + vec2(-t * 0.13, t * 0.17) + 3.1)
  );
  q += 0.2 * vec2(
    fbm(q * 3.2 - t * 0.2),
    fbm(q * 3.2 + t * 0.18 + 5.7)
  );
  return fbm(q * 2.4 + t * 0.08);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  float t = u_time;
  float breath = 0.92 + 0.08 * sin(t * 0.7);
  float lookPull = length(u_look);

  vec2 p = uv;
  p -= u_look * 0.35;
  p = rotate(p, t * 0.08 + u_depth * 0.15 + u_look.x * 0.4);
  p *= breath * (1.0 - u_warp * 0.35);
  p += u_look * 0.12 * sin(t + length(uv) * 4.0);

  // Non-Euclidean fold
  vec2 folded = p;
  folded = abs(folded);
  folded = rotate(folded, sin(t * 0.3 + u_depth) * 0.5 + lookPull);
  folded.x += sin(folded.y * 6.0 + t) * 0.04 * (1.0 + u_chant);

  float field = fluid(folded * (1.4 + u_depth * 0.08), t);
  float m = mandala(folded * (0.95 + u_chant * 0.15), t, u_depth);
  float moire = sin((folded.x + folded.y) * 40.0 + t * 3.0) *
                sin((folded.x - folded.y) * 38.0 - t * 2.5);
  moire = moire * 0.5 + 0.5;

  float glow = m + field * 0.55 + moire * 0.12 * (0.4 + u_chant);
  glow += u_bloom * 0.45 * smoothstep(1.1, 0.0, length(uv));

  // Psychedelic palette — saffron / cyan / acid / ember on void
  vec3 voidCol = vec3(0.02, 0.01, 0.04);
  vec3 saffron = vec3(0.96, 0.64, 0.38);
  vec3 cyan = vec3(0.0, 0.9, 1.0);
  vec3 acid = vec3(0.5, 1.0, 0.45);
  vec3 ember = vec3(1.0, 0.3, 0.43);

  float hueShift = field * 1.4 + u_depth * 0.2 + t * 0.05 + lookPull * 0.5;
  vec3 c1 = mix(saffron, cyan, smoothstep(0.2, 0.8, sin(hueShift) * 0.5 + 0.5));
  vec3 c2 = mix(ember, acid, smoothstep(0.1, 0.9, cos(hueShift * 1.3 + m) * 0.5 + 0.5));
  vec3 col = mix(voidCol, c1, clamp(glow * 0.85, 0.0, 1.4));
  col = mix(col, c2, clamp(m * 0.55 + field * 0.25, 0.0, 1.0));
  col += acid * pow(max(m - 0.4, 0.0), 2.0) * 0.6;
  col += cyan * u_chant * 0.15 * (0.5 + 0.5 * sin(t * 8.0 + length(p) * 20.0));
  col *= mix(vec3(1.0), u_tint, 0.35);

  // Chromatic aberration
  float aberr = 0.004 + u_chant * 0.012 + lookPull * 0.008 + u_warp * 0.01;
  vec2 dir = normalize(uv + 1e-5);
  float rCh = glow;
  float gCh = mandala(folded * (0.95 + u_chant * 0.15) - dir * aberr * 18.0, t, u_depth)
            + field * 0.5;
  float bCh = mandala(folded * (0.95 + u_chant * 0.15) + dir * aberr * 22.0, t, u_depth)
            + fluid(folded * 1.4 + dir * aberr * 10.0, t) * 0.55;

  col.r = mix(col.r, rCh * saffron.r + col.r, 0.35);
  col.g = mix(col.g, gCh * cyan.g * 0.5 + col.g, 0.3);
  col.b = mix(col.b, bCh * acid.b * 0.4 + col.b, 0.35);

  // Vignette + film grain
  float vig = smoothstep(1.35, 0.25, length(uv * vec2(1.05, 1.15)));
  col *= vig;
  float grain = (hash(gl_FragCoord.xy + fract(t * 17.0)) - 0.5) * 0.06;
  col += grain;

  // Soft bloom pulse in first seconds + ongoing
  float open = smoothstep(0.0, 1.0, u_bloom);
  col += mix(saffron, cyan, fract(t * 0.2)) * open * 0.25 * (1.0 - length(uv));

  col = pow(max(col, 0.0), vec3(0.92));
  fragColor = vec4(col, 1.0);
}`
