import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentUser, fetchMessages, sendMessage, type Message } from '../lib/auth';
import { FishIcon, FrogIcon } from './Icons';

const TRACK_COUNT = 6;
const TRACK_HEIGHTS = [6, 20, 34, 48, 62, 76]; // vh %
const POLL_MS = 5000;
const MAX_BULLETS = 60;

interface Bullet {
  key: number;
  text: string;
  userId: string;
  track: number;
  duration: number;
  enteredAt: number;
}

export default function BarrageBoard() {
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [history, setHistory] = useState<Message[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [input, setInput] = useState('');
  const user = getCurrentUser();
  const keyRef = useRef(0);
  const loadedIds = useRef(new Set<number>());
  const historyEndRef = useRef<HTMLDivElement>(null);

  const isFish = user?.username === 'fish';
  const myColor = isFish ? '#E88350' : '#6DB87C';

  /** 将新 Message[] 转为飞入 Bullet + 更新历史 */
  const ingest = useCallback((msgs: Message[]) => {
    const freshBullets: Bullet[] = [];
    let newCount = 0;
    for (const m of msgs) {
      if (m.id == null || loadedIds.current.has(m.id)) continue;
      loadedIds.current.add(m.id);
      newCount++;
      freshBullets.push({
        key: keyRef.current++,
        text: m.text,
        userId: m.user_id,
        track: Math.floor(Math.random() * TRACK_COUNT),
        duration: 7 + Math.random() * 4,
        enteredAt: performance.now(),
      });
    }
    if (newCount === 0) return false;
    setBullets(prev => [...prev.slice(-(MAX_BULLETS - freshBullets.length)), ...freshBullets]);
    setHistory(msgs);
    return true;
  }, []);

  /** 拉取留言 */
  const poll = useCallback(async () => {
    const data = await fetchMessages();
    if (!data || data.length === 0) return;
    ingest(data);
  }, [ingest]);

  // 首次加载 + 轮询
  useEffect(() => {
    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => clearInterval(timer);
  }, [poll]);

  // 清理已离屏 bullet
  useEffect(() => {
    const cleaner = setInterval(() => {
      const now = performance.now();
      setBullets(prev => prev.filter(b => now - b.enteredAt < 16000));
    }, 3000);
    return () => clearInterval(cleaner);
  }, []);

  // 历史面板展开时自动滚到底部（直接操作容器 scrollTop，不触发祖先滚动）
  useEffect(() => {
    if (showHistory) {
      const parent = historyEndRef.current?.parentElement;
      if (parent) {
        parent.scrollTop = parent.scrollHeight;
      }
    }
  }, [showHistory, history.length]);

  /** 发送留言 */
  async function handleSend() {
    const text = input.trim();
    if (!text || !user) return;
    await sendMessage(user.username, text);
    setInput('');
    await poll();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      {/* ═══ 飞入弹幕层（flex-1 高度永远不变） ═══ */}
      <div className="flex-1 relative overflow-hidden">
        {bullets.map(b => {
          const isMe = b.userId === user?.username;
          return (
            <span
              key={b.key}
              className="absolute whitespace-nowrap font-zh text-[15px] md:text-[17px] font-medium tracking-[0.01em]"
              style={{
                top: `${TRACK_HEIGHTS[b.track]}vh`,
                left: '100%',
                color: isMe ? '#fff' : b.userId === 'fish' ? '#E88350' : '#6DB87C',
                background: isMe ? myColor : 'transparent',
                borderRadius: '999px',
                padding: isMe ? '4px 16px' : '0',
                boxShadow: isMe ? `0 2px 12px ${myColor}44` : 'none',
                opacity: 0.92,
                textShadow: isMe ? '0 1px 2px rgba(0,0,0,0.15)' : '0 1px 4px rgba(255,255,255,0.6)',
                animation: `barrage-fly ${b.duration}s linear forwards`,
              }}
            >
              {b.text}
            </span>
          );
        })}
      </div>

      {/* ═══ 历史面板（absolute 叠加，不改变 flex 流） ═══ */}
      {/* 切换按钮 */}
      <div className="relative z-10 shrink-0 px-4">
        <button
          onClick={() => setShowHistory(v => !v)}
          className="mx-auto flex items-center gap-1.5 text-[11px] font-en tracking-[0.12em] text-text-tertiary/50 hover:text-text-tertiary/80 transition-colors pb-1"
        >
          <span>留言记录 ({history.length})</span>
          <svg
            className={`w-3 h-3 transition-transform duration-300 ${showHistory ? 'rotate-180' : ''}`}
            viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          >
            <path d="M3 5l3 3 3-3" />
          </svg>
        </button>
      </div>

      {/* 历史弹出层 — absolute 覆盖在弹幕区上方，不占 flex 空间 */}
      {showHistory && (
        <div className="absolute inset-x-4 bottom-[76px] z-20 animate-scale-in" style={{ animationFillMode: 'both' }}>
          <div className="relative max-w-[720px] mx-auto">
            {/* 收起按钮 */}
            <button
              onClick={() => setShowHistory(false)}
              className="absolute -top-2 right-0 z-30 w-6 h-6 flex items-center justify-center rounded-full
                bg-card-glass-deep backdrop-blur-xl border border-white/30 text-text-tertiary/50
                hover:text-text-tertiary/80 hover:border-white/50 transition-all duration-200"
              aria-label="收起留言记录"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M2 9l4-4 4 4" />
              </svg>
            </button>
            <div className="bg-card-glass-deep backdrop-blur-xl border border-white/20
              rounded-[1.2rem] shadow-[0_4px_20px_var(--color-shadow-lg)]
              max-h-[200px] overflow-y-auto px-4 py-3 space-y-2">
            {history.length === 0 && (
              <p className="text-center text-text-tertiary/40 text-sm font-zh py-4">还没有留言</p>
            )}
            {history.map(m => {
              const isMe = m.user_id === user?.username;
              const mColor = m.user_id === 'fish' ? '#E88350' : '#6DB87C';
              return (
                <div key={m.id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="shrink-0 mt-0.5" style={{ color: mColor }}>
                    {m.user_id === 'fish' ? <FishIcon size={16} /> : <FrogIcon size={16} />}
                  </span>
                  <div
                    className="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm font-zh leading-relaxed"
                    style={{
                      background: isMe ? myColor : 'rgba(255,255,255,0.6)',
                      color: isMe ? '#fff' : '#3D3A36',
                      borderBottomLeftRadius: isMe ? '1rem' : '4px',
                      borderBottomRightRadius: isMe ? '4px' : '1rem',
                    }}
                  >
                    {m.text}
                  </div>
                  {m.created_at && (
                    <span className="text-[10px] text-text-tertiary/30 shrink-0 mt-1.5 hidden md:inline">
                      {m.created_at.slice(11, 16)}
                    </span>
                  )}
                </div>
              );
            })}
            <div ref={historyEndRef} />
          </div>
          </div>
        </div>
      )}

      {/* ═══ 底部输入栏 ═══ */}
      <div className="relative z-10 shrink-0 px-4 pb-5 pt-0">
        <div className="max-w-[720px] mx-auto rounded-[1.5rem] bg-card-glass-deep backdrop-blur-xl
          border border-white/30 shadow-[0_4px_24px_var(--color-shadow-lg)]
          px-5 py-3 flex items-center gap-3">
          <span className={isFish ? 'text-fish-teal' : 'text-frog-emerald'}>
            {isFish ? <FishIcon size={20} /> : <FrogIcon size={20} />}
          </span>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么…"
            className="flex-1 bg-transparent outline-none text-sm font-zh text-text-primary placeholder:text-text-tertiary/40"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-fish-teal to-fish-teal-dark text-white text-xs font-medium
              transition-all duration-200 active:scale-[0.97]
              disabled:opacity-30 disabled:cursor-not-allowed"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  );
}
