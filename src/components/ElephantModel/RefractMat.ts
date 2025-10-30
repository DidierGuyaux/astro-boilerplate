// RefractMat.ts
import * as THREE from 'three';

export function makeRefractMaterial(pageTex: THREE.Texture) {
  const uniforms = {
    tBackdrop:    { value: pageTex },             // html2canvas texture
    uResolution:  { value: new THREE.Vector2() }, // set below
    uIOR:         { value: 1.35 },
    uThickness:   { value: 0.06 },                // screen-space scale
    uRoughness:   { value: 0.04 },
    uFresnel:     { value: 0.08 },                // 0..1, reflect vs refract
  };

  const vert = /* glsl */`
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main(){
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewDir = -mv.xyz;                       // to camera in view space
      vNormal  = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * mv;
    }
  `;

  const frag = /* glsl */`
    uniform sampler2D tBackdrop;
    uniform vec2  uResolution;
    uniform float uIOR;
    uniform float uThickness;
    uniform float uRoughness;
    uniform float uFresnel;

    varying vec3 vNormal;
    varying vec3 vViewDir;

    // cheap Schlick
    float fresnelSchlick(float cosTheta, float F0){
      return F0 + (1.0 - F0) * pow(1.0 - cosTheta, 5.0);
    }

    void main() {
      vec3  N  = normalize(vNormal);
      vec3  V  = normalize(vViewDir);
      float eta = 1.0 / uIOR;
      // refract the view ray
      vec3 Rr = refract(-V, N, eta);

      // screen-space offset (xy only), scaled by thickness
      vec2 offset = Rr.xy * uThickness;

      // current pixel in screen UV
      vec2 uv = gl_FragCoord.xy / uResolution + offset;

      // optional "roughness" blur by multi-sample (very cheap)
      vec3 col = texture2D(tBackdrop, uv).rgb;
      if (uRoughness > 0.001) {
        vec2 d = vec2(uRoughness / uResolution.x, uRoughness / uResolution.y);
        col += texture2D(tBackdrop, uv + d*vec2( 1.0, 0.0)).rgb;
        col += texture2D(tBackdrop, uv + d*vec2(-1.0, 0.0)).rgb;
        col += texture2D(tBackdrop, uv + d*vec2( 0.0, 1.0)).rgb;
        col += texture2D(tBackdrop, uv + d*vec2( 0.0,-1.0)).rgb;
        col *= 0.2;
      }

      // subtle fresnel to avoid flatness
      float F = fresnelSchlick(abs(dot(N, -V)), uFresnel);
      gl_FragColor = vec4(mix(col, vec3(1.0), F * 0.05), 1.0);
    }
  `;

  const mat = new THREE.ShaderMaterial({
    uniforms, vertexShader: vert, fragmentShader: frag,
    transparent: true
  });

  // helper to keep resolution in sync
  (mat as any).setResolution = (w: number, h: number) => {
    uniforms.uResolution.value.set(w, h);
  };

  return mat as THREE.ShaderMaterial & { setResolution: (w:number,h:number)=>void };
}
