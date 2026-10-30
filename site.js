(() => {
  // ---------- inline popover cards ----------
  const cards = {
    krastor:  { co: 'Krastor Inc.', date: 'Jan 2026 – now', role: 'Software Engineer', desc: 'Sole engineer. AI agents and apps for small businesses.', url: '', c: '#4A5BD9' },
    mccarren: { co: 'McCarren Capital', date: 'Apr 2025 – Jan 2026', role: 'Software Engineer', desc: 'Boutique advisory for private equity. I built backend, CRM integrations and email automation.', url: '', c: '#3E6A92' },
    swift:    { co: 'Swift Flight LLC', date: '2022 – 2025', role: 'Founder', desc: 'Scaled an Amazon FBA business to $1.1M+ in revenue. Built Python tools that tracked competitor storefronts and flagged new listings.', url: '', c: '#262523' },
    mosaic:   { co: 'Mosaic', date: 'In progress', role: 'AI creative strategist', desc: 'Breaks down every Meta ad scene by scene, ranks what works and writes reports that cite their ads.', url: 'mosaic.html', c: '#7A5AF8' }
  };
  const pop = document.getElementById('pop');
  const $ = id => document.getElementById(id);
  let openFor = null;
  const close = () => { pop.hidden = true; openFor = null; };
  document.querySelectorAll('.ref').forEach(b => b.addEventListener('click', e => {
    e.stopPropagation();
    if (openFor === b) return close();
    const d = cards[b.dataset.card];
    $('popCo').textContent = d.co; $('popDate').textContent = d.date; $('popRole').textContent = d.role; $('popDesc').textContent = d.desc;
    $('popLink').href = d.url || '#'; $('popLink').hidden = !d.url; $('popLogo').style.background = d.c;
    pop.hidden = false;
    const r = b.getBoundingClientRect();
    pop.style.left = Math.max(16, Math.min(r.left, innerWidth - pop.offsetWidth - 16)) + 'px';
    pop.style.top = (r.top + scrollY - pop.offsetHeight - 10) + 'px';
    openFor = b;
  }));
  document.addEventListener('click', e => { if (!pop.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  // ---------- copy email ----------
  $('copy').addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText('carson@creation.sh').catch(() => {});
    $('copied').classList.add('show'); setTimeout(() => $('copied').classList.remove('show'), 1400);
  });

  // ---------- local time ----------
  const tick = () => {
    const t = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Chicago', hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
    $('clock').textContent = `${t} in oxford, mississippi`;
  };
  tick(); setInterval(tick, 20000);

  // ---------- scrollspy + dim the pond under the content ----------
  const links = [...document.querySelectorAll('.nav a[data-s]')];
  const secs = links.map(a => document.getElementById(a.dataset.s));
  const canvas = $('pond');
  function onScroll() {
    let cur = 0;
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * 0.4) cur = i; });
    if (innerHeight + scrollY >= document.body.scrollHeight - 4) cur = secs.length - 1;
    links.forEach((a, i) => a.classList.toggle('on', i === cur));
    canvas.style.opacity = Math.max(0.28, 1 - scrollY / (innerHeight * 0.9));
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
