import { useContext, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PageContext } from './PageContext';
import WheelGame from './WheelGame';
import SlotsGame from './SlotsGame';
import QuizGame from './QuizGame';
import BreathingPanel from './BreathingPanel';
import { WheelIcon, SlotIcon, HeartIcon, NoteIcon, PinIcon, CloseIcon, FishIcon, FrogIcon, CheckCircleIcon } from './Icons';
import { fetchActivities, addActivity, deleteActivity as deleteActivityApi, fetchQuiz, markQuizDone, type User } from '../lib/auth';

/* ---------- helpers ---------- */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- tab config ---------- */
interface TabDef {
  key: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  accent: string;
  desc: string;
}

const TABS: TabDef[] = [
  {
    key: 'quiz',
    label: '默契问卷',
    sub: 'QUIZ',
    icon: <HeartIcon size={22} />,
    accent: '#FF6B8A',
    desc: '各自勾选，系统自动匹配共同选项',
  },
  {
    key: 'wheel',
    label: '转盘',
    sub: 'WHEEL',
    icon: <WheelIcon size={20} />,
    accent: '#FF9A6B',
    desc: '转一转，看缘分指向哪里',
  },
  {
    key: 'slots',
    label: '老虎机',
    sub: 'SLOTS',
    icon: <SlotIcon size={20} />,
    accent: '#6DB87C',
    desc: '拉杆！随机组合诞生',
  },
];

/* ---------- types ---------- */
export interface AgendaItem {
  id: number;
  text: string;
  source: string;
  user_id: string;
}

type View = 'idle' | 'visible' | 'game' | 'hiding';

interface Props {
  user: User;
}

/** Tab 内容卡片 — 用 key 驱动 GSAP 入场 */
function TabCard({ tab, onStart, otherReady, username, quizSubmitted, showBothBadge }: {
  tab: TabDef;
  onStart: () => void;
  otherReady?: boolean;
  username: string;
  quizSubmitted?: boolean;
  showBothBadge?: boolean;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { x: 40, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
      );
    }
  }, { scope: cardRef });

  return (
    <div ref={cardRef} className="flex flex-col items-center text-center">
      {/* 双方已提交 → 可查看结果 */}
      {showBothBadge && tab.key === 'quiz' && (
        <div className="mb-4 px-5 py-3 rounded-2xl bg-[#1A1A1A]/70 text-white text-[13px] font-zh animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <span className="block mb-1">
            <CheckCircleIcon size={16} className="inline-block -mt-0.5 align-middle mr-1 text-frog-emerald" />
            {username === 'fish' ? '蛙蛙' : '小鱼'}已选择 · 默契结果已生成
          </span>
          <span className="text-[12px] text-white/60">点击开始查看并添加到安排</span>
        </div>
      )}

      {/* 已提交等待对方 */}
      {quizSubmitted && tab.key === 'quiz' && !showBothBadge && (
        <div className="mb-4 px-5 py-3 rounded-2xl bg-[#1A1A1A]/60 text-white text-[13px] font-zh animate-ripple-in" style={{ animationFillMode: 'both' }}>
          <span className="block mb-1">
            <HeartIcon size={16} className="inline-block -mt-0.5 align-middle mr-1" />
            已提交，等{username === 'fish' ? '蛙蛙' : '小鱼'}选择中
          </span>
          <span className="text-[12px] text-white/50">选完后会自动匹配默契结果</span>
        </div>
      )}

      {/* 对方已提交提示 */}
      {otherReady && tab.key === 'quiz' && !quizSubmitted && !showBothBadge && (
        <div className="mb-4 px-5 py-3 rounded-2xl bg-[#002FA7] text-white text-[13px] font-zh animate-pop-bounce" style={{ animationFillMode: 'both' }}>
          {username === 'fish' ? <FrogIcon size={18} className="inline-block -mt-0.5 align-middle mr-1.5 brightness-0 invert" /> : <FishIcon size={18} className="inline-block -mt-0.5 align-middle mr-1.5 brightness-0 invert" />}
          {username === 'fish' ? '蛙蛙' : '小鱼'} 在等你 · 快去选择吧
        </div>
      )}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ backgroundColor: `${tab.accent}12`, color: tab.accent }}
      >
        {tab.icon}
      </div>
      <h2 className="font-zh text-[min(6vw,32px)] font-light tracking-[-0.02em] text-[#1A1A1A] mb-1">
        {tab.label}
      </h2>
      <span className="font-en text-[10px] tracking-[0.22em] text-[#8A8580]/50 font-medium uppercase mb-4">
        {tab.sub}
      </span>
      <p className="font-zh text-[14px] text-[#8A8580] font-light max-w-[28ch] leading-relaxed mb-8">
        {tab.desc}
      </p>
      <button
        onClick={onStart}
        className="group inline-flex items-center gap-2 px-8 py-3 border border-[#1A1A1A]/20
          text-[13px] font-zh font-medium text-[#1A1A1A]
          transition-all duration-300 ease-out
          hover:border-[#1A1A1A]/50 hover:bg-[#1A1A1A] hover:text-white"
      >
        <span>开始</span>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 8h10M8 3l5 5-5 5" />
        </svg>
      </button>
    </div>
  );
}

