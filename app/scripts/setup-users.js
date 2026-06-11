/**
 * 🐟🐸 创建用户账号
 * ==================
 * 运行后生成两个用户的密码哈希，你需要复制结果到 Supabase Table Editor
 *
 * 用法：node scripts/setup-users.js
 *
 * 依次提示输入：
 *   小鱼（fish）的密码
 *   蛙蛙（frog）的密码
 */

import { createHash } from 'crypto';
import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(q) {
  return new Promise((r) => rl.question(q, r));
}

function hash(password) {
  return createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('🐟🐸 创建用户账号\n');

  const pw1 = await ask('设置 小鱼(fish) 的密码: ');
  const pw2 = await ask('设置 蛙蛙(frog) 的密码: ');

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('请到 Supabase Table Editor → users 表，插入以下数据：\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('第 1 条：');
  console.log(JSON.stringify({
    username: 'fish',
    display_name: '小鱼',
    password_hash: hash(pw1),
  }, null, 2));

  console.log('\n第 2 条：');
  console.log(JSON.stringify({
    username: 'frog',
    display_name: '蛙蛙',
    password_hash: hash(pw2),
  }, null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ 复制上面的 JSON 到 Supabase Table Editor 插入即可');
  console.log('⚠️  完成后立即关闭本窗口，密码不会保存');

  rl.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
