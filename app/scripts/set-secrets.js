/**
 * 🔑 设置 GitHub Actions Secrets
 * 用法：node scripts/set-secrets.js <GitHub_Token>
 */
const GITHUB_TOKEN = process.argv[2];
if (!GITHUB_TOKEN) { console.error('❌ 用法: node scripts/set-secrets.js <token>'); process.exit(1); }

const OWNER = 'Checkk-34';
const REPO = 'StrangeLuv_demo';
const API = `https://api.github.com/repos/${OWNER}/${REPO}/actions/secrets`;

const SECRETS = {
  VITE_TMDB_API_KEY: '8854d1bfab32f3ef6cce9faa9a3864bb',
  VITE_SUPABASE_URL: 'https://ivwdsderwrfgbkssmeff.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'sb_publishable_WLNzE1ZUSWHypkqvrCjpuQ_IYBAJ7oO',
};

async function main() {
  const sodium = await import('libsodium-wrappers');
  await sodium.ready;

  // 1. 获取仓库公钥
  console.log('🔑 获取仓库公钥...');
  const keyRes = await fetch(`${API}/public-key`, {
    headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!keyRes.ok) { console.error(`❌ 获取公钥失败: ${keyRes.status}`); process.exit(1); }
  const { key_id, key } = await keyRes.json();
  console.log(`   ✅ 公钥获取成功`);

  // 2. 逐个加密并设置 Secret
  for (const [name, value] of Object.entries(SECRETS)) {
    const binaryKey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    const encryptedBytes = sodium.crypto_box_seal(value, binaryKey);
    const encryptedValue = sodium.to_base64(encryptedBytes, sodium.base64_variants.ORIGINAL);

    console.log(`📝 设置 ${name}...`);
    const res = await fetch(`${API}/${name}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({ encrypted_value: encryptedValue, key_id }),
    });

    if (res.status === 204 || res.status === 201) {
      console.log(`   ✅ ${name} 设置成功`);
    } else {
      const err = await res.text();
      console.log(`   ❌ ${name} 失败: ${err.slice(0, 200)}`);
    }
  }

  console.log('\n🎉 全部完成！现在可以去 GitHub Actions 手动触发刷新');
}

main().catch(e => { console.error('❌ 脚本异常:', e); process.exit(1); });
