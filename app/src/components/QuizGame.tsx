import { useState, useEffect, useRef, useCallback, memo, type ReactNode } from 'react';
import { FishIcon, FrogIcon, HeartIcon, ClipboardIcon, CheckCircleIcon } from './Icons';
import { fetchQuiz, submitQuiz, markQuizDone, type User } from '../lib/auth';

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const QUIZ_OPTIONS = [
  '看电影', '吃火锅', '逛公园', '打游戏',
  '宅家刷剧', '做手工', '去图书馆', '运动健身',
  '尝试新餐厅', '视频聊天',
];

interface Props {
  user: User;
  onAddItems: (items: string[]) => void;
  onEnd: () => void;
  onWaitBack?: () => void;
  initialBothReady?: boolean;
}

type Phase = 'checking' | 'pick' | 'waiting' | 'result-select' | 'sub-confirm';

function roleLabel(r: 'fish' | 'frog' | null | undefined): ReactNode {
  if (r === 'fish') return <><FishIcon size={24} className="inline-block -mt-0.5 align-middle" /> 小鱼</>;
  if (r === 'frog') return <><FrogIcon size={24} className="inline-block -mt-0.5 align-middle" /> 蛙蛙</>;
  return null;
}

function roleColor(r: string | null | undefined): string {
  if (r === 'fish') return 'from-fish-teal to-fish-teal-dark';
  if (r === 'frog') return 'from-frog-emerald to-frog-emerald-dark';
  return '';
}

