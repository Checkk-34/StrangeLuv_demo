import { useRef, useEffect, useCallback, useState, type ReactNode } from 'react';
import { PageContext } from './PageContext';

interface Props {
  children: ReactNode[];
  labels?: string[];
  /** 下一页顶部露出高度 (px) */
  peek?: number;
}

/**
 * 垂直滑页容器 — CSS transition 驱动（合成器线程），transitionend 精确回调
 * 每页 100dvh - peek，底部的 peek 空间露出下一页顶部边界
 * 动画曲线从 PPT 瑞士风翻页移植: cubic-bezier(.77,0,.175,1)
 */
export default function PageSlider({ children, labels, peek = 56 }: Props) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [vh, setVh] = useState(0);
  const touchY = useRef(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const total = children.length;

  // 监听视口高度变化
  useEffect(() => {
    const update = () => setVh(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const step = Math.max(0, vh - peek);
  const offset = current * step;

  // transitionend 解锁 — 替代 setTimeout 消除竞态
  const onTransitionEnd = useCallback(() => {
    setAnimating(false);
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      if (animating) return;
      const next = Math.max(0, Math.min(total - 1, idx));
      if (next === current) return;
      setAnimating(true);
      setCurrent(next);
    },
    [animating, current, total],
  );

  // 鼠标滚轮
  useEffect(() => {
    const el = trackRef.current?.parentElement;
    if (!el) return;
    let ticking = false;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (ticking || animating) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (e.deltaY > 0) goTo(current + 1);
        else goTo(current - 1);
        ticking = false;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [current, animating, goTo, vh]);

  // 触摸支持
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dy = e.changedTouches[0].clientY - touchY.current;
      const THRESHOLD = 40;
      if (Math.abs(dy) < THRESHOLD || animating) return;
      if (dy < 0) goTo(current + 1);
      else goTo(current - 1);
    },
    [animating, current, goTo],
  );

  // 键盘 ↑↓
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (animating) return;
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        goTo(current + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        goTo(current - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [current, animating, goTo]);

  if (total === 0 || vh === 0) return null;

  const pageStyle = { height: vh - peek };

  return (
    <div
      className="relative h-[100dvh] overflow-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* 滑轨 — transition 始终开启，避免同帧切换 transition 属性导致过渡丢失 */}
      <div
        ref={trackRef}
        className="will-change-transform"
        style={{
          transform: `translateY(-${offset}px)`,
          transition: 'transform 0.9s cubic-bezier(.77,0,.175,1)',
        }}
        onTransitionEnd={onTransitionEnd}
      >
        {children.map((child, i) => (
          <PageContext.Provider key={i} value={{ pageIndex: i, activeIndex: current }}>
            <div style={pageStyle} className="w-full flex-shrink-0 overflow-hidden">
              {child}
            </div>
          </PageContext.Provider>
        ))}
      </div>

      {/* 底部导航 */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
        {Array.from({ length: total }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`
              rounded-full transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
              ${i === current
                ? 'w-8 h-2 bg-[#3D3A36]/70'
                : 'w-2 h-2 bg-[#3D3A36]/25 hover:bg-[#3D3A36]/45'}
            `}
            aria-label={`第 ${i + 1} 页`}
          />
        ))}

        {labels && (
          <span className="ml-4 font-en text-[12px] tracking-[0.12em] text-[#3D3A36]/40 select-none">
            {labels[current] ?? `0${current + 1}`}
          </span>
        )}
      </div>

      {/* 页码指示（左上角） */}
      <div className="absolute top-8 left-8 z-20 font-en text-[13px] tracking-[0.18em] text-[#3D3A36]/40 select-none">
        {String(current + 1).padStart(2, '0')}
        <span className="mx-2 opacity-30">/</span>
        {String(total).padStart(2, '0')}
      </div>
    </div>
  );
}
