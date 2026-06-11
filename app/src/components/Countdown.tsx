import { useState, useEffect } from 'react';
import { FishIcon, FrogIcon } from './Icons';

const TARGET_HOUR = 24; // 午夜
const URGENT_THRESHOLD = 3600; // 1 小时以下触发紧急模式

function calcRemaining(): { h: number; m: number; s: number; totalSeconds: number } {
  const now = new Date();
  const target = new Date(now);
  target.setHours(TARGET_HOUR, 0, 0, 0);
  if (now > target) target.setDate(target.getDate() + 1);
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - now.getTime()) / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { h, m, s, totalSeconds };
}

export default function Countdown() {
  const [time, setTime] = useState(calcRemaining);

  useEffect(() => {
    const id = setInterval(() => setTime(calcRemaining), 1000);
    return () => clearInterval(id);
  }, []);

  const isUrgent = time.totalSeconds < URGENT_THRESHOLD;
  const display = `${String(time.h).padStart(2, '0')}:${String(time.m).padStart(2, '0')}:${String(time.s).padStart(2, '0')}`;

  return (
    <header className="pt-14 pb-7 text-center relative
      after:content-[''] after:absolute after:bottom-0
      after:left-6 after:right-6 after:h-px
      after:bg-gradient-to-r after:from-transparent after:via-water-shadow/30 after:to-transparent">
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs tracking-[0.14em] font-medium text-text-secondary">
          距离今天结束还有
        </span>

        <span
          className={`
            font-en font-extrabold tabular-nums leading-[1.15] select-none
            text-[2.8rem] md:text-[3.2rem] xl:text-[3.5rem]
            bg-gradient-to-r bg-clip-text text-transparent
            ${isUrgent
              ? 'from-heart-rose to-fish-teal animate-pulse-scale'
              : 'from-text-primary/90 to-water-shadow'}
            ${isUrgent ? 'urgent' : ''}
          `}
        >
          {display}
        </span>

        <span className="text-sm md:text-base text-text-secondary tracking-wide opacity-75">
          <FishIcon size={16} className="inline-block -mt-0.5 align-middle mr-0.5" /> 小鱼 和 <FrogIcon size={16} className="inline-block -mt-0.5 align-middle mx-0.5" /> 蛙蛙 在等你
        </span>
      </div>
    </header>
  );
}
