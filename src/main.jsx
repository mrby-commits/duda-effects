import React from 'react';
import { createRoot } from 'react-dom/client';
import SplitText from './effects/SplitText.jsx';
import Aurora from './effects/Aurora.jsx';
import ClickSpark from './effects/ClickSpark.jsx';
import FadeIn from './effects/FadeIn.jsx';
import CountUp from './effects/CountUp.jsx';
import Marquee from './effects/Marquee.jsx';
import Particles from './effects/Particles.jsx';
import TiltCard from './effects/TiltCard.jsx';
import Depth3D from './effects/Depth3D.jsx';

const VERSION = '0.3.0';

// 效果註冊表：HTML 上的 data-rb="名稱" 對應到這裡的元件
const registry = { SplitText, Aurora, ClickSpark, FadeIn, CountUp, Marquee, Particles, TiltCard, Depth3D };

// data-* 的值都是字串，轉成數字／布林／JSON
function parseValue(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v !== '' && !isNaN(v)) return Number(v);
  if (/^[\[{]/.test(v)) {
    try { return JSON.parse(v); } catch (e) { /* 保持字串 */ }
  }
  return v;
}

function propsFrom(el) {
  const props = {};
  for (const [key, value] of Object.entries(el.dataset)) {
    if (key === 'rb' || key === 'rbMounted') continue;
    props[key] = parseValue(value);
  }
  // 原本寫在標籤裡的內容：SplitText 當文字用，Aurora 當疊在上層的內容用
  props.innerText = el.textContent.trim();
  props.innerHtml = el.innerHTML;
  return props;
}

function mount(el) {
  if (el.__rbRoot) return;
  const name = el.dataset.rb;
  const Component = registry[name];
  if (!Component) {
    console.warn(`[DudaEffects] 找不到效果「${name}」。可用：${Object.keys(registry).join(', ')}`);
    return;
  }
  const props = propsFrom(el);
  el.__rbRoot = createRoot(el);
  el.__rbRoot.render(<Component {...props} />);
  el.dataset.rbMounted = '1';
}

function scan(root = document) {
  root.querySelectorAll('[data-rb]:not([data-rb-mounted])').forEach(mount);
}

function register(name, Component) {
  registry[name] = Component;
  scan();
}

function start() {
  scan();
  // DUDA 有些區塊是之後才載入的，持續監看新加入的元素
  new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches && node.matches('[data-rb]:not([data-rb-mounted])')) mount(node);
        if (node.querySelectorAll) scan(node);
      }
    }
  }).observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}

window.DudaEffects = { version: VERSION, mount, scan, register, effects: Object.keys(registry) };
console.info(`[DudaEffects] v${VERSION} loaded:`, Object.keys(registry).join(', '));