/** 选项按钮（memo 避免每次重渲染） */
const PickOptions = memo(function PickOptions({
  picks, myColor, onToggle,
}: {
  picks: string[];
  myColor: string;
  onToggle: (opt: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {QUIZ_OPTIONS.map(opt => (
        <button key={opt} onClick={() => onToggle(opt)}
          className={`px-5 py-3 rounded-xl text-[14px] font-zh transition-all duration-200 ${
            picks.includes(opt)
              ? `bg-gradient-to-r ${myColor} text-white shadow-md`
              : 'bg-card-glass border border-white/20 text-text-secondary/60 hover:bg-card-soft'
          }`}>
          {opt}
        </button>
      ))}
    </div>
  );
});

export default function QuizGame({ user, onAddItems, onEnd, onWaitBack, initialBothReady }: Props) {
  const myRole = user.username as 'fish' | 'frog';
  const otherRole: 'fish' | 'frog' = myRole === 'fish' ? 'frog' : 'fish';

  const [quizRound, setQuizRound] = useState(0);
  const [phase, setPhase] = useState<Phase>('checking');
  const [picks, setPicks] = useState<string[]>([]);
  const [matchItems, setMatchItems] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [otherSubmitted, setOtherSubmitted] = useState(false);
  const [addedItems, setAddedItems] = useState<string[]>([]);

  const pollRef = useRef<ReturnType<typeof setInterval>>();

  /* ---- 初始化：获取数据、判定阶段 ---- */
  const init = useCallback(async (bothReadyHint: boolean) => {
    const entries = await fetchQuiz(todayStr());

    // 确定当前轮次：取所有 entries 的最大 round
    const maxRound = Math.max(1, ...entries.map(e => e.round));

    // 只匹配当前轮次的数据
    const myEntry = entries.find(e => e.user_id === myRole && e.round === maxRound);
    const otherEntry = entries.find(e => e.user_id === otherRole && e.round === maxRound);

    setQuizRound(maxRound);

    if (bothReadyHint && myEntry && otherEntry && !myEntry.done) {
      // 双方数据都在且未完成 → 直接展示交集结果
      const intersection = myEntry.picks.filter(p => otherEntry.picks.includes(p));
      setPicks(myEntry.picks);
      setMatchItems(intersection);
      setSelectedItems([...intersection]);
      setAddedItems([]);
      setPhase('result-select');
      return;
    }

    if (myEntry?.done) {
      // 我的本轮已完成 → 开新轮
      const newRound = maxRound + 1;
      setQuizRound(newRound);
      setPicks([]);
      setPhase('pick');
      return;
    }

    if (myEntry && otherEntry) {
      // 双方都在本轮提交了 → 结果
      const intersection = myEntry.picks.filter(p => otherEntry.picks.includes(p));
      setPicks(myEntry.picks);
      setMatchItems(intersection);
      setSelectedItems([...intersection]);
      setAddedItems([]);
      setPhase('result-select');
    } else if (myEntry) {
      // 只有自己提交了 → 等待
      setPicks(myEntry.picks);
      setOtherSubmitted(!!otherEntry);
      setPhase('waiting');
    } else {
      // 无数据 或 只有对方已提交 → 新选
      setPicks([]);
      setOtherSubmitted(!!otherEntry);
      setPhase('pick');
    }
  }, [myRole, otherRole]);

  useEffect(() => {
    init(!!initialBothReady);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [init]);

  /* ---- 等待期间轮询对方是否提交 ---- */
  useEffect(() => {
    if (phase !== 'waiting') {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = undefined; }
      return;
    }
    pollRef.current = setInterval(async () => {
      const entries = await fetchQuiz(todayStr());
      const otherEntry = entries.find(e => e.user_id === otherRole && e.round === quizRound);
      const myEntry = entries.find(e => e.user_id === myRole && e.round === quizRound);
      if (otherEntry && myEntry) {
        clearInterval(pollRef.current!);
        pollRef.current = undefined;
        const intersection = myEntry.picks.filter(p => otherEntry.picks.includes(p));
        setMatchItems(intersection);
        setSelectedItems([...intersection]);
        setPhase('result-select');
      } else if (otherEntry) {
        setOtherSubmitted(true);
      }
    }, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [phase, otherRole, myRole, quizRound]);

  /* ---- 选择 / 提交 ---- */
  const togglePick = useCallback((opt: string) => {
    setPicks(prev => prev.includes(opt) ? prev.filter(v => v !== opt) : [...prev, opt]);
  }, []);

  async function handleSubmit() {
    if (picks.length === 0) return;
    await submitQuiz(todayStr(), myRole, picks, quizRound);
    // 提交后检查对方是否在本次轮有数据
    const entries = await fetchQuiz(todayStr());
    const otherEntry = entries.find(e => e.user_id === otherRole && e.round === quizRound);
    if (otherEntry) {
      const intersection = picks.filter(p => otherEntry.picks.includes(p));
      setMatchItems(intersection);
      setSelectedItems([...intersection]);
      setPhase('result-select');
    } else {
      setPhase('waiting');
    }
  }

  /* ---- 结果添加（乐观更新：先改本地，再异步发 Supabase） ---- */
  function toggleSelect(item: string) {
    setSelectedItems(prev => prev.includes(item) ? prev.filter(v => v !== item) : [...prev, item]);
  }

  function handleAddItems() {
    const newItems = selectedItems.filter(i => !addedItems.includes(i));
    if (newItems.length > 0) onAddItems(newItems); // fire-and-forget
    setAddedItems(prev => [...new Set([...prev, ...selectedItems])]);
  }

  /** 完成本轮 → 标 done + 返回主界面（不自动添加事件） */
  function handleFinish() {
    markQuizDone(todayStr(), myRole); // fire-and-forget
    onEnd();
  }

  const myColor = roleColor(myRole);
  const myRoleLabel = roleLabel(myRole);
  const otherRoleLabel = roleLabel(otherRole);

  if (phase === 'checking') {
    return null; // loading
  }

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center select-none px-4">

      {/* ===== 选择 ===== */}
      {phase === 'pick' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <div className="flex items-center gap-2.5">
            <span className="font-en text-[11px] tracking-[0.18em] text-heart-rose/50 font-medium uppercase">Quiz</span>
            <span className="w-px h-4 bg-lily-mid/30" />
            <span className="text-sm font-zh font-medium">{myRoleLabel} · 挑选</span>
          </div>
          <p className="font-zh text-[15px] text-text-secondary/50">这个周末你想做什么？</p>
          {otherSubmitted && (
            <div className="px-4 py-2 rounded-xl bg-[#002FA7] text-white text-[13px] font-zh animate-pop-bounce" style={{ animationFillMode: 'both' }}>
              {otherRoleLabel} 已提交 · 选完会自动匹配默契结果
            </div>
          )}
          <PickOptions picks={picks} myColor={myColor} onToggle={togglePick} />
          <button onClick={handleSubmit}
            className={`px-8 py-3 rounded-xl bg-gradient-to-r ${myColor} text-white font-zh text-sm font-medium
              shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]
              transition-all duration-300 active:scale-[0.97]
              ${picks.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            disabled={picks.length === 0}>
            <CheckCircleIcon size={20} className="-mt-0.5 align-middle mr-1.5 inline-block brightness-0 invert" />
            提交 ({picks.length})
          </button>
          <button onClick={onEnd}
            className="mt-1 text-[12px] font-zh text-text-tertiary/40 hover:text-text-tertiary/70 transition-colors duration-200">
            结束
          </button>
        </div>
      )}

      {/* ===== 等待 ===== */}
      {phase === 'waiting' && (
        <div className="flex flex-col items-center gap-6 animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <span className="font-en text-[11px] tracking-[0.18em] text-text-tertiary/60 uppercase">Waiting</span>
          <div className="text-center">
            <p className="font-zh text-[16px] text-text-secondary/60 mb-1">
              {myRoleLabel} 已提交
            </p>
            <p className="font-zh text-[14px] text-text-tertiary/50">
              {otherSubmitted ? '对方正在查看结果...' : <span>等 {otherRoleLabel} 选择中</span>}
            </p>
          </div>
          {onWaitBack && (
            <button onClick={onWaitBack}
              className="px-8 py-3 rounded-xl bg-card-glass border border-white/20 text-text-primary font-zh text-sm font-medium
                hover:bg-card-soft transition-all duration-300 active:scale-[0.97]">
              返回
            </button>
          )}
        </div>
      )}

      {/* ===== 默契结果 + 选择表单 ===== */}
      {phase === 'result-select' && (
        <div className="flex flex-col items-center gap-5 w-full max-w-md animate-scale-in" style={{ animationFillMode: 'both' }}>
          <div className="w-full rounded-2xl bg-card-glass backdrop-blur-xl border border-white/20 px-5 py-6 shadow-[0_4px_20px_var(--color-shadow-lg)]">
            <div className="flex items-center gap-2 mb-4">
              <HeartIcon size={20} className="text-heart-rose" />
              <span className="font-en text-[11px] tracking-[0.15em] text-heart-rose font-medium uppercase">默契大考验</span>
            </div>

            <div className="flex items-center gap-2 mb-5 text-sm font-zh text-text-secondary/80">
              <span>{myRoleLabel}</span>
              <span className="text-text-tertiary/40">+</span>
              <span>{otherRoleLabel}</span>
            </div>

            {matchItems.length > 0 ? (
              <>
                <p className="font-zh text-[13px] text-text-secondary/60 mb-3">
                  有 <span className="text-heart-rose font-medium">{matchItems.length}</span> 项默契匹配：
                </p>
                <div className="flex flex-col gap-2 mb-4">
                  {matchItems.map(item => {
                    const alreadyAdded = addedItems.includes(item);
                    const checked = alreadyAdded || selectedItems.includes(item);
                    return (
                      <div
                        key={item}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                          alreadyAdded
                            ? 'bg-frog-emerald/8 border border-frog-emerald/20 opacity-60'
                            : checked
                              ? 'bg-heart-rose/10 border border-heart-rose/30 cursor-pointer'
                              : 'bg-white/40 border border-transparent hover:bg-white/60 cursor-pointer'
                        }`}
                        onClick={() => !alreadyAdded && toggleSelect(item)}
                      >
                        {alreadyAdded ? (
                          <CheckCircleIcon size={18} className="text-frog-emerald shrink-0" />
                        ) : (
                          <input
                            type="checkbox"
                            checked={checked}
                            readOnly
                            className="w-4 h-4 accent-heart-rose shrink-0"
                          />
                        )}
                        <span className={`font-zh text-[14px] ${alreadyAdded ? 'text-frog-emerald' : checked ? 'text-text-primary font-medium' : 'text-text-secondary/60'}`}>
                          {item}
                        </span>
                        {alreadyAdded && (
                          <span className="ml-auto font-en text-[10px] tracking-[0.05em] text-frog-emerald font-medium">
                            已添加
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <button onClick={handleAddItems}
                  className={`w-full px-8 py-3 rounded-xl font-zh text-sm font-medium transition-all duration-300 active:scale-[0.97] ${
                    selectedItems.length > addedItems.length
                      ? selectedItems.length === matchItems.length
                        ? 'bg-gradient-to-r from-heart-rose to-sunset-coral text-white shadow-[0_4px_16px_var(--color-shadow-lg)] hover:shadow-[0_8px_24px_var(--color-shadow-xl)]'
                        : 'bg-card-glass border border-white/20 text-text-primary hover:bg-card-soft'
                      : 'opacity-40 cursor-not-allowed bg-card-glass border border-white/20 text-text-primary'
                  }`}
                  disabled={selectedItems.length <= addedItems.length}>
                  <ClipboardIcon size={18} className={`-mt-0.5 align-middle mr-1.5 inline-block ${
                    selectedItems.length === matchItems.length ? 'brightness-0 invert' : ''
                  }`} />
                  {(() => {
                    const newCount = selectedItems.filter(i => !addedItems.includes(i)).length;
                    if (newCount === 0) return '没有新项可添加';
                    if (selectedItems.length === matchItems.length && addedItems.length === 0) return `全部添加 (${newCount})`;
                    return `添加新选的 (${newCount})`;
                  })()}
                </button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="font-zh text-[15px] text-text-secondary/60">
                  这次没有选到一样的呢
                </p>
                <p className="font-zh text-[13px] text-text-tertiary/50 mt-2">
                  不过没关系，一起试试对方选的也挺好
                </p>
              </div>
            )}
          </div>

          <button onClick={handleFinish}
            className="w-full max-w-md px-8 py-3 rounded-xl bg-card-glass border border-white/20 text-text-primary font-zh text-sm font-medium
              hover:bg-card-soft transition-all duration-300 active:scale-[0.97]">
            完成
          </button>
        </div>
      )}
    </div>
  );
}
