/**
 * 浏览器端 SHA-256 哈希
 * 用于密码验证（兼容不支持 textEncoder 的老浏览器）
 */

export async function createHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