export default function PlayPage({ user }: Props) {
  const { pageIndex, activeIndex } = useContext(PageContext);
  const [view, setView] = useState<View>('idle');
  const [tab, setTab] = useState<string>('quiz');
  const [currentGame, setCurrentGame] = useState<string>('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [otherReady, setOtherReady] = useState(false);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizBothReady, setQuizBothReady] = useState(false);
  const [showBothBadge, setShowBothBadge] = useState(false);
  const [dontShowBadge, setDontShowBadge] = useState(false);

  const pageRef = useRef<HTMLDivElement>(null);
  const gameEnterRef = useRef(false);

  /* ---- 页面进出 ---- */
  useEffect(() => {
    if (activeIndex === pageIndex) {
      if (view === 'idle') { const t = setTimeout(() => setView('visible'), 80); return () => clearTimeout(t); }
      if (view === 'hiding') { setView('visible'); }
    } else if (view !== 'idle' && view !== 'hiding') {
      setView('hiding');
      setCurrentGame('');
      const t = setTimeout(() => setView('idle'), 400); return () => clearTimeout(t);
    }
  }, [activeIndex, pageIndex, view]);

  /* ---- GSAP 页面入场 ---- */
  useGSAP(() => {
    if (view === 'visible' && pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', clearProps: 'transform' },
      );
    }
  }, { dependencies: [view], scope: pageRef });

  /* ---- 游戏模式入场 elastic ---- */
  useEffect(() => {
    if (view === 'game' && !gameEnterRef.current) {
      gameEnterRef.current = true;
      // GSAP 在下一个 tick 作用于游戏容器
      requestAnimationFrame(() => {
        const gameEl = pageRef.current?.querySelector('[data-game-root]');
        if (gameEl) {
          gsap.fromTo(
            gameEl,
            { scale: 0.85, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
          );
        }
      });
    }
    if (view !== 'game') {
      gameEnterRef.current = false;
    }
  }, [view]);

  /* ---- 加载活动清单 ---- */
  useEffect(() => {
    if (activeIndex === pageIndex && agenda.length === 0 && !loadingAgenda) {
      setLoadingAgenda(true);
      fetchActivities().then((data) => {
        setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
        setLoadingAgenda(false);
      });
    }
  }, [activeIndex, pageIndex, agenda.length, loadingAgenda]);

  /* ---- 检测对方问卷提交状态（用于卡片提示），每 5s 轮询 ---- */
  useEffect(() => {
    if (tab !== 'quiz') return;

    const check = () => {
      fetchQuiz(todayStr()).then((entries) => {
        const currentRound = Math.max(1, ...entries.map(e => e.round));
        const myEntry = entries.find((e) => e.user_id === user.username && e.round === currentRound);
        const other = entries.find((e) => e.user_id !== user.username && e.round === currentRound);
        setOtherReady(!!other && !myEntry);
        setQuizBothReady(!!myEntry && !!other);
        if (!!myEntry && !!other && !dontShowBadge && !showBothBadge && !myEntry.done) {
          setShowBothBadge(true);
        }
      });
    };

    check();
    const timer = setInterval(check, 5000);
    return () => clearInterval(timer);
  }, [tab, user.username, currentGame]);

  /* ---- 游戏生命周期 ---- */
  function handleStartGame(key: string) {
    if (key === 'quiz') {
      setQuizSubmitted(false);
      setShowBothBadge(false);
      setDontShowBadge(false);
      setQuizBothReady(false);
    }
    setCurrentGame(key);
    setView('game');
  }

  function handleGameEnd() {
    setCurrentGame('');
    setQuizBothReady(false);
    setView('visible');
  }

  async function handleQuizEnd() {
    setDontShowBadge(true);
    setShowBothBadge(false);
    setCurrentGame('');
    setQuizBothReady(false);
    setView('visible');
    await markQuizDone(todayStr(), user.username);
  }

  async function addAgendaItem(text: string) {
    await addActivity(user.username, text, currentGame || 'manual');
    const data = await fetchActivities();
    setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
  }

  async function addAgendaItems(items: string[]) {
    // 全部并行写入，后台跑完再刷新列表
    await Promise.all(items.map(text => addActivity(user.username, text, currentGame || 'quiz')));
    const data = await fetchActivities();
    setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
  }

  async function deleteAgendaItem(id: number) {
    await deleteActivityApi(id);
    setAgenda(prev => prev.filter(item => item.id !== id));
  }

  async function handleManualAdd() {
    const t = inputText.trim();
    if (!t) return;
    await addActivity(user.username, t, 'manual');
    const data = await fetchActivities();
    setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
    setInputText('');
  }

  if (view === 'idle') return null;

  const inGame = view === 'game';
  const activeAccent = TABS.find(t => t.key === tab)?.accent ?? '#E88350';
  const currentTabDef = TABS.find(t => t.key === tab)!;

  /* ════════════════════════════════════════
     游戏全屏模式（同 ref → React 回收 DOM，无空窗）
     ════════════════════════════════════════ */
  if (inGame) {
    return (
      <div ref={pageRef} className="relative h-full w-full flex flex-col bg-[#FFB7C5]" data-game-root>
        {currentGame === 'wheel' && <WheelGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />}
        {currentGame === 'slots' && <SlotsGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />}
        {currentGame === 'quiz' && <QuizGame user={user} onAddItems={addAgendaItems} onEnd={handleQuizEnd} onWaitBack={() => { setQuizSubmitted(true); setCurrentGame(''); setView('visible'); }} initialBothReady={quizBothReady} />}
      </div>
    );
  }

  /* ════════════════════════════════════════
     主界面（同 ref + 同 bg → 过渡无变化）
     ════════════════════════════════════════ */
  return (
    <div
      ref={pageRef}
      className="relative h-full w-full flex flex-col px-6 md:px-8 py-6 overflow-hidden bg-[#FFB7C5]"
    >
      <BreathingPanel color="rgba(200,100,130," speed={0.7} density={0.50} blendMode="multiply" interactive />
      {/* ===== 顶部标识 ===== */}
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <span className="font-en text-[11px] font-semibold tracking-[0.15em] text-[#E88350]">
          03
        </span>
        <span className="w-6 h-px bg-[#E88350]/30" />
        <span className="font-en text-[11px] tracking-[0.08em] text-[#8A8580]">
          05
        </span>
        <span className="flex-1" />
        <span className="font-en text-[10px] tracking-[0.18em] text-[#8A8580]/50 uppercase font-medium">
          Playground
        </span>
      </div>

      {/* ===== Tab 导航 ===== */}
      <div className="flex gap-0 border-b border-[#1A1A1A]/6 shrink-0">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative px-5 py-3 font-zh text-[13px] font-medium transition-colors duration-200',
                isActive ? 'text-[#1A1A1A]' : 'text-[#8A8580]/60 hover:text-[#8A8580]',
              )}
            >
              {t.label}
              {isActive && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[2px] rounded-full"
                  style={{ backgroundColor: activeAccent }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ===== 内容区（key=tab 驱动 GSAP 入场） ===== */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-6 md:py-8" key={tab}>
        <TabCard tab={currentTabDef} onStart={() => handleStartGame(tab)} otherReady={otherReady} username={user.username} quizSubmitted={quizSubmitted} showBothBadge={showBothBadge} />
      </div>

      {/* ===== 今日安排 — 瑞士风账本 ===== */}
      <div className="shrink-0">
        {/* 分隔 */}
        <div className="flex items-center gap-3 mb-3">
          <span className="flex-1 h-px bg-[#1A1A1A]/6" />
          <span className="font-en text-[10px] tracking-[0.18em] text-[#8A8580]/50 font-medium">
            {agenda.length > 0 ? `TODAY · ${agenda.length}` : 'TODAY'}
          </span>
          <span className="flex-1 h-px bg-[#1A1A1A]/6" />
        </div>

        {/* 账本卡片 */}
        <div className="w-full bg-[#FAF8F4] border border-[#1A1A1A]/6 px-4 py-3 md:px-6 md:py-4">
          {/* 列表 */}
          <div className="flex flex-col gap-0 overflow-y-auto min-h-[60px] max-h-[120px] md:max-h-[140px]">
            {agenda.length === 0 && (
              <div className="flex items-center justify-center py-4">
                <span className="font-zh text-[13px] text-[#8A8580]/40">还没有安排，玩个小游戏添加吧</span>
              </div>
            )}
            {agenda.map((item, i) => (
              <div
                key={item.id}
                className="flex items-center gap-3 py-2 border-b border-[#1A1A1A]/4 last:border-b-0 group/item"
              >
                <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#8A8580]/40">
                  {item.source === 'manual' ? <NoteIcon size={16} /> :
                   item.source === 'wheel' ? <WheelIcon size={16} /> :
                   item.source === 'slots' ? <SlotIcon size={16} /> :
                   item.source === 'quiz' ? <HeartIcon size={16} /> : <PinIcon size={16} />}
                </span>
                <span className="w-px h-3 bg-[#1A1A1A]/8" />
                <span className="font-zh text-[13px] text-[#1A1A1A]/60 flex-1 truncate">{item.text}</span>
                <span className="font-en text-[9px] tracking-[0.04em] text-[#8A8580]/30 shrink-0">
                  {item.user_id === 'fish' ? '🐟' : '🐸'}
                </span>
                <button
                  onClick={() => deleteAgendaItem(item.id)}
                  className="opacity-0 group-hover/item:opacity-30 hover:!opacity-60 transition-opacity text-[#8A8580] text-xs leading-none shrink-0"
                >
                  <CloseIcon size={14} />
                </button>
              </div>
            ))}
          </div>

          {/* 手动添加 */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#1A1A1A]/6">
            <input
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
              placeholder="添加活动..."
              className="flex-1 bg-transparent border border-[#1A1A1A]/10 px-3 py-2 text-[13px] font-zh text-[#1A1A1A] placeholder:text-[#8A8580]/30 outline-none transition-colors focus:border-[#1A1A1A]/30"
            />
            <button
              onClick={handleManualAdd}
              className="px-4 py-2 border border-[#1A1A1A]/20 text-[12px] font-zh font-medium text-[#1A1A1A]
                hover:bg-[#1A1A1A] hover:text-white transition-all duration-200"
            >
              + 添加
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
