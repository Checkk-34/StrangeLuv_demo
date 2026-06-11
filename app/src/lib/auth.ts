import { createHash } from './crypto';
import { getSupabase } from './supabase';

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

/** 获取所有活动 */
export async function fetchActivities(): Promise<Activity[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('activities')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

/** 添加活动 */
export async function addActivity(userId: string, text: string, source: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.from('activities').insert({ user_id: userId, text, source });
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
  picks: string[];
}

/** 获取某天的问卷结果 */
export async function fetchQuiz(date: string): Promise<QuizEntry[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data } = await sb
    .from('quiz_results')
    .select('*')
    .eq('date', date);
  return (data || []).map((r: any) => ({ date: r.date, user_id: r.user_id, picks: r.picks }));
}

/** 提交问卷 */
export async function submitQuiz(date: string, userId: string, picks: string[]): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  // upsert: 同一天同一个人只能提交一次
  await sb.from('quiz_results').upsert(
    { date, user_id: userId, picks },
    { onConflict: 'date,user_id' },
  );
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
