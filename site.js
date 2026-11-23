(() => {
  // ---------- inline popover cards ----------
  const cards = {
    krastor:  { co: 'Krastor Inc.', date: 'Jan 2026 – now', role: 'Software Engineer', desc: 'Sole engineer. AI agents and apps for small businesses.', page: '/#clients', site: 'https://krastor.com', c: '#4A5BD9' },
    mccarren: { co: 'McCarren Capital', date: 'Apr 2025 – Jan 2026', role: 'Software Engineer', desc: 'Boutique advisory for private equity. I built backend, CRM integrations and email automation.', page: '/mccarren', site: 'https://mccarrencapital.com', c: '#3E6A92' },
    swift:    { co: 'Swift Flight LLC', date: '2022 – 2025', role: 'Founder', desc: 'Founded an Amazon business, from online arbitrage to distribution with health and wellness brands; $700K+ in revenue. Built Python tools that flagged new competitor listings.', page: '/swift-flight', site: '', c: '#262523' },
    sway:     { co: 'Sway', date: 'Sep 2026 – now', role: 'Growth platform for iOS apps', desc: 'Shows iOS subscription apps which posts and ads bring in paying subscribers, and what to post, scale and cut next.', page: '/sway', site: 'https://swaygrowth.com', c: '#1A1AF0' },
    manta:    { co: 'Manta', date: 'Oct 2026 – now', role: 'Prediction-market terminal', desc: 'Records Kalshi and Polymarket around the clock: a screener of 5,000+ contracts, live order books and independent fair values.', page: '/manta', site: 'https://mantamarkets.com', c: '#1F7A8C' },
    rapha:    { co: 'Rapha', date: 'Sep 2025 – now', role: 'Personalized devotional app for iOS', desc: 'Live on the App Store. Claude writes each user a personal devotional plan that adapts every month.', page: '/rapha', site: 'https://getrapha.co', c: '#8A5A2B' }
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
    $('popBody').href = d.page; $('popLogo').style.background = d.c;
    if (d.site) $('popCo').href = d.site; else $('popCo').removeAttribute('href');
    pop.hidden = false;
    const r = b.getBoundingClientRect();
    pop.style.left = Math.max(16, Math.min(r.left, innerWidth - pop.offsetWidth - 16)) + 'px';
    pop.style.top = (r.top + scrollY - pop.offsetHeight - 10) + 'px';
    openFor = b;
  }));
  document.addEventListener('click', e => { if (!pop.contains(e.target)) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  $('popBody').addEventListener('click', close);

  // ---------- copy email ----------
  $('copy').addEventListener('click', () => {
    navigator.clipboard && navigator.clipboard.writeText('carsonturnersf@gmail.com').catch(() => {});
    $('copied').classList.add('show'); setTimeout(() => $('copied').classList.remove('show'), 1400);
  });

  // ---------- local time ----------
  const tick = () => {
    const t = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }).replace(' ', '').toLowerCase();
    $('clock').textContent = `${t} in new york, ny`;
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
