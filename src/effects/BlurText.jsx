import React, { useEffect, useRef, useState } from 'react';
import { onVisible, prefersReducedMotion } from './shared.js';

/**
 * BlurText：文字從模糊逐字（或逐詞）變清晰（React Bits 同名元件的輕量版）。
 *
 * <div data-rb="BlurText" data-tag="p">一杯純粹，陪你安心過每一天</div>
 *
 * 參數（data-*）：
 *   text        文字；不給就用標籤裡的文字。可用 \n 或 | 換行
 *   tag         外層標籤，預設 div
 *   animateBy   chars（預設）/ words
 *   direction   top（預設，從上方落下）/ bottom
 *   delay       字與字間隔毫秒，預設 60
 *   duration    毫秒，預設 700
 *   blur        起始模糊 px，預設 10
 *   startDelay  開始前延遲毫秒，預設 0
 */
export default function BlurText({
  text,
  innerText = '',
  tag = 'div',
  animateBy = 'chars',
  direction = 'top',
  delay = 60,
  duration = 700,
  blur = 10,
  startDelay = 0,
  threshold = 0.2,
}) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  const content = String(text ?? innerText ?? '').replace(/\\n/g, '\n');
  const lines = content.split(/\n|\|/);

  useEffect(() => {
    if (!ref.current) return;
    if (prefersReducedMotion()) { setOn(true); return; }
    return onVisible(ref.current, { threshold }, () => setOn(true));
  }, [threshold]);

  const off = direction === 'bottom' ? 'translateY(30%)' : 'translateY(-30%)';
  const Tag = tag;
  let idx = 0;
  return (
    <Tag ref={ref} style={{ margin: 0, font: 'inherit', color: 'inherit' }} aria-label={lines.join(' ')}>
      {lines.map((line, li) => {
        const pieces = animateBy === 'words' ? line.split(/(\s+)/) : Array.from(line);
        return (
          <React.Fragment key={li}>
            {li > 0 && <br />}
            {pieces.map((p, i) => {
              if (/^\s+$/.test(p)) return <span key={i} aria-hidden="true">{p}</span>;
              const d = startDelay + idx++ * delay;
              return (
                <span
                  key={i}
                  aria-hidden="true"
                  style={{
                    display: 'inline-block',
                    whiteSpace: 'pre',
                    opacity: on ? 1 : 0,
                    filter: on ? 'blur(0)' : `blur(${blur}px)`,
                    transform: on ? 'none' : off,
                    transition: `opacity ${duration}ms ease ${d}ms, filter ${duration}ms ease ${d}ms, transform ${duration}ms cubic-bezier(.2,.8,.2,1) ${d}ms`,
                  }}
                >
                  {p}
                </span>
              );
            })}
          </React.Fragment>
        );
      })}
    </Tag>
  );
}
