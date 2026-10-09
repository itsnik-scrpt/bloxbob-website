// Store checkout: players browse here, Tebex only takes the payment (Headless API + Tebex.js popup).
// Fill in the public token and the package IDs from the Tebex panel; until then the buttons say "Coming soon".
const STORE = {
  token: '14vvc-aba34c3a7f463153b096d3c84f16f9bd35408264', // public, safe in page code; Tebex panel > Integrations > API keys > Public token
  packages: { // Tebex package IDs (numbers)
    bronze: 7726019, gold: 7726022, platinum: 7726023, crown: 7726025,
    armory_1: 7726041, armory_5: 7726058, arsenal_1: 7726062, arsenal_5: 7726065,
  },
};

const API = 'https://headless.tebex.io/api';

// Ranks / Keys tabs (both show without JavaScript)
const tabs = document.querySelectorAll('[data-tab]');
function showTab(name) {
  if (![...tabs].some((t) => t.dataset.tab === name)) name = 'ranks';
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('[data-panel]').forEach((p) => { p.hidden = p.dataset.panel !== name; });
}
tabs.forEach((t) => t.addEventListener('click', (e) => {
  e.preventDefault();
  history.replaceState(null, '', '#' + t.dataset.tab);
  showTab(t.dataset.tab);
}));
showTab(location.hash.slice(1));

async function call(method, path, body) {
  const res = await fetch(API + path, {
    method,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.detail || json.message || `Checkout error (${res.status})`);
  return json.data ?? json;
}

async function checkout(username, packageId) {
  const page = location.href.split('#')[0];
  const basket = await call('POST', `/accounts/${STORE.token}/baskets`, {
    username,
    complete_url: page + '#thanks',
    cancel_url: page,
    complete_auto_redirect: true,
  });
  const filled = await call('POST', `/baskets/${basket.ident}/packages`, { package_id: packageId, quantity: 1 });
  if (window.Tebex?.checkout) {
    Tebex.checkout.init({ ident: basket.ident, theme: 'dark' });
    Tebex.checkout.on('payment:complete', () => { location.hash = 'thanks'; showThanks(); });
    Tebex.checkout.launch();
  } else {
    location.href = filled.links?.checkout || `https://pay.tebex.io/${basket.ident}`; // Tebex.js blocked: their hosted checkout page
  }
}

const dialog = document.createElement('dialog');
dialog.className = 'buy-dialog';
dialog.innerHTML = `
  <form method="dialog">
    <h3 data-title></h3>
    <p>Enter your Minecraft username. It's delivered to that account on every server, even if you haven't joined yet.</p>
    <input name="username" autocomplete="off" spellcheck="false" maxlength="16" placeholder="Username" required pattern="[A-Za-z0-9_]{3,16}">
    <div class="err" data-err></div>
    <div class="row"><button value="cancel" formnovalidate>Cancel</button><button class="go" value="go">Checkout</button></div>
  </form>`;
document.body.appendChild(dialog);
const form = dialog.querySelector('form');
const input = form.username;
let current = null;

try { input.value = localStorage.getItem('mc-username') || ''; } catch {}

form.addEventListener('submit', async (e) => {
  if (e.submitter?.value !== 'go') return;
  e.preventDefault();
  const name = input.value.trim();
  if (!/^[A-Za-z0-9_]{3,16}$/.test(name)) { dialog.querySelector('[data-err]').textContent = 'That isn’t a valid Minecraft username.'; return; }
  try { localStorage.setItem('mc-username', name); } catch {}
  const go = form.querySelector('.go');
  go.disabled = true; go.textContent = 'Opening…';
  dialog.querySelector('[data-err]').textContent = '';
  try {
    await checkout(name, current);
    dialog.close();
  } catch (err) {
    dialog.querySelector('[data-err]').textContent = err.message;
  } finally {
    go.disabled = false; go.textContent = 'Checkout';
  }
});

function showThanks() {
  const note = document.querySelector('.store-note');
  if (note && !document.querySelector('[data-thanks]')) {
    const t = document.createElement('p');
    t.className = 'store-note'; t.dataset.thanks = '';
    t.innerHTML = '<b>Thank you for supporting BloxBob!</b> Your purchase arrives in game within a minute.';
    note.before(t);
    t.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
if (location.hash === '#thanks') showThanks();

for (const btn of document.querySelectorAll('[data-package]')) {
  const id = STORE.packages[btn.dataset.package];
  if (!STORE.token || !id) continue;
  btn.disabled = false;
  btn.textContent = btn.dataset.package.includes('_') ? 'Buy' : 'Subscribe';
  btn.addEventListener('click', () => {
    current = id;
    dialog.querySelector('[data-title]').textContent = btn.closest('article').querySelector('h3').textContent;
    dialog.querySelector('[data-err]').textContent = '';
    dialog.showModal();
    input.focus();
  });
}
