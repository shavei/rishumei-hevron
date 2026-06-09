/* ================================================================
   בשבילנו — main.js
   nav · drawer · scroll-progress · reveal · counters · kinetic
   tilt · parallax-fallback · FAQ · form (mailto/WA) · back-to-top
   ================================================================ */

const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH   = matchMedia('(hover: none)').matches;

/* ── Contact refs (not exposed in markup) ── */
const _c = (function(){
  const a = ['n','e','r','y','a','@','b','e','t','a','r','.','o','r','g','.','i','l'].join('');
  const w = '972506000695';
  return { email: a, wa: 'https://wa.me/' + w };
})();

/* ── Scroll Progress (JS fallback only) ── */
(function(){
  const bar = document.querySelector('.scroll-progress');
  if (!bar) return;
  if (CSS.supports('animation-timeline','scroll()')) return;
  function upd(){
    const s = document.documentElement;
    bar.style.transform = 'scaleX('+(s.scrollTop/(s.scrollHeight-s.clientHeight)||0)+')';
  }
  addEventListener('scroll', upd, {passive:true});
})();

/* ── Nav: sticky glass + active page ── */
(function(){
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const page = location.pathname.replace(/\/$/, '').split('/').pop() || 'index.html';
  nav.querySelectorAll('.nav-links a, .nav-drawer a').forEach(a => {
    const href = a.getAttribute('href') || '';
    const target = href.replace(/\.html$/, '').replace(/^\//, '') || 'index';
    const current = page.replace(/\.html$/, '') || 'index';
    if (target === current || (target === '' && current === 'index')) a.classList.add('active');
  });
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, {passive:true});
  onScroll();
})();

/* ── Mobile Drawer ── */
(function(){
  const burger = document.querySelector('.nav-burger');
  const drawer = document.querySelector('.nav-drawer');
  if (!burger || !drawer) return;
  function toggle(open){
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => toggle(!drawer.classList.contains('open')));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggle(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') toggle(false); });
})();

/* ── Scroll Reveal (IO fallback) ── */
(function(){
  if (CSS.supports('animation-timeline','view()')) return;
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, {threshold: .12});
  els.forEach(el => io.observe(el));
})();

/* ── Kinetic text split (word spans + stagger) ── */
(function(){
  const els = document.querySelectorAll('.kinetic');
  if (!els.length) return;
  els.forEach(el => {
    const html = el.innerHTML;
    const parts = html.split(/(<[^>]+>|\s+)/);
    let i = 0;
    el.innerHTML = parts.map(p => {
      if (/^</.test(p)) return p;
      if (/^\s+$/.test(p)) return p;
      const delay = REDUCED ? 0 : (i++ * 48);
      return `<span class="word" style="--i:${i};transition-delay:${delay}ms;animation-delay:${delay}ms">${p}</span>`;
    }).join('');
  });
  if (CSS.supports('animation-timeline','view()')) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.word').forEach((w,i) => {
          if (REDUCED) { w.classList.add('in'); return; }
          setTimeout(() => w.classList.add('in'), i * 48);
        });
        io.unobserve(e.target);
      }
    });
  }, {threshold: .1});
  els.forEach(el => io.observe(el));
})();

/* ── Count-up ── */
(function(){
  const els = document.querySelectorAll('.count');
  if (!els.length) return;
  function animateCount(el){
    const target = +el.dataset.target;
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    if (REDUCED) { el.textContent = prefix + target.toLocaleString('he-IL') + suffix; return; }
    const dur = 1800, start = performance.now();
    function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
    function frame(now){
      const p = Math.min((now-start)/dur,1);
      el.textContent = prefix + Math.round(ease(p)*target).toLocaleString('he-IL') + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { animateCount(e.target); io.unobserve(e.target); } });
  }, {threshold:.5});
  els.forEach(el => io.observe(el));
})();

/* ── 3D Tilt ── */
(function(){
  if (REDUCED || TOUCH) return;
  document.querySelectorAll('[data-tilt]').forEach(card => {
    let active = false;
    card.addEventListener('pointerenter', () => { active = true; card.style.willChange = 'transform'; });
    card.addEventListener('pointermove', e => {
      if (!active) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - .5;
      const y = (e.clientY - r.top)  / r.height - .5;
      card.style.transform = `perspective(800px) rotateX(${(-y*6).toFixed(2)}deg) rotateY(${(x*6).toFixed(2)}deg)`;
    });
    card.addEventListener('pointerleave', () => {
      active = false;
      card.style.transform = '';
      card.style.willChange = '';
    });
  });
})();

/* ── Parallax fallback (for browsers without scroll-driven CSS) ── */
(function(){
  if (CSS.supports('animation-timeline','view()') || REDUCED) return;
  const items = Array.from(document.querySelectorAll('.photoband img')).slice(0,6);
  if (!items.length) return;
  function update(){
    items.forEach(img => {
      const r = img.closest('.photoband').getBoundingClientRect();
      const vh = window.innerHeight;
      const pct = (r.top + r.height/2) / (vh + r.height);
      const shift = (pct - .5) * 12;
      img.style.transform = `scale(1.12) translateY(${shift}%)`;
    });
  }
  addEventListener('scroll', update, {passive:true});
  update();
})();

