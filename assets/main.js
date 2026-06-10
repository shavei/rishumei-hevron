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

/* ── Localized strings for JS-composed messages (mailto / WhatsApp / toast) ──
   Follows the page language (set via <html lang>), so contact links match. */
const LANG = (document.documentElement.lang || 'he').slice(0,2);
const STR = (function(){
  const D = {
    he: {
      locale: 'he-IL',
      subjectDefault: 'פנייה מהאתר',
      fillAll: 'אנא מלאו את כל השדות הנדרשים',
      badEmail: 'כתובת המייל אינה תקינה',
      waGeneric: 'שלום, אשמח לשמוע עוד על בשבילנו',
      contactWA: (n,s,m) => `שלום, אני ${n}. ${s ? 'נושא: '+s+'. ' : ''}${m}`,
      mailBody: (n,e,m) => `שם: ${n}\nמייל: ${e}\n\n${m}`,
      donateSubject: 'תרומה לבשבילנו',
      donateAmount: a => 'בסך ₪' + a,
      donateAmountTBD: '(סכום שנבחר בהמשך)',
      donateMsg: (amt,freq,label) => `שלום, אני רוצה לתרום לבשבילנו ${amt} — תרומה ${freq}${label ? ' (' + label + ')' : ''}. אשמח לקבל פרטים והנחיות.`
    },
    en: {
      locale: 'en-US',
      subjectDefault: 'Inquiry from the website',
      fillAll: 'Please fill in all required fields',
      badEmail: 'The email address is invalid',
      waGeneric: "Hello, I'd love to hear more about Bishvileinu",
      contactWA: (n,s,m) => `Hello, I'm ${n}. ${s ? 'Subject: '+s+'. ' : ''}${m}`,
      mailBody: (n,e,m) => `Name: ${n}\nEmail: ${e}\n\n${m}`,
      donateSubject: 'Donation to Bishvileinu',
      donateAmount: a => '₪' + a,
      donateAmountTBD: '(amount to be chosen)',
      donateMsg: (amt,freq,label) => `Hello, I would like to donate ${amt} to Bishvileinu — a ${freq} donation${label ? ' (' + label + ')' : ''}. I'd be glad to receive details and instructions.`
    },
    fr: {
      locale: 'fr-FR',
      subjectDefault: 'Demande depuis le site',
      fillAll: 'Veuillez remplir tous les champs requis',
      badEmail: "L'adresse e-mail n'est pas valide",
      waGeneric: "Bonjour, je serais ravi(e) d'en savoir plus sur Bishvileinu",
      contactWA: (n,s,m) => `Bonjour, je suis ${n}. ${s ? 'Objet : '+s+'. ' : ''}${m}`,
      mailBody: (n,e,m) => `Nom : ${n}\nE-mail : ${e}\n\n${m}`,
      donateSubject: 'Don à Bishvileinu',
      donateAmount: a => a + ' ₪',
      donateAmountTBD: '(montant à définir)',
      donateMsg: (amt,freq,label) => `Bonjour, je souhaite faire un don de ${amt} à Bishvileinu — un don ${freq}${label ? ' (' + label + ')' : ''}. Je serais ravi(e) de recevoir des informations et des instructions.`
    },
    es: {
      locale: 'es-ES',
      subjectDefault: 'Consulta desde el sitio web',
      fillAll: 'Por favor, completa todos los campos obligatorios',
      badEmail: 'La dirección de correo no es válida',
      waGeneric: 'Hola, me encantaría saber más sobre Bishvileinu',
      contactWA: (n,s,m) => `Hola, soy ${n}. ${s ? 'Asunto: '+s+'. ' : ''}${m}`,
      mailBody: (n,e,m) => `Nombre: ${n}\nCorreo: ${e}\n\n${m}`,
      donateSubject: 'Donación a Bishvileinu',
      donateAmount: a => '₪' + a,
      donateAmountTBD: '(importe a definir)',
      donateMsg: (amt,freq,label) => `Hola, quiero donar ${amt} a Bishvileinu — una donación ${freq}${label ? ' (' + label + ')' : ''}. Me gustaría recibir detalles e instrucciones.`
    }
  };
  return D[LANG] || D.he;
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

/* ── Language switcher ──
   Hrefs are computed at build time (per page, per language) — see build.py.
   JS only handles: active marker, remembering the choice, open/close, and a
   narrow "return to my language" redirect on the default home. */
(function(){
  const langs = ['he','en','fr','es'];
  const onHome = location.pathname === '/' || location.pathname === '/index' || location.pathname === '/index.html';

  document.querySelectorAll('[data-lang]').forEach(a => {
    const lang = a.dataset.lang;
    a.classList.toggle('active', lang === LANG);
    if (lang === LANG) a.setAttribute('aria-current', 'true');
    a.addEventListener('click', () => { try { localStorage.setItem('lang', lang); } catch(e){} });
  });

  // Dropdown open/close.
  const sw  = document.getElementById('langSwitch');
  const btn = document.getElementById('langBtn');
  if (sw && btn){
    const close = () => { sw.classList.remove('open'); btn.setAttribute('aria-expanded','false'); };
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const open = !sw.classList.contains('open');
      sw.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', e => { if (!sw.contains(e.target)) close(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // Remember preference: on the Hebrew home only, send returning visitors to
  // their chosen language home (kept narrow to avoid surprises / SEO issues).
  try {
    const saved = localStorage.getItem('lang');
    if (saved && saved !== LANG && LANG === 'he' && onHome && langs.includes(saved) && saved !== 'he') {
      location.replace('/' + saved + '/');
    }
  } catch(e){}
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
    const loc = document.documentElement.lang || 'he-IL';
    if (REDUCED) { el.textContent = prefix + target.toLocaleString(loc) + suffix; return; }
    const dur = 1800, start = performance.now();
    function ease(t){ return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2; }
    function frame(now){
      const p = Math.min((now-start)/dur,1);
      el.textContent = prefix + Math.round(ease(p)*target).toLocaleString(loc) + suffix;
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
  const subjectField = document.getElementById('cf-subject');
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
      const text = encodeURIComponent(STR.contactWA(name, subject, msg));
      window.open(_c.wa + '?text=' + text, '_blank', 'noopener');
    });
  }

  if (sendBtn) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (form.querySelector('.hp')?.value) return;
      const name    = form.querySelector('#cf-name')?.value?.trim()    || '';
      const email   = form.querySelector('#cf-email')?.value?.trim()   || '';
      const subject = form.querySelector('#cf-subject')?.value?.trim() || STR.subjectDefault;
      const msg     = form.querySelector('#cf-msg')?.value?.trim()     || '';
      if (!name || !email || !msg) { showToast(STR.fillAll); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showToast(STR.badEmail); return; }
      const body = STR.mailBody(name, email, msg);
      location.href = `mailto:${_c.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    });
  }
})();

/* ── Audience quick-links mailto/WA on join page ── */
(function(){
  document.querySelectorAll('[data-contact="mail"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const subj = encodeURIComponent(btn.dataset.subject || STR.subjectDefault);
      location.href = `mailto:${_c.email}?subject=${subj}`;
    });
  });
  document.querySelectorAll('[data-contact="wa"]').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = encodeURIComponent(btn.dataset.text || STR.waGeneric);
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
  let amount = '180', label = '', freq = '';
  const out = document.getElementById('give-selected-text');
  function refresh(){
    out.textContent = (amount ? '₪' + (+amount).toLocaleString(STR.locale) + ' — ' : '') + label + ' · ' + freq;
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
    const amt = amount ? STR.donateAmount((+amount).toLocaleString(STR.locale)) : STR.donateAmountTBD;
    return STR.donateMsg(amt, freq, label);
  }
  document.getElementById('give-mail')?.addEventListener('click', () => {
    location.href = `mailto:${_c.email}?subject=${encodeURIComponent(STR.donateSubject)}&body=${encodeURIComponent(message())}`;
  });
  document.getElementById('give-wa')?.addEventListener('click', () => {
    window.open(_c.wa + '?text=' + encodeURIComponent(message()), '_blank', 'noopener');
  });
  // Seed the initial selection from the (localized) markup so the summary + message
  // read in the page language before any click.
  const defCard = grid.querySelector('[data-amount="180"]') || grid.querySelector('.give-card');
  if (defCard){ defCard.classList.add('active'); amount = defCard.dataset.amount || amount; label = defCard.dataset.label || label; }
  const defFreq = document.querySelector('.give-freq .chip-btn.active') || document.querySelector('.give-freq .chip-btn');
  if (defFreq){ defFreq.classList.add('active'); freq = defFreq.dataset.freq || freq; }
  refresh();
})();

/* ── Lenis smooth scroll (progressive, respects reduced-motion) ── */
(function(){
  if (REDUCED || typeof Lenis === 'undefined') return;
  const lenis = new Lenis({ duration: 1.05, smoothWheel: true, touchMultiplier: 1.6 });
  function raf(t){ lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
})();
