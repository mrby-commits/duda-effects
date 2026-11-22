import React, { useEffect, useRef } from 'react';
import { Renderer, Camera, Geometry, Program, Mesh } from 'ogl';
import { toList, hexToRgb, prefersReducedMotion } from './shared.js';

/**
 * Particles：WebGL 3D 漂浮粒子背景，會隨滑鼠輕微移動。標籤裡的內容會疊在上面。
 *
 * <div data-rb="Particles" data-height="500px" data-colors="#ffffff,#e0a458">
 *   <h2 style="color:#fff">標題</h2>
 * </div>
 *
 * 參數（data-*）：
 *   count        粒子數量，預設 200（手機自動減半）
 *   colors       顏色，逗號分隔，預設 #ffffff
 *   height       高度，預設 400px
 *   background   底色，預設 #060010（給 transparent 可疊在其他背景上）
 *   speed        速度，預設 0.1
 *   size         粒子大小，預設 100
 *   spread       分布範圍，預設 10
 *   hover        跟著滑鼠移動，預設 true
 *   rotate       整體緩慢旋轉，預設 true
 *   align / padding  上層內容排版，同 Aurora
 */

const VERT = `
attribute vec3 position;
attribute vec4 random;
attribute vec3 color;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform float uTime;
uniform float uSpread;
uniform float uBaseSize;
varying vec4 vRandom;
varying vec3 vColor;
void main() {
  vRandom = random;
  vColor = color;
  vec3 pos = position * uSpread;
  pos.z *= 10.0;
  vec4 mPos = modelMatrix * vec4(pos, 1.0);
  float t = uTime;
  mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
  mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
  mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
  vec4 mvPos = viewMatrix * mPos;
  gl_PointSize = (uBaseSize * (1.0 + (random.x - 0.5))) / length(mvPos.xyz);
  gl_Position = projectionMatrix * mvPos;
}
`;

const FRAG = `
precision highp float;
uniform float uTime;
varying vec4 vRandom;
varying vec3 vColor;
void main() {
  vec2 uv = gl_PointCoord.xy;
  float d = length(uv - vec2(0.5));
  float circle = smoothstep(0.5, 0.35, d) * 0.85;
  gl_FragColor = vec4(vColor + 0.15 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
}
`;

export default function Particles({
  count = 200,
  colors = '#ffffff',
  height = '400px',
  background = '#060010',
  speed = 0.1,
  size = 100,
  spread = 10,
  hover = true,
  rotate = true,
  align = 'center',
  padding = '40px 24px',
  innerHtml = '',
}) {
  const wrapRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const palette = toList(colors).map(hexToRgb);
    if (!palette.length) palette.push([1, 1, 1]);
    const isSmall = window.innerWidth < 768;
    const n = Math.max(10, Math.round(isSmall ? count / 2 : count));

    let renderer;
    try {
      renderer = new Renderer({ alpha: true, depth: false, dpr: Math.min(window.devicePixelRatio || 1, 1.5) });
    } catch (e) {
      console.warn('[DudaEffects] Particles：此瀏覽器不支援 WebGL。');
      return;
    }
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    Object.assign(gl.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
    wrap.prepend(gl.canvas);

    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, 20);

    const positions = new Float32Array(n * 3);
    const randoms = new Float32Array(n * 4);
    const cols = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // 單位球內均勻分布
      let x, y, z, len;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        len = x * x + y * y + z * z;
      } while (len > 1 || len === 0);
      const r = Math.cbrt(Math.random());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);
      cols.set(palette[Math.floor(Math.random() * palette.length)], i * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: cols },
    });
    const program = new Program(gl, {
      vertex: VERT,
      fragment: FRAG,
      uniforms: { uTime: { value: 0 }, uSpread: { value: spread }, uBaseSize: { value: size * (renderer.dpr || 1) } },
      transparent: true,
      depthTest: false,
    });
    const particles = new Mesh(gl, { mode: gl.POINTS, geometry, program });

    const resize = () => {
      renderer.setSize(wrap.offsetWidth || 1, wrap.offsetHeight || 1);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const mouse = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = wrap.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    if (hover) wrap.addEventListener('mousemove', onMove);

    let onScreen = true;
    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; });
    io.observe(wrap);

    const still = prefersReducedMotion();
    let raf = 0;
    let last = performance.now();
    let elapsed = 0;
    const loop = (t) => {
      raf = requestAnimationFrame(loop);
      if (!onScreen) { last = t; return; }
      const dt = t - last;
      last = t;
      if (!still) elapsed += dt * speed;
      program.uniforms.uTime.value = elapsed * 0.001;
      if (hover) {
        particles.position.x += (-mouse.x - particles.position.x) * 0.05;
        particles.position.y += (-mouse.y - particles.position.y) * 0.05;
      }
      if (rotate && !still) {
        particles.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        particles.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        particles.rotation.z += 0.01 * speed;
      }
      renderer.render({ scene: particles, camera });
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      wrap.removeEventListener('mousemove', onMove);
      gl.canvas.remove();
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    };
  }, [count, colors, speed, size, spread, hover, rotate]);

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', height, background, overflow: 'hidden' }}>
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
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: innerHtml }}
        />
      ) : null}
    </div>
  );
}
