import React, { useEffect, useRef } from 'react';
import { Renderer, Program, Mesh, Triangle, Texture } from 'ogl';
import { prefersReducedMotion, screenWatcher } from './shared.js';

/**
 * Depth3D：用「圖片 + 深度圖」做出 2.5D 立體視差（類似 Facebook 3D 相片）。
 * 滑鼠移動會改變視角；手機上自動緩慢擺動（Android 支援傾斜手機）。標籤裡的內容會疊在上面。
 *
 * <div data-rb="Depth3D"
 *      data-image="https://.../pinan-ink.jpg"
 *      data-depth="https://.../pinan-depth.jpg"
 *      data-alt="臺南平安宮外觀"></div>
 *
 * 參數（data-*）：
 *   image      圖片網址（必填）
 *   depth      深度圖網址（必填，灰階：白=近、黑=遠）
 *   alt        圖片說明（給搜尋引擎與螢幕閱讀器）
 *   ratio      寬高比，預設 "3/2"；給 height 則以 height 為準
 *   height     固定高度，例如 "80vh"
 *   strength   視差強度，預設 0.035
 *   focus      對焦深度 0~1，預設 0.5（此深度的物體不動）
 *   zoom       放大倍率，避免邊緣露出，預設 1.08
 *   auto       沒有滑鼠時自動擺動，預設 true
 *   follow     window（整頁滑鼠，預設）/ self（只在元素上方時）
 *   align      上層內容水平位置 left / center / right
 *   valign     上層內容垂直位置 top / center / bottom
 *   padding    上層內容內距
 */

const VERT = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D uImage;
uniform sampler2D uDepth;
uniform vec2 uMouse;
uniform float uStrength;
uniform float uFocus;
uniform float uZoom;
uniform vec2 uCover;   // 讓圖片像 background-size: cover
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uCover / uZoom + 0.5;
  // 以深度位移取樣；迭代三次讓前景邊緣較不易拉扯
  vec2 offset = vec2(0.0);
  for (int i = 0; i < 3; i++) {
    float d = texture2D(uDepth, uv + offset).r;
    offset = uMouse * uStrength * (d - uFocus);
  }
  gl_FragColor = texture2D(uImage, uv + offset);
}
`;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export default function Depth3D({
  image,
  depth,
  alt = '',
  ratio = '3/2',
  height,
  strength = 0.035,
  focus = 0.5,
  zoom = 1.08,
  auto = true,
  follow = 'window',
  align = 'center',
  valign = 'center',
  padding = '40px 24px',
  innerHtml = '',
}) {
  const wrapRef = useRef(null);
  const fallbackRef = useRef(null);
  const vjustify = valign === 'top' ? 'flex-start' : valign === 'bottom' ? 'flex-end' : 'center';

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || !image || !depth) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      let img, dep;
      try {
        [img, dep] = await Promise.all([loadImage(image), loadImage(depth)]);
      } catch (e) {
        console.warn('[DudaEffects] Depth3D：圖片或深度圖載入失敗', e);
        return;
      }
      if (disposed) return;

      let renderer;
      try {
        renderer = new Renderer({ alpha: false, dpr: Math.min(window.devicePixelRatio || 1, 2) });
      } catch (e) {
        return; // 不支援 WebGL：保留靜態圖片
      }
      const gl = renderer.gl;
      Object.assign(gl.canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' });
      // 畫布放在靜態圖「下面」，等第一張畫面畫好，靜態圖再淡出，避免黑畫面閃一下
      wrap.prepend(gl.canvas);
      let firstFrame = true;

      const texOpts = { generateMipmaps: false, minFilter: gl.LINEAR, magFilter: gl.LINEAR, wrapS: gl.CLAMP_TO_EDGE, wrapT: gl.CLAMP_TO_EDGE };
      const tImage = new Texture(gl, { image: img, ...texOpts });
      const tDepth = new Texture(gl, { image: dep, ...texOpts });

      const program = new Program(gl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uImage: { value: tImage },
          uDepth: { value: tDepth },
          uMouse: { value: [0, 0] },
          uStrength: { value: strength },
          uFocus: { value: focus },
          uZoom: { value: zoom },
          uCover: { value: [1, 1] },
        },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const imgAspect = img.naturalWidth / img.naturalHeight;
      const resize = () => {
        const w = wrap.offsetWidth || 1;
        const h = wrap.offsetHeight || 1;
        renderer.setSize(w, h);
        const boxAspect = w / h;
        program.uniforms.uCover.value = boxAspect > imgAspect ? [1, imgAspect / boxAspect] : [boxAspect / imgAspect, 1];
      };
      const ro = new ResizeObserver(resize);
      ro.observe(wrap);
      resize();

      // 輸入：滑鼠 / 手機傾斜 / 自動擺動
      const target = { x: 0, y: 0 };
      const cur = { x: 0, y: 0 };
      let lastInput = 0;
      const onMove = (e) => {
        const r = follow === 'self' ? wrap.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
        target.x = ((e.clientX - r.left) / r.width) * 2 - 1;
        target.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
        lastInput = performance.now();
      };
      const onLeave = () => { target.x = 0; target.y = 0; };
      const onTilt = (e) => {
        if (e.gamma == null) return;
        target.x = Math.max(-1, Math.min(1, e.gamma / 25));
        target.y = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
        lastInput = performance.now();
      };
      const moveTarget = follow === 'self' ? wrap : window;
      moveTarget.addEventListener('mousemove', onMove);
      if (follow === 'self') wrap.addEventListener('mouseleave', onLeave);
      window.addEventListener('deviceorientation', onTilt);

      const watch = screenWatcher(wrap);

      const still = prefersReducedMotion();
      let raf = 0;
      const loop = (t) => {
        raf = requestAnimationFrame(loop);
        if (!watch.visible() && !firstFrame) return;
        if (auto && !still && t - lastInput > 2500) {
          target.x = Math.sin(t * 0.00045) * 0.8;
          target.y = Math.sin(t * 0.0003) * 0.35;
        }
        if (still) { target.x = 0; target.y = 0; }
        cur.x += (target.x - cur.x) * 0.06;
        cur.y += (target.y - cur.y) * 0.06;
        program.uniforms.uMouse.value = [cur.x, cur.y];
        renderer.render({ scene: mesh });
        if (firstFrame) {
          firstFrame = false;
          const fb = fallbackRef.current;
          if (fb) {
            fb.style.transition = 'opacity .4s ease';
            fb.style.opacity = '0';
          }
        }
      };
      raf = requestAnimationFrame(loop);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        watch.dispose();
        moveTarget.removeEventListener('mousemove', onMove);
        wrap.removeEventListener('mouseleave', onLeave);
        window.removeEventListener('deviceorientation', onTilt);
        gl.canvas.remove();
        const ext = gl.getExtension('WEBGL_lose_context');
        if (ext) ext.loseContext();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [image, depth, strength, focus, zoom, auto, follow]);

  const justify = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const sizeStyle = height ? { height } : { aspectRatio: String(ratio).replace(/\s/g, '') };
  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', overflow: 'hidden', background: '#e8dcc0', ...sizeStyle }}>
      {/* 靜態圖：WebGL 載入前、或不支援時顯示，也讓搜尋引擎讀得到 */}
      <img
        ref={fallbackRef}
        src={image}
        alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {innerHtml && innerHtml.trim() ? (
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: justify,
            justifyContent: vjustify,
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
