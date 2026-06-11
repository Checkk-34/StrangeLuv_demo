import { useState } from 'react';
import { login, type User } from '../lib/auth';
import { FishIcon, FrogIcon } from './Icons';

interface Props {
  onLogin: (user: User) => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      const user = await login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError('用户名或密码不正确');
      }
    } catch {
      setError('登录失败，请检查网络连接');
    }
    setLoading(false);
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center px-6 select-none">
      {/* 顶部装饰 */}
      <div className="flex items-center gap-4 mb-8">
        <span className="text-3xl md:text-4xl">🐟</span>
        <span className="text-heart-rose text-xl md:text-2xl">❤</span>
        <span className="text-3xl md:text-4xl">🐸</span>
      </div>

      {/* 标题 */}
      <h1 className="font-zh text-2xl md:text-3xl font-bold text-text-primary text-center leading-snug mb-2">
        池塘奇遇
      </h1>
      <p className="font-zh text-sm text-text-secondary/60 text-center mb-10">
        周末约定 · 属于你们的秘密基地
      </p>

      {/* 登录卡片 */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-[2rem] bg-card-glass-deep backdrop-blur-xl
          border border-white/20
          shadow-[0_8px_40px_var(--color-shadow-xl),inset_0_1px_0_rgba(255,255,255,0.5)]
          px-7 py-8 md:px-8 md:py-9"
      >
        {/* 角色选择 */}
        <div className="flex gap-3 mb-6">
          {[
            { key: 'fish', label: '小鱼', icon: <FishIcon size={28} />, color: 'text-fish-teal' },
            { key: 'frog', label: '蛙蛙', icon: <FrogIcon size={28} />, color: 'text-frog-emerald' },
          ].map((role) => (
            <button
              key={role.key}
              type="button"
              onClick={() => setUsername(role.key)}
              className={`
                flex-1 flex flex-col items-center gap-2 py-4 rounded-xl
                font-zh text-sm font-medium transition-all duration-300
                ${username === role.key
                  ? `bg-gradient-to-br ${role.key === 'fish' ? 'from-fish-teal/20 to-fish-teal/5 text-fish-teal border-fish-teal/40' : 'from-frog-emerald/20 to-frog-emerald/5 text-frog-emerald border-frog-emerald/40'} shadow-sm border`
                  : 'bg-white/30 text-text-tertiary/60 border border-white/10 hover:bg-white/50'
                }
              `}
            >
              <span className={username === role.key ? role.color : 'opacity-40'}>
                {role.icon}
              </span>
              <span>{role.label}</span>
            </button>
          ))}
        </div>

        {/* 密码 */}
        <div className="mb-6">
          <label className="block font-zh text-xs text-text-tertiary/60 mb-2 tracking-[0.06em]">
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="输入密码..."
            className="w-full bg-white/40 rounded-xl px-4 py-3 text-sm font-zh text-text-primary
              placeholder:text-text-tertiary/30 outline-none border border-white/20
              focus:border-fish-teal/40 focus:bg-white/60 transition-all"
            autoFocus
          />
        </div>

        {/* 错误 */}
        {error && (
          <p className="font-zh text-xs text-heart-rose/80 text-center mb-4">{error}</p>
        )}

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={!username || !password || loading}
          className="w-full py-3.5 rounded-xl font-zh text-sm font-medium text-white
            bg-gradient-to-r from-fish-teal to-fish-teal-dark
            hover:shadow-lg hover:-translate-y-0.5
            active:scale-[0.97] transition-all duration-300
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {loading ? '登录中...' : '进入池塘 →'}
        </button>
      </form>

      {/* 底部 */}
      <p className="mt-8 font-en text-[11px] tracking-[0.12em] text-text-tertiary/30">
        🐟 &amp; 🐸 · 2025
      </p>
    </div>
  );
}