/* ── FAQ Accordion ── */
(function(){
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(o => {
        o.classList.remove('open');
        o.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) { item.classList.add('open'); btn.setAttribute('aria-expanded', 'true'); }
    });
  });
})();

/* ── Back to top ── */
(function(){
  const btn = document.querySelector('.to-top');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({top:0, behavior: REDUCED ? 'auto' : 'smooth'}));
  addEventListener('scroll', () => btn.classList.toggle('show', scrollY > 600), {passive:true});
})();

/* ── Toast ── */
function showToast(msg){
  let t = document.querySelector('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* ── Quick-route chips (contact page) ── */
(function(){
  const chips = document.querySelectorAll('.chip-btn[data-subject]');
  const subjectField = document.getElementById('contact-subject');
  if (!chips.length || !subjectField) return;
  chips.forEach(c => {
    c.addEventListener('click', () => {
      chips.forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      subjectField.value = c.dataset.subject;
    });
  });
})();

/* ── Contact form → mailto composer ── */
(function(){
  const form = document.getElementById('contact-form');
  if (!form) return;
  const sendBtn = document.getElementById('contact-send');
  const waBtn   = document.getElementById('contact-wa');

  if (waBtn) {
    waBtn.addEventListener('click', () => {
      const name    = (form.querySelector('#cf-name')?.value    || '').trim();
      const subject = (form.querySelector('#cf-subject')?.value || '').trim();
      const msg     = (form.querySelector('#cf-msg')?.value     || '').trim();
      const text = encodeURIComponent(`שלום, אני ${name}. ${subject ? 'נושא: '+subject+'. ' : ''}${msg}`);
      window.open(_c.wa + '?text=' + text, '_blank', 'noopener');
    });
  }

  if (sendBtn) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.querySelector('.hp')?.value) return;
      const name    = form.querySelector('#cf-name')?.value?.trim()    || '';
      const email   = form.querySelector('#cf-email')?.value?.trim()   || '';
      const subject = form.querySelector('#cf-subject')?.value?.trim() || 'פנייה מהאתר';
      const msg     = form.querySelector('#cf-msg')?.value?.trim()     || '';
      if (!name || !email || !msg) { showToast('אנא מלאו את כל השדות הנדרשים'); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast('כתובת המייל אינה תקינה'); return; }
      const body = `שם: ${name}\nמייל: ${email}\n\n${msg}`;
      location.href = `mailto:${_c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();

/* ── Audience quick-links mailto/WA on join page ── */
(function(){
  document.querySelectorAll('[data-contact="mail"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subj = encodeURIComponent(btn.dataset.subject || 'פנייה מהאתר');
      location.href = `mailto:${_c.email}?subject=${subj}`;
    });
  });
  document.querySelectorAll('[data-contact="wa"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = encodeURIComponent(btn.dataset.text || 'שלום, אשמח לשמוע עוד על בשבילנו');
      window.open(_c.wa + '?text=' + text, '_blank', 'noopener');
    });
  });
})();

/* ── Footer year ── */
(function(){
  const el = document.querySelector('.footer-year');
  if (el) el.textContent = new Date().getFullYear();
})();

/* ── Donate: choose amount → mailto/WhatsApp ── */
(function(){
  const grid = document.querySelector('.give-grid');
  if (!grid) return;
  let amount = '180', label = 'מפגש זיכרון בקהילה', freq = 'חד-פעמית';
  const out = document.getElementById('give-selected-text');
  function refresh(){
    out.textContent = (amount ? '₪' + (+amount).toLocaleString('he-IL') + ' — ' : '') + label + ' · ' + freq;
  }
  grid.querySelectorAll('.give-card').forEach(c => {
    c.addEventListener('click', () => {
      grid.querySelectorAll('.give-card').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      amount = c.dataset.amount || ''; label = c.dataset.label || ''; refresh();
    });
  });
  document.querySelectorAll('.give-freq .chip-btn').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.give-freq .chip-btn').forEach(x => x.classList.remove('active'));
      b.classList.add('active'); freq = b.dataset.freq; refresh();
    });
  });
  function message(){
    const amt = amount ? ('בסך ₪' + (+amount).toLocaleString('he-IL')) : '(סכום שנבחר בהמשך)';
    return `שלום, אני רוצה לתרום לבשבילנו ${amt} — תרומה ${freq}${label ? ' (' + label + ')' : ''}. אשמח לקבל פרטים והנחיות.`;
  }
  document.getElementById('give-mail')?.addEventListener('click', () => {
    location.href = `mailto:${_c.email}?subject=${encodeURIComponent('תרומה לבשבילנו')}&body=${encodeURIComponent(message())}`;
  });
  document.getElementById('give-wa')?.addEventListener('click', () => {
    window.open(_c.wa + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
  });
  grid.querySelector('[data-amount="180"]')?.classList.add('active');
  refresh();
})();

/* ── Lenis smooth scroll (progressive, respects reduced-motion) ── */
(function(){
  if (REDUCED || typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
  function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
})();
