const root = document.documentElement;
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } }
};
const saved = store.get('ps-docs-theme');
if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
function currentTheme() {
  return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
}
document.querySelector('.theme-btn')?.addEventListener('click', () => {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  store.set('ps-docs-theme', next);
});
const menu = document.querySelector('.menu-btn');
const sidebar = document.getElementById('sidebar');
menu?.addEventListener('click', () => {
  const open = sidebar?.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(Boolean(open)));
});
document.querySelectorAll('.copy').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const code = btn.parentElement?.querySelector('code')?.textContent ?? '';
    try { await navigator.clipboard.writeText(code); btn.textContent = 'Copied'; }
    catch { btn.textContent = 'Select the code'; }
    setTimeout(() => { btn.textContent = 'Copy'; }, 1600);
  });
});
const links = [...document.querySelectorAll('.toc a')];
if (links.length && 'IntersectionObserver' in window) {
  const map = new Map(links.map((a) => [a.getAttribute('href')?.slice(1), a]));
  const io = new IntersectionObserver((entries) => {
    const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    links.forEach((l) => l.classList.remove('on'));
    map.get(visible.target.id)?.classList.add('on');
  }, { rootMargin: '-80px 0px -65% 0px', threshold: [0.1, 0.5] });
  map.forEach((_a, id) => { const el = id ? document.getElementById(id) : null; if (el) io.observe(el); });
}
const index = Array.isArray(window.__DOCS_INDEX__) ? window.__DOCS_INDEX__ : [];
const q = document.getElementById('q');
const results = document.getElementById('results');
let active = -1;
function hideResults() { if (!results) return; results.hidden = true; results.replaceChildren(); active = -1; }
function showResults(items) {
  if (!results) return;
  results.replaceChildren();
  active = -1;
  if (!items.length) { results.hidden = true; return; }
  for (const item of items) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = item.u;
    a.setAttribute('role', 'option');
    a.textContent = item.t;
    li.append(a);
    results.append(li);
  }
  results.hidden = false;
}
q?.addEventListener('input', () => {
  const term = q.value.trim().toLowerCase();
  if (term.length < 2) { hideResults(); return; }
  showResults(index.filter((item) => `${item.t} ${item.x}`.toLowerCase().includes(term)).slice(0, 8));
});
q?.addEventListener('keydown', (event) => {
  const opts = [...(results?.querySelectorAll('a') ?? [])];
  if (event.key === 'Escape') { hideResults(); return; }
  if (!opts.length) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    active = event.key === 'ArrowDown' ? Math.min(active + 1, opts.length - 1) : Math.max(active - 1, 0);
    opts.forEach((a, i) => a.setAttribute('aria-selected', String(i === active)));
    opts[active]?.scrollIntoView({ block: 'nearest' });
  }
  if (event.key === 'Enter' && active >= 0) { event.preventDefault(); opts[active].click(); }
});
document.addEventListener('click', (event) => { if (!event.target.closest('.search')) hideResults(); });
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && document.activeElement !== q && !event.metaKey && !event.ctrlKey && !event.altKey) {
    event.preventDefault();
    q?.focus();
  }
});
