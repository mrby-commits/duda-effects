import React, { useEffect, useRef } from 'react';
import { toList } from './shared.js';

/**
 * Marquee：無限跑馬燈。文字或任何 HTML（例如合作夥伴 logo）都可以。
 *
 * 文字：
 *   <div data-rb="Marquee" data-items="安太歲|點光明燈|祈福法會|平安符" data-font-size="28px"></div>
 * 自訂 HTML（每個直接子元素是一個項目）：
 *   <div data-rb="Marquee" data-speed="40">
 *     <img src="logo1.png" height="40"><img src="logo2.png" height="40">
 *   </div>
 *
 * 參數（data-*）：
 *   items         以 | 分隔的文字項目（沒給就用標籤裡的內容）
 *   speed         每秒移動 px，預設 60
 *   direction     left（預設）/ right
 *   gap           項目間距，預設 48px
 *   separator     文字項目之間的分隔符號，例如 "✦"，預設無
 *   pauseOnHover  滑鼠移上去暫停，預設 true
 *   fontSize / color / fontWeight  文字樣式
 *   fade          左右邊緣漸隱，預設 true
 */
let styleInjected = false;
function injectStyle() {
  if (styleInjected) return;
  styleInjected = true;
  const s = document.createElement('style');
  s.textContent = `
@keyframes rb-marquee { from { transform: translate3d(0,0,0); } to { transform: translate3d(calc(-1 * var(--rb-mq-w)),0,0); } }
.rb-marquee-track { display:flex; width:max-content; animation: rb-marquee var(--rb-mq-d) linear infinite; animation-direction: var(--rb-mq-dir); }
.rb-marquee[data-pause="true"]:hover .rb-marquee-track { animation-play-state: paused; }
.rb-marquee-copy { display:flex; align-items:center; flex-shrink:0; }
@media (prefers-reduced-motion: reduce) { .rb-marquee-track { animation: none; } }
`;
  document.head.appendChild(s);
}

export default function Marquee({
  items,
  innerHtml = '',
  speed = 60,
  direction = 'left',
  gap = '48px',
  separator = '',
  pauseOnHover = true,
  fontSize,
  color,
  fontWeight,
  fade = true,
}) {
  const wrapRef = useRef(null);
  const trackRef = useRef(null);
  injectStyle();

  const list = items ? toList(items, '|') : null;
  const gapCss = typeof gap === 'number' ? `${gap}px` : gap;

  const copyContent = list
    ? list
        .map((t, i) => {
          const sep = separator ? `<span aria-hidden="true" style="opacity:.6">${separator}</span>` : '';
          return `<span style="white-space:nowrap">${t}</span>${i < list.length - 1 || separator ? sep : ''}`;
        })
        .join('')
    : innerHtml;

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    const update = () => {
      const first = track.firstElementChild;
      if (!first) return;
      const w = first.getBoundingClientRect().width;
      if (!w) return;
      // 複製足夠份數，讓畫面永遠填滿
      const need = Math.max(2, Math.ceil(wrap.offsetWidth / w) + 1);
      while (track.children.length < need) {
        const c = first.cloneNode(true);
        c.setAttribute('aria-hidden', 'true');
        track.appendChild(c);
      }
      track.style.setProperty('--rb-mq-w', `${w}px`);
      track.style.setProperty('--rb-mq-d', `${w / Math.max(1, speed)}s`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    // 圖片載入後寬度會變
    track.querySelectorAll('img').forEach((img) => img.addEventListener('load', update, { once: true }));
    return () => ro.disconnect();
  }, [copyContent, speed]);

  const mask = fade
    ? 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)'
    : undefined;

  return (
    <div
      ref={wrapRef}
      className="rb-marquee"
      data-pause={String(pauseOnHover)}
      style={{ overflow: 'hidden', width: '100%', WebkitMaskImage: mask, maskImage: mask, fontSize, color, fontWeight }}
    >
      <div
        ref={trackRef}
        className="rb-marquee-track"
        style={{ '--rb-mq-dir': direction === 'right' ? 'reverse' : 'normal', '--rb-mq-d': '30s', '--rb-mq-w': '0px' }}
      >
        <div
          className="rb-marquee-copy"
          style={{ gap: gapCss, paddingRight: gapCss }}
          dangerouslySetInnerHTML={{ __html: copyContent }}
        />
      </div>
    </div>
  );
}
