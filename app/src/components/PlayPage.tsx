import { useContext, useEffect, useState } from 'react';
import { PageContext } from './PageContext';
import WheelGame from './WheelGame';
import SlotsGame from './SlotsGame';
import QuizGame from './QuizGame';
import BreathingPanel from './BreathingPanel';
import { WheelIcon, SlotIcon, HeartIcon, NoteIcon, PinIcon, CloseIcon } from './Icons';
import { fetchActivities, addActivity, deleteActivity as deleteActivityApi, type User } from '../lib/auth';

/* ---------- helpers ---------- */
function cn(...classes: (string | false | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
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

export default function PlayPage({ user }: Props) {
  const { pageIndex, activeIndex } = useContext(PageContext);
  const [view, setView] = useState<View>('idle');
  const [tab, setTab] = useState<string>('quiz');    // active tab
  const [currentGame, setCurrentGame] = useState<string>('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingAgenda, setLoadingAgenda] = useState(false);

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

  /* ---- 游戏生命周期 ---- */
  function handleStartGame(key: string) {
    setCurrentGame(key);
    setView('game');
  }

  function handleGameEnd() {
    setCurrentGame('');
    setView('visible');
  }

  async function addAgendaItem(text: string) {
    await addActivity(user.username, text, currentGame || 'manual');
    const data = await fetchActivities();
    setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
  }

  async function addAgendaItems(items: string[]) {
    for (const text of items) await addActivity(user.username, text, currentGame || 'quiz');
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

  const visible = view === 'visible';
  const inGame = view === 'game';
  const activeAccent = TABS.find(t => t.key === tab)?.accent ?? '#E88350';

  /* ════════════════════════════════════════
     游戏全屏模式
     ════════════════════════════════════════ */
  if (inGame) {
    return (
      <div className="relative h-full w-full flex flex-col animate-swiss-fade">
        {currentGame === 'wheel' && <WheelGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />}
        {currentGame === 'slots' && <SlotsGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />}
        {currentGame === 'quiz' && <QuizGame onAddItems={addAgendaItems} onEnd={handleGameEnd} />}
      </div>
    );
  }

  /* ════════════════════════════════════════
     主界面 — Tab 导航 + 游戏卡 + 活动清单
     ════════════════════════════════════════ */
  return (
      <div className={cn(
      "relative h-full w-full flex flex-col px-6 md:px-8 py-6 overflow-hidden transition-opacity duration-500",
      visible ? "opacity-100" : "opacity-0"
    )}>
      {/* 游戏符号呼吸粒子背景 */}
      <BreathingPanel color="rgba(232,131,80," speed={0.8} density={0.15} blendMode="screen" palette="♠♥♦♣★☆◆◇◎◈" />
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
                "relative px-5 py-3 font-zh text-[13px] font-medium transition-colors duration-200",
                isActive ? "text-[#1A1A1A]" : "text-[#8A8580]/60 hover:text-[#8A8580]"
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

      {/* ===== 内容区 ===== */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-6 md:py-8">
        {TABS.map((t) => {
          if (t.key !== tab) return null;
          return (
            <div
              key={t.key}
              className="flex flex-col items-center text-center animate-swiss-fade"
            >
              {/* 图标 */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                style={{ backgroundColor: `${t.accent}12`, color: t.accent }}
              >
                {t.icon}
              </div>

              {/* 标题 */}
              <h2 className="font-zh text-[min(6vw,32px)] font-light tracking-[-0.02em] text-[#1A1A1A] mb-1">
                {t.label}
              </h2>
              <span className="font-en text-[10px] tracking-[0.22em] text-[#8A8580]/50 font-medium uppercase mb-4">
                {t.sub}
              </span>

              {/* 描述 */}
              <p className="font-zh text-[14px] text-[#8A8580] font-light max-w-[28ch] leading-relaxed mb-8">
                {t.desc}
              </p>

              {/* 开始按钮 — 瑞士风极简按钮 */}
              <button
                onClick={() => handleStartGame(t.key)}
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
        })}
      </div>

      {/* ===== 今日安排 — 瑞士风账本 ===== */}
      <div className="shrink-0 animate-swiss-fade" style={{ animationDelay: '0.1s' }}>
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
