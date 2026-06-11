import { useContext, useEffect, useState } from 'react';
import { PageContext } from './PageContext';
import WheelGame from './WheelGame';
import SlotsGame from './SlotsGame';
import QuizGame from './QuizGame';
import { WheelIcon, SlotIcon, HeartIcon, NoteIcon, PinIcon, CloseIcon } from './Icons';
import { fetchActivities, addActivity, deleteActivity as deleteActivityApi, type User } from '../lib/auth';

const GAME_CARDS = [
  {
    icon: <HeartIcon size={28} />,
    title: '默契问卷',
    subtitle: 'QUIZ',
    desc: '各自勾选，看看重合度',
    accent: 'rose',
    key: 'quiz' as const,
    gradient: 'from-[#FF6B8A]/20 to-[#FF6B8A]/5',
    border: 'border-[#FF6B8A]/30',
    badge: 'bg-[#FF6B8A]',
  },
  {
    icon: <WheelIcon size={24} />,
    title: '转盘',
    subtitle: 'WHEEL',
    desc: '转一转，看缘分指向哪里',
    accent: 'coral',
    key: 'wheel' as const,
    gradient: 'from-[#FF9A6B]/20 to-[#FF9A6B]/5',
    border: 'border-[#FF9A6B]/30',
    badge: 'bg-[#FF9A6B]',
  },
  {
    icon: <SlotIcon size={24} />,
    title: '老虎机',
    subtitle: 'SLOTS',
    desc: '拉杆！随机组合诞生',
    accent: 'emerald',
    key: 'slots' as const,
    gradient: 'from-[#6DB87C]/20 to-[#6DB87C]/5',
    border: 'border-[#6DB87C]/30',
    badge: 'bg-[#6DB87C]',
  },
];

export interface AgendaItem {
  id: number;
  text: string;
  source: string;
  user_id: string;
}

type Display = 'idle' | 'entering' | 'cards' | 'exiting-cards' | 'game' | 'exiting-game' | 'exiting-page';

interface Props {
  user: User;
}

