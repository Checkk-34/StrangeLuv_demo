import { useState, type ReactNode } from 'react';
import { FishIcon, FrogIcon, HeartIcon, ClipboardIcon, RefreshIcon, CheckCircleIcon } from './Icons';
import GameDialog from './GameDialog';

const QUIZ_OPTIONS = [
  '看电影', '吃火锅', '逛公园', '打游戏',
  '宅家刷剧', '做手工', '去图书馆', '运动健身',
  '尝试新餐厅', '视频聊天',
];

interface Props {
  onAddItems: (items: string[]) => void;
  onEnd: () => void;
}

type Phase =
  | 'choose-role-1'
  | 'pick-1'
  | 'waiting-2'
  | 'pick-2'
  | 'calculating'
  | 'result'
  | 'subdialog';

export default function QuizGame({ onAddItems, onEnd }: Props) {
  const [phase, setPhase] = useState<Phase>('choose-role-1');
  const [role1, setRole1] = useState<'fish' | 'frog' | null>(null);
  const [role2, setRole2] = useState<'fish' | 'frog' | null>(null);
  const [picks1, setPicks1] = useState<string[]>([]);
  const [picks2, setPicks2] = useState<string[]>([]);
  const [matchItems, setMatchItems] = useState<string[]>([]);
  const [showSub, setShowSub] = useState(false);

  // 第 1 人
  function selectRole1(r: 'fish' | 'frog') {
    setRole1(r);
    setPicks1([]);
    setPhase('pick-1');
  }

  function togglePick1(opt: string) {
    setPicks1(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]);
  }

  function submit1() {
    if (picks1.length === 0) return;
    setPhase('waiting-2');
  }

  // 第 2 人
  function startRound2() {
    const other = role1 === 'fish' ? 'frog' : 'fish';
    setRole2(other);
    setPicks2([]);
    setPhase('pick-2');
  }

  function togglePick2(opt: string) {
    setPicks2(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]);
  }

  function submit2() {
    if (picks2.length === 0) return;
    setPhase('calculating');

    const intersection = picks1.filter(p => picks2.includes(p));
    setTimeout(() => {
      setMatchItems(intersection);
      setPhase('result');
    }, 600);
  }

  // 结果操作
  function handleChoice(c: 'add' | 'retry' | 'end') {
    if (c === 'add') {
      if (matchItems.length > 0) onAddItems(matchItems);
      setShowSub(true);
    } else if (c === 'retry') {
      setRole1(null); setRole2(null);
      setPicks1([]); setPicks2([]); setMatchItems([]);
      setPhase('choose-role-1');
    } else {
      onEnd();
    }
  }

  function roleColor(r: 'fish' | 'frog' | null) {
    if (r === 'fish') return 'from-fish-teal to-fish-teal-dark';
    if (r === 'frog') return 'from-frog-emerald to-frog-emerald-dark';
    return '';
  }

  function roleLabel(r: 'fish' | 'frog'): ReactNode {
    return r === 'fish'
      ? <><FishIcon size={24} className="inline-block -mt-0.5 align-middle" /> 小鱼</>
      : <><FrogIcon size={24} className="inline-block -mt-0.5 align-middle" /> 蛙蛙</>;
  }

  const role1Color = roleColor(role1);
  const role2Color = roleColor(role2);

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center select-none px-4">

      {/* ===== 第 1 人选角色 ===== */}
      {phase === 'choose-role-1' && (
        <div className="flex flex-col items-center gap-6 animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <span className="font-en text-[12px] tracking-[0.18em] text-fish-teal/50 font-medium uppercase">Quiz</span>
          <p className="font-zh text-[16px] text-text-secondary/60">先由一方选择身份开始勾选：</p>
          <div className="flex gap-4">
            <button onClick={() => selectRole1('fish')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-fish-teal to-fish-teal-dark text-white font-zh text-base font-medium
                shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
                hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]">
              <FishIcon size={32} className="-mt-1 align-middle mr-2 inline-block brightness-0 invert" />
              小鱼先选
            </button>
            <button onClick={() => selectRole1('frog')}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-frog-emerald to-frog-emerald-dark text-white font-zh text-base font-medium
                shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
                hover:-translate-y-0.5 transition-all duration-300 active:scale-[0.97]">
              <FrogIcon size={32} className="-mt-1 align-middle mr-2 inline-block brightness-0 invert" />
              蛙蛙先选
            </button>
          </div>
        </div>
      )}

      {/* ===== 第 1 人勾选 ===== */}
      {phase === 'pick-1' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <div className="flex items-center gap-2.5">
            <span className="font-en text-[11px] tracking-[0.18em] text-fish-teal/50 font-medium uppercase">Quiz</span>
            <span className="w-px h-4 bg-lily-mid/30" />
            <span className="text-sm font-zh font-medium" style={{ color: role1 === 'fish' ? '#E88350' : '#6DB87C' }}>
              {roleLabel(role1!)} · 第 1 人
            </span>
          </div>
          <p className="font-zh text-[15px] text-text-secondary/50">这个周末你想做什么？</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUIZ_OPTIONS.map(opt => (
              <button key={opt} onClick={() => togglePick1(opt)}
                className={`px-5 py-3 rounded-xl text-[14px] font-zh transition-all duration-200 ${
                  picks1.includes(opt)
                    ? `bg-gradient-to-r ${role1Color} text-white shadow-md`
                    : 'bg-card-glass border border-white/20 text-text-secondary/60 hover:bg-card-soft'
                }`}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={submit1}
            className={`px-8 py-3 rounded-xl bg-gradient-to-r ${role1Color} text-white font-zh text-sm font-medium
              shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
              transition-all duration-300 active:scale-[0.97]
              ${picks1.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={picks1.length === 0}>
            <CheckCircleIcon size={20} className="-mt-0.5 align-middle mr-1.5 inline-block brightness-0 invert" />
            提交 ({picks1.length})，等对方来选
          </button>
        </div>
      )}

      {/* ===== 等待第 2 人 ===== */}
      {phase === 'waiting-2' && (
        <div className="flex flex-col items-center gap-6 animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <span className="font-en text-[11px] tracking-[0.18em] text-text-tertiary/60 uppercase">Waiting</span>
          <div className="text-center">
            <div className="mb-2">
              {role1 === 'fish' ? <FishIcon size={44} /> : <FrogIcon size={44} />}
            </div>
            <p className="font-zh text-[16px] text-text-secondary/60 mb-1">
              {roleLabel(role1!)} 已提交
            </p>
            <p className="font-zh text-[14px] text-text-tertiary/50">
              轮到 {role1 === 'fish' ? <><FrogIcon size={22} className="inline-block -mt-0.5 align-middle" /> 蛙蛙</> : <><FishIcon size={22} className="inline-block -mt-0.5 align-middle" /> 小鱼</>} 了
            </p>
          </div>
          <button onClick={startRound2}
            className="px-8 py-3 rounded-xl bg-card-glass border border-white/20 text-text-primary font-zh text-sm font-medium
              hover:bg-card-soft transition-all duration-300 active:scale-[0.97]">
            <CheckCircleIcon size={20} className="-mt-0.5 align-middle mr-1.5 inline-block" /> 好的，我来选
          </button>
        </div>
      )}

      {/* ===== 第 2 人勾选 ===== */}
      {(phase === 'pick-2') && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <div className="flex items-center gap-2.5">
            <span className="font-en text-[11px] tracking-[0.18em] text-fish-teal/50 font-medium uppercase">Quiz</span>
            <span className="w-px h-4 bg-lily-mid/30" />
            <span className="text-sm font-zh font-medium" style={{ color: role2 === 'fish' ? '#E88350' : '#6DB87C' }}>
              {roleLabel(role2!)} · 第 2 人
            </span>
          </div>
          <p className="font-zh text-[15px] text-text-secondary/50">轮到你了，这个周末你想做什么？</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {QUIZ_OPTIONS.map(opt => (
              <button key={opt} onClick={() => togglePick2(opt)}
                className={`px-5 py-3 rounded-xl text-[14px] font-zh transition-all duration-200 ${
                  picks2.includes(opt)
                    ? `bg-gradient-to-r ${role2Color} text-white shadow-md`
                    : 'bg-card-glass border border-white/20 text-text-secondary/60 hover:bg-card-soft'
                }`}>
                {opt}
              </button>
            ))}
          </div>
          <button onClick={submit2}
            className={`px-8 py-3 rounded-xl bg-gradient-to-r ${role2Color} text-white font-zh text-sm font-medium
              shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
              transition-all duration-300 active:scale-[0.97]
              ${picks2.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={picks2.length === 0}>
            <CheckCircleIcon size={20} className="-mt-0.5 align-middle mr-1.5 inline-block brightness-0 invert" />
            提交 ({picks2.length})，看看默契结果
          </button>
        </div>
      )}

      {/* ===== 计算中 ===== */}
      {phase === 'calculating' && (
        <div className="flex flex-col items-center gap-4">
          <span className="font-en text-[13px] tracking-[0.15em] text-text-tertiary/40 animate-pulse">
            <HeartIcon size={24} className="inline-block -mt-0.5 align-middle mr-2" />
            揭晓默契
          </span>
        </div>
      )}

      {/* ===== 结果弹窗（含操作按钮） ===== */}
      <GameDialog
        open={phase === 'result' && !showSub}
        icon={<HeartIcon size={40} />}
        title="默契大考验"
        subtitle={<>{roleLabel(role1!)} + {roleLabel(role2!)} 的选择</>}
        resultColor="text-heart-rose"
        result={matchItems.length > 0 ? `${matchItems.length} 项默契` : undefined}
        actions={
          matchItems.length > 0
            ? [
                { label: '全部添加到安排', onClick: () => handleChoice('add'), icon: <ClipboardIcon size={20} /> },
                { label: '再来一次', onClick: () => handleChoice('retry'), variant: 'secondary' as const, icon: <RefreshIcon size={20} /> },
                { label: '结束游戏', onClick: () => handleChoice('end'), variant: 'ghost' as const },
              ]
            : [
                { label: '再来一次', onClick: () => handleChoice('retry'), icon: <RefreshIcon size={20} /> },
                { label: '结束游戏', onClick: () => handleChoice('end'), variant: 'ghost' as const },
              ]
        }
      >
        {matchItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {matchItems.map(item => (
              <span key={item} className="px-4 py-2 rounded-lg bg-heart-rose/10 text-heart-rose text-[14px] font-zh">
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div>
            <p className="font-zh text-[15px] text-text-secondary/60">
              这次没有选到一样的呢
            </p>
            <p className="font-zh text-[13px] text-text-tertiary/50 mt-2">
              不过没关系，一起试试对方选的也挺好
            </p>
          </div>
        )}
      </GameDialog>

      {/* ===== 次级确认弹窗 ===== */}
      <GameDialog
        open={showSub}
        icon={<CheckCircleIcon size={36} />}
        title="已添加到今日安排"
        subtitle="还要继续玩默契问卷吗？"
        actions={[
          { label: '继续', onClick: () => { setShowSub(false); setRole1(null); setRole2(null); setPicks1([]); setPicks2([]); setMatchItems([]); setPhase('choose-role-1'); } },
          { label: '结束', onClick: () => { setShowSub(false); onEnd(); }, variant: 'secondary' },
        ]}
      />
    </div>
  );
}
