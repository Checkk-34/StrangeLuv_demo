import { useState, useEffect, useMemo, memo, useRef } from 'react';
import { gsap } from 'gsap';
import { FishIcon, FrogIcon } from './Icons';

/* ---- 全天渐变配色 ---- */
function calcFraction(): number {
  const now = new Date();
  const secs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return secs / 86400;
}

function calcRemaining(): { h: number; m: number; s: number; total: number } {
  const now = new Date();
  const target = new Date(now);
  target.setHours(24, 0, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const total = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  return {
    h: Math.floor(total / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
    total,
  };
}

const COLOR_A = { r: 212, g: 168, b: 87 };
const COLOR_B = { r: 255, g: 154, b: 107 };
const COLOR_C = { r: 255, g: 107, b: 138 };

function lerpColor(f: number): string {
  let c: { r: number; g: number; b: number };
  if (f < 0.5) {
    const t = f / 0.5;
    c = {
      r: Math.round(COLOR_A.r + (COLOR_B.r - COLOR_A.r) * t),
      g: Math.round(COLOR_A.g + (COLOR_B.g - COLOR_A.g) * t),
      b: Math.round(COLOR_A.b + (COLOR_B.b - COLOR_A.b) * t),
    };
  } else {
    const t = (f - 0.5) / 0.5;
    c = {
      r: Math.round(COLOR_B.r + (COLOR_C.r - COLOR_B.r) * t),
      g: Math.round(COLOR_B.g + (COLOR_C.g - COLOR_B.g) * t),
      b: Math.round(COLOR_B.b + (COLOR_C.b - COLOR_B.b) * t),
    };
  }
  return `rgb(${c.r},${c.g},${c.b})`;
}

function lerpGlow(f: number): string {
  if (f < 0.5) {
    const t = f / 0.5;
    const r = Math.round(212 + (255 - 212) * t);
    const g = Math.round(168 + (154 - 168) * t);
    const b = Math.round(87 + (107 - 87) * t);
    return `rgba(${r},${g},${b},0.35)`;
  }
  const t = (f - 0.5) / 0.5;
  const r = Math.round(255 + (255 - 255) * t);
  const g = Math.round(154 + (107 - 154) * t);
  const b = Math.round(107 + (138 - 107) * t);
  return `rgba(${r},${g},${b},0.40)`;
}

/* ---- 子组件：单个数字 pop ---- */
const DigitChar = memo(function DigitChar({ ch, color }: { ch: string; color: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(
        ref.current,
        { scale: 0.6, opacity: 0.3 },
        { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(2)', clearProps: 'transform' },
      );
    }
  }, [ch]);

  return (
    <span ref={ref} className="inline-block" style={{ color }}>
      {ch}
    </span>
  );
});

/* ---- 子组件：静态心率条 ---- */
const HeartbeatBars = memo(function HeartbeatBars({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-[3px] h-6 mt-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full"
          style={{
            height: `${20 + Math.sin(i * 0.8) * 16}px`,
            backgroundColor: color,
            opacity: 0.5,
            animation: `pulse-bar 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
          }}
        />
      ))}
    </div>
  );
});

/* ---- 子组件：Kicker ---- */
const Kicker = memo(function Kicker({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-5 mb-6 md:mb-8">
      <span className="w-10 h-[2px]" style={{ backgroundColor: color, opacity: 0.25 }} />
      <span className="font-en text-[15px] md:text-[17px] tracking-[0.28em] uppercase font-light" style={{ color, opacity: 0.5 }}>
        距离今天结束还有
      </span>
      <span className="w-10 h-[2px]" style={{ backgroundColor: color, opacity: 0.25 }} />
    </div>
  );
});

/* ---- 子组件：底部信息 ---- */
const FooterInfo = memo(function FooterInfo() {
  return (
    <p className="font-en text-[16px] md:text-[18px] tracking-[0.06em] font-light" style={{ opacity: 0.4 }}>
      <FishIcon size={28} className="inline-block -mt-1 align-middle mr-1" />
      <span className="font-medium" style={{ color: '#E88350', opacity: 0.8 }}>小鱼</span>
      <span className="mx-3 opacity-30">&amp;</span>
      <FrogIcon size={28} className="inline-block -mt-1 align-middle mr-1" />
      <span className="font-medium" style={{ color: '#6DB87C', opacity: 0.8 }}>蛙蛙</span>
      <span className="ml-4 opacity-40">· 在等你</span>
    </p>
  );
});

/* ---- 主组件 ---- */
export default function CountdownView() {
  const [time, setTime] = useState(calcRemaining);
  const [fraction, setFraction] = useState(calcFraction);

  useEffect(() => {
    const id = setInterval(() => {
      setTime(calcRemaining);
      setFraction(calcFraction());
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const display = `${String(time.h).padStart(2, '0')}:${String(time.m).padStart(2, '0')}:${String(time.s).padStart(2, '0')}`;

  const color = useMemo(() => lerpColor(fraction), [fraction]);
  const glow = useMemo(() => lerpGlow(fraction), [fraction]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center select-none px-8 md:px-12 xl:px-16">
      <div className="flex flex-col items-center">
        <Kicker color={color} />

        {/* 主数字 — 逐字 pop 弹跳 */}
        <h1
          className="font-en font-extrabold tabular-nums leading-[0.92] tracking-[-0.03em]
            text-[18vw] md:text-[16vw] xl:text-[14vw]
            animate-heartbeat"
          style={{
            color,
            textShadow: `0 0 60px ${glow}, 0 0 120px ${glow}`,
            animationDuration: '1.2s',
          }}
        >
          {display.split('').map((ch, i) => {
            if (ch === ':') {
              return (
                <span key={`s${i}`} className="inline-block mx-[0.02em]" style={{ color }}>
                  {ch}
                </span>
              );
            }
            return <DigitChar key={`d${i}`} ch={ch} color={color} />;
          })}
        </h1>

        <HeartbeatBars color={color} />

        <div className="w-24 h-[2px] mt-10 md:mt-12 mb-6" style={{ backgroundColor: color, opacity: 0.15 }} />

        <FooterInfo />
      </div>
    </div>
  );
}