export default function PlayPage({ user }: Props) {
  const { pageIndex, activeIndex } = useContext(PageContext);
  const [display, setDisplay] = useState<Display>('idle');
  const [currentGame, setCurrentGame] = useState<string>('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingAgenda, setLoadingAgenda] = useState(false);

  // 页面进出
  useEffect(() => {
    if (activeIndex === pageIndex) {
      if (display === 'idle') setDisplay('entering');
    } else if (display !== 'idle' && display !== 'exiting-page') {
      setDisplay('exiting-page');
      setCurrentGame('');
    }
  }, [activeIndex, pageIndex, display]);

  useEffect(() => {
    if (display === 'entering') {
      const t = setTimeout(() => setDisplay('cards'), 1400);
      return () => clearTimeout(t);
    }
  }, [display]);

  useEffect(() => {
    if (display === 'exiting-page') {
      const t = setTimeout(() => setDisplay('idle'), 600);
      return () => clearTimeout(t);
    }
  }, [display]);

  function handleCardClick(key: string) {
    setDisplay('exiting-cards');
    setCurrentGame(key);
    setTimeout(() => {
      setDisplay('game');
    }, 850);
  }

  function handleGameEnd() {
    setDisplay('exiting-game');
    setCurrentGame('');
    setTimeout(() => {
      setDisplay('entering');
    }, 350);
  }

  // 首次加载时从 Supabase 读取活动清单
  useEffect(() => {
    if (activeIndex === pageIndex && agenda.length === 0 && !loadingAgenda) {
      setLoadingAgenda(true);
      fetchActivities().then((data) => {
        setAgenda(data.map((a) => ({
          id: a.id!,
          text: a.text,
          source: a.source,
          user_id: a.user_id,
        })));
        setLoadingAgenda(false);
      });
    }
  }, [activeIndex, pageIndex, agenda.length, loadingAgenda]);

  async function addAgendaItem(text: string) {
    const source = currentGame || 'manual';
    await addActivity(user.username, text, source);
    // 刷新
    const data = await fetchActivities();
    setAgenda(data.map((a) => ({ id: a.id!, text: a.text, source: a.source, user_id: a.user_id })));
  }

  async function addAgendaItems(items: string[]) {
    const source = currentGame || 'quiz';
    for (const text of items) {
      await addActivity(user.username, text, source);
    }
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

  const enterPhase = display === 'entering';
  const cardsPhase = display === 'cards';
  const showCards = enterPhase || cardsPhase || display === 'exiting-cards' || display === 'exiting-page';
  const cardsExiting = display === 'exiting-cards' || display === 'exiting-page';
  const gameVisible = display === 'game';

  if (display === 'idle' || display === 'exiting-game') return null;

  return (
    <div className="h-full w-full flex flex-col px-5 md:px-8 py-6 relative overflow-hidden">

      {/* ===== 顶部标识 — 去除 em-dash，改用更干净的标签 ===== */}
      {!gameVisible && (
        <div className="flex items-center gap-2.5 mb-4 shrink-0">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-fish-teal/50" />
          <span className="font-en text-[11px] tracking-[0.18em] text-fish-teal/50 font-medium">
            Playground
          </span>
          <span className="flex-1 h-px bg-gradient-to-r from-fish-teal/20 to-transparent" />
        </div>
      )}

      {/* ===== 游戏卡片 — Bento 非对称布局 ===== */}
      {showCards && (
        <div className="flex gap-3 md:gap-4 w-full flex-1 min-h-0">
          {/* 左列 — 默契问卷 (大卡) */}
          <div className="flex-1 md:flex-[1.3] flex flex-col">
            <button
              onClick={() => handleCardClick('quiz')}
              className={`
                flex-1 flex flex-col items-center justify-center gap-2.5
                bg-card-glass backdrop-blur-xl
                rounded-[1.8rem] md:rounded-[2.2rem]
                border border-[#FF6B8A]/15
                shadow-[0_4px_24px_var(--color-shadow-lg),inset_0_1px_0_rgba(255,255,255,0.5)]
                transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                hover:shadow-[0_8px_40px_var(--color-shadow-xl)]
                hover:-translate-y-0.5
                cursor-pointer group
                animate-ripple-in
              `}
              style={{
                animationDelay: enterPhase ? '0.15s' : cardsExiting ? '0.35s' : '0s',
                animationFillMode: 'both',
              }}
            >
              <span className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-[#FF6B8A]/10 flex items-center justify-center
                group-hover:bg-[#FF6B8A]/20 transition-colors duration-300
                group-hover:scale-110 transition-transform duration-500">
                <span className="text-[#FF6B8A]">{GAME_CARDS[0].icon}</span>
              </span>
              <div className="w-8 h-0.5 rounded-full bg-[#FF6B8A]/30" />
              <h3 className="font-zh text-xl md:text-2xl font-medium text-text-primary">{GAME_CARDS[0].title}</h3>
              <span className="font-en text-[9px] md:text-[10px] tracking-[0.2em] text-text-tertiary/60 uppercase">{GAME_CARDS[0].subtitle}</span>
              <p className="font-zh text-xs md:text-sm text-text-secondary/60 text-center leading-relaxed max-w-[14ch]">{GAME_CARDS[0].desc}</p>
              <span className="font-en text-[10px] tracking-[0.08em] text-[#FF6B8A]/0 group-hover:text-[#FF6B8A]/60 transition-all duration-300 mt-1">
                Enter
              </span>
            </button>
          </div>

          {/* 右列 — 转盘 + 老虎机 (两小卡) */}
          <div className="flex-1 flex flex-col gap-3 md:gap-4">
            {[GAME_CARDS[1], GAME_CARDS[2]].map((card, i) => {
              const cardAccent = card.accent === 'coral' ? '#FF9A6B' : '#6DB87C';
              return (
                <button
                  key={card.key}
                  onClick={() => handleCardClick(card.key)}
                  className={`
                    flex-1 flex flex-row md:flex-col items-center justify-center gap-3 md:gap-2
                    bg-card-glass backdrop-blur-xl
                    rounded-[1.5rem] md:rounded-[2rem]
                    border border-white/20
                    shadow-[0_4px_24px_var(--color-shadow-lg),inset_0_1px_0_rgba(255,255,255,0.5)]
                    transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                    hover:shadow-[0_8px_32px_var(--color-shadow-xl)]
                    hover:-translate-y-0.5
                    px-4 md:px-3
                    cursor-pointer group
                    animate-float-up
                  `}
                  style={{
                    animationDelay: enterPhase
                      ? `${0.30 + i * 0.12}s`
                      : cardsExiting
                        ? `${0.25 + i * 0.08}s`
                        : '0s',
                    animationFillMode: 'both',
                  }}
                >
                  <span className="w-11 h-11 md:w-14 md:h-14 rounded-xl bg-white/40 flex items-center justify-center
                    group-hover:bg-white/60 transition-colors duration-300
                    group-hover:scale-110 transition-transform duration-500"
                    style={{ color: cardAccent }}
                  >
                    {card.icon}
                  </span>
                  <div className="flex flex-col items-start md:items-center gap-0.5">
                    <h3 className="font-zh text-base md:text-xl font-medium text-text-primary">{card.title}</h3>
                    <span className="font-en text-[8px] md:text-[10px] tracking-[0.2em] text-text-tertiary/60 uppercase">{card.subtitle}</span>
                    <p className="font-zh text-[11px] md:text-xs text-text-secondary/50 text-center leading-relaxed max-w-[14ch] hidden md:block">{card.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 游戏区域 ===== */}
      {gameVisible && currentGame === 'wheel' && (
        <div className="absolute inset-0 z-20 flex flex-col animate-scale-in" style={{ animationFillMode: 'both' }}>
          <WheelGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />
        </div>
      )}
      {gameVisible && currentGame === 'slots' && (
        <div className="absolute inset-0 z-20 flex flex-col animate-scale-in" style={{ animationFillMode: 'both' }}>
          <SlotsGame onAddItem={addAgendaItem} onEnd={handleGameEnd} />
        </div>
      )}
      {gameVisible && currentGame === 'quiz' && (
        <div className="absolute inset-0 z-20 flex flex-col animate-scale-in" style={{ animationFillMode: 'both' }}>
          <QuizGame onAddItems={addAgendaItems} onEnd={handleGameEnd} />
        </div>
      )}

      {/* ===== 今日安排 — 期刊式底部面板 ===== */}
      {!gameVisible && (
        <div
          className="shrink-0 mt-3 animate-float-up"
          style={{
            animationDelay: enterPhase ? '0.55s' : cardsExiting ? '0.15s' : '0s',
            animationFillMode: 'both',
          }}
        >
          {/* 分隔 */}
          <div className="flex items-center gap-2.5 mb-2">
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-lily-mid/40 to-transparent" />
            <span className="font-en text-[10px] tracking-[0.18em] text-lily-deep/50 font-medium">
              {agenda.length > 0 ? `Today ${agenda.length}` : 'Today'}
            </span>
            <span className="flex-1 h-px bg-gradient-to-r from-transparent via-lily-mid/40 to-transparent" />
          </div>

          {/* 安排卡片 — 期刊式浮层 */}
          <div className="w-full rounded-[1.8rem] md:rounded-[2.2rem] bg-card-glass-deep backdrop-blur-xl
            border border-white/20
            shadow-[0_4px_24px_var(--color-shadow-lg),inset_0_1px_0_rgba(255,255,255,0.5)]
            px-5 py-4 md:px-7 md:py-5
            flex-1 min-h-0 flex flex-col">

            {/* 内容区 */}
            <div className="flex-1 flex flex-col justify-start gap-0.5 overflow-y-auto min-h-[80px] max-h-[140px] md:max-h-[160px]">
              {agenda.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="font-zh text-[13px] text-text-tertiary/40">
                    还没有安排，玩个小游戏添加吧
                  </span>
                </div>
              )}
              {agenda.map((item, i) => (
                <div
                  key={item.id}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-xl
                    transition-all duration-300 hover:bg-white/30 group/item
                    ${enterPhase || cardsPhase ? 'animate-fade-slide-up' : ''}
                  `}
                  style={{
                    animationDelay: enterPhase ? `${0.65 + i * 0.06}s` : '0s',
                    animationFillMode: 'both',
                  }}
                >
                  <span className="w-5 h-5 flex items-center justify-center shrink-0 opacity-50">
                    {item.source === 'manual' ? <NoteIcon size={18} /> : item.source === 'wheel' ? <WheelIcon size={18} /> : item.source === 'slots' ? <SlotIcon size={18} /> : item.source === 'quiz' ? <HeartIcon size={18} /> : <PinIcon size={18} />}
                  </span>
                  <span className="w-px h-4 bg-lily-mid/30" />
                  <span className="font-zh text-sm md:text-base text-text-primary/60 flex-1 truncate">{item.text}</span>
                  <span className="font-en text-[9px] tracking-[0.08em] text-text-tertiary/30 shrink-0 mr-1">
                    {item.user_id === 'fish' ? '🐟' : '🐸'}
                  </span>
                  <button
                    onClick={() => deleteAgendaItem(item.id)}
                    className="opacity-0 group-hover/item:opacity-30 hover:!opacity-60 transition-opacity duration-200 text-text-secondary text-sm leading-none shrink-0"
                  >
                    <CloseIcon size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* 手动添加 */}
            <div className="flex gap-2 mt-3 pt-3 border-t border-white/20">
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualAdd()}
                placeholder="添加活动..."
                className="flex-1 bg-white/30 rounded-xl px-4 py-2.5 text-sm font-zh text-text-primary placeholder:text-text-tertiary/40 outline-none border border-white/20 focus:border-fish-teal/40 transition-all"
              />
              <button
                onClick={handleManualAdd}
                className="px-5 py-2.5 rounded-xl bg-fish-teal text-white text-sm font-zh font-medium hover:bg-fish-teal-dark hover:shadow-lg transition-all duration-300 active:scale-[0.97]"
              >
                + 添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
