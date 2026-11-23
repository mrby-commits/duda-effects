import React, { useEffect, useRef } from 'react';
import { onVisible, prefersReducedMotion } from './shared.js';

/**
 * FadeIn：捲動到畫面時淡入。
 *
 * 用法一：包住自己的內容
 *   <div data-rb="FadeIn" data-direction="up"> ...任何 HTML... </div>
 *
 * 用法二：套用到頁面上「DUDA 原生元件」（不用改原本的區塊）
 *   <div data-rb="FadeIn" data-target=".dmRespRow" data-stagger="120"></div>
 *   target 是 CSS 選擇器，可以在 DUDA 元件的「進階 → CSS class」自己加 class，例如 .fade
 *
 * 參數（data-*）：
 *   direction   up（預設）/ down / left / right / none
 *   distance    位移 px，預設 40
 *   duration    毫秒，預設 800
 *   delay       毫秒，預設 0
 *   stagger     多個項目依序出現的間隔毫秒；用法一會套用到直接子元素，預設 0（整塊一起）
 *   scale       起始縮放，例如 0.95，預設 1
 *   blur        起始模糊 px，預設 0
 *   threshold   進入畫面比例，預設 0.15
 *   once        只播一次，預設 true
 */
export default function FadeIn({
  target,
  direction = 'up',
  distance = 40,
  duration = 800,
  delay = 0,
  stagger = 0,
  scale = 1,
  blur = 0,
  threshold = 0.15,
  once = true,
  innerHtml = '',
}) {
  const ref = useRef(null);

  useEffect(() => {
    const host = ref.current;
    let stopped = false;
    let teardown = () => {};

    const collect = () => {
      if (target) {
        try {
          return Array.from(document.querySelectorAll(target)).filter((n) => !n.contains(host));
        } catch (e) {
          console.warn('[DudaEffects] FadeIn：選擇器無效', target);
          return null;
        }
      }
      if (stagger && host) {
        // 只有一層包裝（例如 <div class="cards">）時往內找，讓每個卡片各自依序出現
        let group = host;
        while (group.children.length === 1) group = group.children[0];
        return Array.from(group.children);
      }
      return host ? [host] : [];
    };

    // 目標元素可能稍後才渲染（例如 DUDA 部落格元件）：最多重試約 5 秒
    let tries = 0;
    const attempt = () => {
      if (stopped) return;
      const items = collect();
      if (items === null) return;
      if (!items.length) {
        if (target && tries++ < 20) setTimeout(attempt, 250);
        return;
      }
      teardown = run(items);
    };

    const run = (items) => {

    const off = {
      up: `translate3d(0, ${distance}px, 0)`,
      down: `translate3d(0, ${-distance}px, 0)`,
      left: `translate3d(${distance}px, 0, 0)`,
      right: `translate3d(${-distance}px, 0, 0)`,
      none: 'translate3d(0,0,0)',
    }[direction] || 'translate3d(0,0,0)';
    const hidden = `${off} scale(${scale})`;

    if (prefersReducedMotion()) return () => {};

    // 左右滑入時，起始位置會超出畫面造成橫向捲軸：裁掉容器的橫向溢出
    if (direction === 'left' || direction === 'right') {
      const parents = new Set(items.map((n) => n.parentElement).filter(Boolean));
      parents.forEach((p) => { p.style.overflowX = 'clip'; });
    }

    items.forEach((n, i) => {
      n.style.opacity = '0';
      n.style.transform = hidden;
      if (blur) n.style.filter = `blur(${blur}px)`;
      n.style.transition = `opacity ${duration}ms ease, transform ${duration}ms cubic-bezier(.2,.8,.2,1), filter ${duration}ms ease`;
      n.style.transitionDelay = `${delay + i * (stagger || 0)}ms`;
      n.style.willChange = 'opacity, transform';
    });

    // 依序出現時，延遲以「同一批進入畫面的順序」計算，避免後面的項目等太久
    const show = (n) => {
      n.style.opacity = '1';
      n.style.transform = 'none';
      if (blur) n.style.filter = 'none';
    };
    const hide = (n) => {
      n.style.opacity = '0';
      n.style.transform = hidden;
      if (blur) n.style.filter = `blur(${blur}px)`;
    };
    const shown = new Set();
    const reveal = (n) => { shown.add(n); show(n); };
    const stopIO = onVisible(items, { threshold, once }, (n) => reveal(n || items[0]), (n) => { shown.delete(n); hide(n); });

    // 保險：偵測器漏掉事件時（例如 iframe 切換），已在畫面上的項目仍要顯示，避免內容一直看不見
    const safety = setInterval(() => {
      const vh = window.innerHeight || document.documentElement.clientHeight;
      items.forEach((n) => {
        if (shown.has(n)) return;
        const r = n.getBoundingClientRect();
        if (r.top < vh * 0.95 && r.bottom > 0) reveal(n);
      });
      if (once && shown.size === items.length) clearInterval(safety);
    }, 600);

    return () => { stopIO(); clearInterval(safety); };
    };

    attempt();
    return () => { stopped = true; teardown(); };
  }, [target, direction, distance, duration, delay, stagger, scale, blur, threshold, once]);

  if (target) return <span ref={ref} style={{ display: 'none' }} />;
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: innerHtml }} />;
}
