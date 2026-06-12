import { createHash } from './crypto';
import { getSupabase } from './supabase';

/** 今天日期字符串 YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 登录用户信息 */
export interface User {
  username: string;   // 'fish' | 'frog'
  displayName: string; // '小鱼' | '蛙蛙'
}

const SESSION_KEY = 'pond-current-user';

// =============================================
// 登录 / 登出 / 会话
// =============================================

/** 登录：验证用户名+密码，成功写入 localStorage */
export async function login(username: string, password: string): Promise<User | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const { data } = await sb
    .from('users')
    .select('username, display_name, password_hash')
    .eq('username', username)
    .single();

  if (!data) return null;

  const hash = await createHash(password);
  if (hash !== data.password_hash) return null;

  const user: User = { username: data.username, displayName: data.display_name };
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

/** 登出 */
export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

/** 获取当前登录用户（从 localStorage） */
export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// =============================================
// 数据同步层 — 活动清单
// =============================================

export interface Activity {
  id?: number;
  user_id: string;
  text: string;
  source: string;
  created_at?: string;
}

/** 获取所有活动（取最近 50 条） */
export async function fetchActivities(): Promise<Activity[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  return data || [];
}

/** 添加活动 */
export async function addActivity(userId: string, text: string, source: string): Promise<Activity | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.from('activities').insert({ user_id: userId, text, source }).select().single();
  return data;
}

/** 删除活动 */
export async function deleteActivity(id: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('activities').delete().eq('id', id);
}

// =============================================
// 数据同步层 — 默契问卷
// =============================================

export interface QuizEntry {
  date: string;
  user_id: string;
  round: number;
  picks: string[];
  done?: boolean;
}

/** 获取某天的问卷结果 */
export async function fetchQuiz(date: string): Promise<QuizEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('quiz_results')
    .select('*')
    .eq('date', date);
  return (data || []).map((r: any) => ({ date: r.date, user_id: r.user_id, round: r.round ?? 1, picks: r.picks, done: r.done ?? false }));
}

/** 提交问卷 */
export async function submitQuiz(date: string, userId: string, picks: string[], round: number = 1): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('quiz_results').upsert(
    { date, user_id: userId, round, picks, done: false },
    { onConflict: 'date,user_id,round' },
  );
}

/** 标记当前用户完成，若双方都完成则自动清理当天数据 */
export async function markQuizDone(date: string, userId: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  // 标记当前用户 done=true
  await sb.from('quiz_results').update({ done: true }).match({ date, user_id: userId });
  // 检查是否所有 entry 都已 done
  const { data } = await sb.from('quiz_results').select('done').eq('date', date);
  const allDone = data && data.length > 0 && data.every(r => r.done === true);
  if (allDone) {
    await sb.from('quiz_results').delete().eq('date', date);
    return true; // 已清理
  }
  return false;
}

/** 删除某天所有问卷数据（用于开新轮） */
export async function deleteQuiz(date: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('quiz_results').delete().eq('date', date);
}

/** 清理过期数据（前一天及更早的问卷、活动、留言） */
export async function cleanupExpiredData(): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const today = todayStr();

  // 计算本地时间的"今天零点"（避免 UTC 午夜偏移 bug）
  const now = new Date();
  const localStartOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const localMidnightUTC = localStartOfDay.toISOString();

  // 清理非当天的问卷（date 是 TEXT，比较字符串即可）
  await sb.from('quiz_results').delete().lt('date', today);
  // 清理非当天的活动
  await sb.from('activities').delete().lt('created_at', localMidnightUTC);
  // 清理非当天的留言
  await sb.from('messages').delete().lt('created_at', localMidnightUTC);
}

// =============================================
// 数据同步层 — 弹幕留言
// =============================================

export interface Message {
  id?: number;
  user_id: string;
  text: string;
  created_at?: string;
}

/** 获取所有留言 */
export async function fetchMessages(): Promise<Message[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true });
  return data || [];
}

/** 发送留言 */
export async function sendMessage(userId: string, text: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('messages').insert({ user_id: userId, text });
}
