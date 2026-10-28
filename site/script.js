(() => {
  const root = document.documentElement;
  root.classList.add('js');

  // Theme: respect system preference, remember an explicit choice.
  const themeBtn = document.querySelector('[data-theme-toggle]');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const readTheme = () => { try { return localStorage.getItem('lumen-theme'); } catch { return null; } };
  const applyTheme = (theme) => {
    root.dataset.theme = theme;
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };
  applyTheme(readTheme() || (media.matches ? 'dark' : 'light'));
  themeBtn.addEventListener('click', () => {
    const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('lumen-theme', next); } catch { /* storage unavailable */ }
  });

  // Mobile navigation: toggle, Escape to close, close on link click.
  const toggle = document.querySelector('[data-nav-toggle]');
  const menu = document.querySelector('[data-nav-menu]');
  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    toggle.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', () => setMenu(false));

  // Header border once the page scrolls (rAF-throttled).
  const header = document.querySelector('[data-header]');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { header.classList.toggle('is-scrolled', window.scrollY > 8); ticking = false; });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Active section in nav.
  const navLinks = [...document.querySelectorAll('.nav-links a')];
  const sections = navLinks.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((a) => {
        if (a.getAttribute('href') === `#${entry.target.id}`) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach((s) => navObserver.observe(s));

  // Scroll reveal with a short stagger per group; skipped under reduced motion (CSS shows final state).
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach((el) => el.classList.add('is-visible'));
  } else {
    reveals.forEach((el) => {
      el.style.setProperty('--i', [...el.parentElement.children].indexOf(el));
    });
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    reveals.forEach((el) => revealObserver.observe(el));
  }

  // Billing toggle.
  const billingBtns = document.querySelectorAll('[data-billing]');
  const price = document.querySelector('[data-price]');
  const perNote = document.querySelector('[data-per-note]');
  billingBtns.forEach((btn) => btn.addEventListener('click', () => {
    const period = btn.dataset.billing;
    billingBtns.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    price.textContent = `$${price.dataset[period]}`;
    perNote.textContent = period === 'yearly' ? ', billed yearly' : ', billed monthly';
  }));

  // Signup form: validate on blur and submit, specific errors, loading then success.
  const form = document.querySelector('[data-signup]');
  const input = form.querySelector('#email');
  const error = form.querySelector('#email-error');
  const errorText = form.querySelector('[data-error-text]');
  const submit = form.querySelector('[data-submit]');
  const success = form.querySelector('[data-success]');
  const validate = () => {
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'Enter your work email to get a sign-in link.';
    else if (!input.checkValidity()) message = 'That email looks incomplete — check it includes “@” and a domain, like you@company.com.';
    input.setAttribute('aria-invalid', String(Boolean(message)));
    error.hidden = !message;
    errorText.textContent = message;
    return !message;
  };
  input.addEventListener('blur', () => { if (input.value) validate(); });
  input.addEventListener('input', () => { if (input.getAttribute('aria-invalid') === 'true') validate(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (submit.disabled) return;
    if (!validate()) { input.focus(); return; }
    submit.disabled = true;
    submit.classList.add('is-loading');
    submit.querySelector('.btn-label').textContent = 'Sending…';
    // Demo only: simulate the request.
    setTimeout(() => {
      submit.classList.remove('is-loading');
      submit.querySelector('.btn-label').textContent = 'Link sent';
      success.hidden = false;
    }, 900);
  });
})();
