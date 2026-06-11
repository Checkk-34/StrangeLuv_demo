import { useState, useRef } from 'react';
import { SlotIcon, ClipboardIcon, RefreshIcon, CheckCircleIcon } from './Icons';
import GameDialog from './GameDialog';

const SLOT_DATA = {
  time: ['周六上午', '周六下午', '周六晚上', '周日上午', '周日下午', '周日晚上'],
  type: ['美食', '户外', '娱乐', '宅家', '运动', '学习'],
  detail: ['吃火锅', '看电影', '逛公园', '打游戏', '宅家刷剧', '做手工', '去图书馆', '运动健身', '尝试新餐厅', '视频聊天'],
};

interface Props {
  onAddItem: (text: string) => void;
  onEnd: () => void;
}

type Phase = 'idle' | 'spinning' | 'result' | 'subdialog';

export default function SlotsGame({ onAddItem, onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState('');
  const [showSub, setShowSub] = useState(false);
  const [offsets, setOffsets] = useState({ time: 2, type: 2, detail: 2 });
  const spinningRef = useRef(false);

  function spin() {
    if (spinningRef.current) return;
    spinningRef.current = true;
    setPhase('spinning');

    const keys: ('time' | 'type' | 'detail')[] = ['time', 'type', 'detail'];
    const newResults: string[] = [];
    const newOffsets = { ...offsets };

    keys.forEach((key, _col) => {
      const items = SLOT_DATA[key];
      const target = Math.floor(Math.random() * items.length);
      newResults.push(items[target]);
      const spinDist = items.length * 2 + target - 3;
      newOffsets[key] = offsets[key] + spinDist;
    });

    setOffsets(newOffsets);

    const totalTime = 800 + 1500 + 2 * 300;
    setTimeout(() => {
      spinningRef.current = false;
      setResult(`${newResults[0]} - ${newResults[1]} - ${newResults[2]}`);
      setPhase('result');
    }, totalTime);
  }

  function handleChoice(c: 'add' | 'retry' | 'end') {
    if (c === 'retry') { setPhase('idle'); setResult(''); }
    else if (c === 'add') {
      onAddItem(result);
      setShowSub(true);
    }
    else { onEnd(); }
  }

  // 渲染偏移量
  function getTranslateY(key: 'time' | 'type' | 'detail'): string {
    return `translateY(-${offsets[key] * 42}px)`;
  }

  // const itemHeight = 42;
  // const visibleCount = 3;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center select-none gap-6">
      {/* 老虎机机箱 */}
      <div className="flex gap-3 md:gap-4">
        {(Object.keys(SLOT_DATA) as ('time' | 'type' | 'detail')[]).map((key) => {
          const label = { time: '时间', type: '类型', detail: '活动' }[key];
          const items = SLOT_DATA[key];
          const repeated = [...items, ...items, ...items];
          return (
            <div key={key} className="flex flex-col items-center gap-2">
              <div className="w-[90px] md:w-[110px] h-[calc(42px*3)] rounded-xl overflow-hidden
                bg-card-glass border border-white/20
                shadow-[inset_0_2px_8px_var(--color-shadow-md)] relative">
                {/* 上下渐隐 */}
                <div className="absolute inset-0 pointer-events-none z-10"
                  style={{
                    background: 'linear-gradient(to bottom, var(--color-card-glass-deep) 0%, transparent 25%, transparent 75%, var(--color-card-glass-deep) 100%)'
                  }} />
                <div
                  className="transition-transform duration-[1.5s] ease-[cubic-bezier(0.15,0.05,0.05,1)]"
                  style={{ transform: getTranslateY(key), transitionDuration: phase === 'spinning' ? '1.5s' : '0s' }}
                >
                  {repeated.map((item, i) => (
                    <div key={i} className="h-[42px] flex items-center justify-center text-[13px] md:text-[14px] text-text-primary/70 font-zh px-2 text-center leading-tight">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <span className="font-en text-[9px] tracking-[0.2em] text-text-tertiary/50 uppercase">{label}</span>
            </div>
          );
        })}
      </div>

      {/* 旋转按钮 */}
      {phase !== 'spinning' && phase !== 'result' && (
        <button
          onClick={spin}
          className="px-8 py-3 rounded-full bg-gradient-to-r from-frog-emerald to-frog-emerald-dark text-white font-zh text-base font-medium
            shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
            hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]"
        >
          <SlotIcon size={22} className="-mt-0.5 align-middle mr-1.5 inline-block brightness-0 invert" />
          拉杆！
        </button>
      )}

      {phase === 'spinning' && (
        <span className="font-en text-[13px] tracking-[0.2em] text-text-tertiary/50 animate-pulse">
          Spinning
        </span>
      )}

      {/* ===== 结果弹窗 ===== */}
      <GameDialog
        open={phase === 'result' && !showSub}
        icon={<span className="text-frog-emerald"><SlotIcon size={40} /></span>}
        title="抽中了"
        result={result}
        resultColor="text-frog-emerald"
        actions={[
          { label: '添加该事件', onClick: () => handleChoice('add'), icon: <ClipboardIcon size={20} /> },
          { label: '不满意！再来', onClick: () => handleChoice('retry'), variant: 'secondary', icon: <RefreshIcon size={20} /> },
          { label: '结束游戏', onClick: () => handleChoice('end'), variant: 'ghost' },
        ]}
      />

      {/* ===== 次级确认弹窗 ===== */}
      <GameDialog
        open={showSub}
        icon={<CheckCircleIcon size={36} />}
        title="已添加到今日安排"
        subtitle="还要继续玩老虎机吗？"
        actions={[
          { label: '继续', onClick: () => { setShowSub(false); setPhase('idle'); setResult(''); } },
          { label: '结束', onClick: () => { setShowSub(false); onEnd(); }, variant: 'secondary' },
        ]}
      />
    </div>
  );
}
