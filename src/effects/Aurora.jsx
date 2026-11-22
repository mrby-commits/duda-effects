import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle } from 'ogl';
import { screenWatcher } from './shared.js';

/**
 * Aurora：WebGL 極光流動背景。標籤裡原本的內容會疊在極光上面。
 *
 * <div data-rb="Aurora" data-height="500px" data-colors="#3A29FF,#FF94B4,#FF3232">
 *   <h2 style="color:#fff">標題可以直接寫在裡面</h2>
 * </div>
 *
 * 參數（data-*）：
 *   colors      三個顏色，逗號分隔，預設 #3A29FF,#FF94B4,#FF3232
 *   height      高度，預設 400px
 *   background  底色，預設 #060010
 *   amplitude   波動幅度，預設 1.0
 *   blend       邊緣柔和度，預設 0.5
 *   speed       速度，預設 1.0
 *   align       上層內容對齊：center（預設）/ left / right
 *   padding     上層內容內距，預設 40px 24px
 */

const VERT = `
attribute vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

// 2D simplex noise：Ashima Arts / Stefan Gustavson（MIT）
const FRAG = `
precision highp float;
uniform float uTime;
uniform float uAmplitude;
uniform float uBlend;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec2 uResolution;

vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  vec3 ramp = uv.x < 0.5
    ? mix(uColor0, uColor1, uv.x * 2.0)
    : mix(uColor1, uColor2, (uv.x - 0.5) * 2.0);
  float h = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  h = exp(h);
  h = (uv.y * 2.0 - h + 0.2);
  float intensity = 0.6 * h;
  float mid = 0.20;
  float alpha = smoothstep(mid - uBlend * 0.5, mid + uBlend * 0.5, intensity);
  gl_FragColor = vec4(intensity * ramp * alpha, alpha);
}
`;

function hexToRgb(hex) {
  let h = String(hex).trim().replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export default function Aurora({
  colors = '#3A29FF,#FF94B4,#FF3232',
  height = '400px',
  background = '#060010',
  amplitude = 1.0,
  blend = 0.5,
  speed = 1.0,
  align = 'center',
  padding = '40px 24px',
  innerHtml = '',
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const list = (Array.isArray(colors) ? colors : String(colors).split(',')).map(hexToRgb);
    while (list.length < 3) list.push(list[list.length - 1] || [1, 1, 1]);

    let renderer;
    try {
      renderer = new Renderer({ alpha: true, premultipliedAlpha: true, antialias: true, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    } catch (e) {
      console.warn('[DudaEffects] Aurora：此瀏覽器不支援 WebGL，只顯示底色。');
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    Object.assign(gl.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    wrap.prepend(gl.canvas);

    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uAmplitude: { value: amplitude },
        uBlend: { value: blend },
        uColor0: { value: list[0] },
        uColor1: { value: list[1] },
        uColor2: { value: list[2] },
        uResolution: { value: [1, 1] },
      },
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

    const resize = () => {
      const w = wrap.offsetWidth || 1;
      const h = wrap.offsetHeight || 1;
      renderer.setSize(w, h);
      program.uniforms.uResolution.value = [gl.canvas.width, gl.canvas.height];
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // 不在畫面上時暫停，節省效能
    const watch = screenWatcher(wrap);
    let drawn = false;

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!watch.visible() && drawn) return;
      drawn = true;
      program.uniforms.uTime.value = (reduce ? 0 : t * 0.001) * speed;
      renderer.render({ scene: mesh });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      watch.dispose();
      gl.canvas.remove();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, [colors, amplitude, blend, speed]);

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  return (
    <div
      ref={wrapRef}
      style={{ position: 'relative', width: '100%', height, background, overflow: 'hidden' }}
    >
      {innerHtml && innerHtml.trim() ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: justify,
            justifyContent: 'center',
            textAlign: align,
            padding,
            boxSizing: 'border-box',
          }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      ) : null}
    </div>
  );
}
