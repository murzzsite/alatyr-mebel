const LEAD_ENDPOINT = 'https://lead-relay.leestygpt.workers.dev/lead/YRAXFVXLL3';

(() => {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const A = window.ALT = window.ALT || { S: { p: 0 }, fin: '#c9a574' };
  A.S.p = reduce ? 1 : 0;

  $('#year') && ($('#year').textContent = new Date().getFullYear());

  /* шапка и меню */
  const header = $('#header'), burger = $('#burger'), nav = $('#nav');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  const setMenu = o => { burger.classList.toggle('is-open', o); nav.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', o); };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));

  /* ---------- чертёж кухни (SVG из кода) ---------- */
  const PAL_NEW = { wall: '#f4f5f1', body: '#e9e6dc', front: '#8a9b86', top: '#3d484e', handle: '#e29a14', stone: '#e29a14', floor: '#c9d1cf', plinth: '#1a2327' };
  const PAL_OLD = { wall: '#dedcd3', body: '#a8977c', front: '#b9a88e', top: '#8c7a5e', handle: '#6c6c68', stone: '#b9ae98', floor: '#bdb9ac', plinth: '#5a5044', old: true };
  const kitchen = (P, id) => {
    let i = 0, o = '';
    const r = (x, y, w, h, f, extra = '') => { o += `<rect class="d" pathLength="1" style="--i:${i++}" x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}" ${extra}/>`; };
    r(0, 0, 600, 362, P.wall); r(0, 362, 600, 38, P.floor);
    o += `<circle class="d" pathLength="1" style="--i:${i++}" cx="300" cy="96" r="46" fill="${P.stone}"/>`;
    [0, 1, 4, 5].forEach(k => {
      const x = 40 + k * 87;
      r(x, 40, 85, 112, P.body); r(x + 4, 44, 77, 104, P.front);
      r(x + (k < 2 ? 66 : 12), 128, 4, 16, P.handle, 'stroke="none"');
    });
    r(40, 214, 520, 136, P.body);
    for (let k = 0; k < 6; k++) {
      const x = 40 + k * 87;
      if (k === 2) {
        [0, 1, 2].forEach(j => { r(x + 4, 218 + j * 43, 77, 40, P.front); r(x + 32, 234 + j * 43, 21, 4, P.handle, 'stroke="none"'); });
      } else {
        r(x + 4, 218, 77, 128, P.front); r(x + (k % 2 ? 12 : 66), 224, 4, 30, P.handle, 'stroke="none"');
      }
    }
    r(34, 202, 532, 14, P.top); r(40, 350, 520, 12, P.plinth);
    let s = '';
    if (P.old) s = '<path class="scuff" d="M62 60l14 22-6 20M388 70l-12 30 9 18M120 250l30 14M470 300l-18 22 12 10M250 232l26 8M330 160l-14 -8"/><circle cx="470" cy="270" r="10" fill="#6b5a40" opacity=".25"/><circle cx="150" cy="90" r="14" fill="#6b5a40" opacity=".18"/>';
    return `<svg class="k" viewBox="0 0 600 400" role="img" aria-label="Кухня">${o}${s}</svg>`;
  };
  const hero = $('#heroArt');
  hero.innerHTML = kitchen(PAL_NEW);
  $('#baOld').innerHTML = kitchen(PAL_OLD);
  $('#baNew').innerHTML = kitchen(PAL_NEW);
  const hk = $('svg', hero);
  if (!reduce) {
    hk.classList.add('k-pre');
    requestAnimationFrame(() => requestAnimationFrame(() => { hk.classList.remove('k-pre'); hk.classList.add('k-go'); }));
  }

  /* ---------- было / стало ---------- */
  const ba = $('#ba'), range = $('#baRange');
  const setX = v => ba.style.setProperty('--x', v + '%');
  range.addEventListener('input', () => setX(range.value));
  setX(range.value);

  /* ---------- цвет фасадов в 3D ---------- */
  const chips = $$('.chip');
  chips.forEach(c => c.addEventListener('click', () => {
    chips.forEach(x => { x.classList.toggle('is-on', x === c); x.setAttribute('aria-checked', x === c); });
    A.fin = c.dataset.c; A.dirty = true;
  }));

  /* ---------- предвыбор типа мебели из услуг ---------- */
  $$('[data-kind]').forEach(a => a.addEventListener('click', () => {
    const sel = $('#kind'); const v = a.dataset.kind;
    [...sel.options].forEach(op => { if (op.text === v) sel.value = op.value; });
  }));

  /* ---------- форма → Worker → Telegram ---------- */
  const form = $('#leadForm'), note = $('#formNote');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const label = btn.querySelector('span') || btn, orig = label.textContent;
    const payload = {};
    new FormData(form).forEach((v, k) => { payload[k] = v; });
    if (payload._gotcha) return;
    if (!payload.name || !payload.phone) { note.textContent = 'Заполните имя и Telegram или телефон'; return; }
    if (!form.consent.checked) { note.textContent = 'Нужно согласие на обработку данных'; return; }
    delete payload.consent;
    btn.disabled = true; label.textContent = 'Отправляем…'; note.textContent = '';
    try {
      const resp = await fetch(LEAD_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      label.textContent = 'Заявка отправлена';
      note.textContent = 'Спасибо! Свяжемся с вами и уточним детали.';
      form.reset();
    } catch (err) {
      console.error(err);
      label.textContent = 'Ошибка, попробуйте ещё раз';
      note.textContent = 'Не удалось отправить. Напишите нам в Telegram: t.me/mebelAlatyr';
    } finally {
      setTimeout(() => { label.textContent = orig; btn.disabled = false; }, 3500);
    }
  });

  /* ================= анимации ================= */
  if (reduce || !window.gsap || !window.ScrollTrigger) { document.documentElement.classList.add('no-anim'); return; }
  gsap.registerPlugin(ScrollTrigger);

  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: .09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault();
    const y = t.getBoundingClientRect().top + scrollY - 64;
    lenis ? lenis.scrollTo(y, { duration: 1.4 }) : scrollTo({ top: y, behavior: 'smooth' });
  }));

  /* вход hero */
  const letters = $$('.hero__title .mk-w');
  if (letters.length) gsap.from(letters, { yPercent: 70, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: { each: .016 }, delay: .1 });
  gsap.from('.hero__lead, .hero__actions, .hero__price, .header__inner > *', { opacity: 0, y: 22, duration: 1, ease: 'power3.out', stagger: .08, delay: .5 });
  gsap.from('.hero__art', { xPercent: 8, opacity: 0, duration: 1.4, ease: 'expo.out', delay: .2 });

  /* заголовки в масках */
  $$('h2.mask').forEach(h => {
    const t = h.textContent; h.setAttribute('aria-label', t);
    h.innerHTML = `<span class="ln" aria-hidden="true"><i>${t}</i></span>`;
    gsap.from(h.querySelector('i'), { yPercent: 112, duration: 1.1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } });
  });

  /* манифест по словам */
  const mf = $('#manifest'), words = mf.textContent.trim().split(/\s+/);
  mf.setAttribute('aria-label', mf.textContent.trim());
  mf.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
  gsap.to('#manifest .w', { opacity: 1, ease: 'none', stagger: .12, scrollTrigger: { trigger: mf, start: 'top 82%', end: 'bottom 55%', scrub: true } });
  gsap.from('.story__stone', { scale: .6, opacity: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '.story__stone', start: 'top 85%' } });

  /* закреплённая 3D-сцена */
  const caps = $$('.cap'), STEPS = [.2, .46, .74];
  let now = -1;
  const paint = p => {
    const s = p < STEPS[0] ? 0 : p < STEPS[1] ? 1 : p < STEPS[2] ? 2 : 3;
    if (s !== now) { now = s; caps.forEach((c, i) => c.classList.toggle('is-on', i === s)); }
  };
  paint(0);
  ScrollTrigger.create({
    trigger: '#scenePin', start: 'top top', end: () => '+=' + Math.round(innerHeight * (innerWidth < 900 ? 3 : 3.6)),
    pin: true, anticipatePin: 1, scrub: true, invalidateOnRefresh: true,
    onUpdate: self => { A.S.p = self.progress; paint(self.progress); }
  });

  /* бегущая строка */
  const mq = $('#marq'); let mx = 0;
  gsap.ticker.add(() => {
    mx -= .8 + Math.abs(lenis ? lenis.velocity : 0) * .4;
    const half = mq.scrollWidth / 2; if (-mx >= half) mx += half;
    mq.style.transform = `translate3d(${mx}px,0,0)`;
  });

  /* строки услуг, шаги, FAQ, форма */
  const rv = sel => {
    const els = $$(sel); if (!els.length) return;
    gsap.set(els, { opacity: 0, y: 28 });
    ScrollTrigger.batch(els, { start: 'top 90%', once: true, onEnter: b => gsap.to(b, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', stagger: .09, overwrite: true }) });
  };
  rv('.rows li'); rv('.steps li'); rv('.faq details'); rv('.form'); rv('.tg'); rv('.facts li'); rv('.budget__col p');
  gsap.from('.budget h2', { yPercent: 30, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.budget', start: 'top 80%' } });

  /* ползунок «было/стало» подсказывает себя */
  const hint = { v: 90 };
  ScrollTrigger.create({ trigger: '#ba', start: 'top 75%', once: true, onEnter: () => {
    gsap.fromTo(hint, { v: 92 }, { v: 52, duration: 1.8, ease: 'power3.inOut', onUpdate: () => { range.value = hint.v; setX(hint.v); } });
  } });

  gsap.from('.footer__name', { yPercent: 40, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 88%' } });
  addEventListener('load', () => ScrollTrigger.refresh());
  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
