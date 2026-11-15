/* Shahajada Hasib — portfolio interactions. No dependencies. */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ *
   * Contact form settings. Messages are delivered by FormSubmit
   * (https://formsubmit.co) to the address below. To change where mail
   * goes, edit CONTACT_EMAIL here and the form "action" in index.html.
   * ------------------------------------------------------------------ */
  var CONTACT_EMAIL = 'shajadahasib@gmail.com';
  var CONTACT_ENDPOINT = 'https://formsubmit.co/ajax/' + CONTACT_EMAIL;
  var MIN_FILL_MS = 3000;        // people take longer than this; bots usually don't
  var COOLDOWN_MS = 60 * 1000;   // one message per minute per browser
  var REQUEST_TIMEOUT_MS = 15000;

  var root = document.documentElement;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ---------- Theme toggle ---------- */
  var themeBtn = $('#theme-toggle');
  function currentTheme() {
    return root.dataset.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) { /* private mode */ }
    });
  }

  /* ---------- Header: scrolled state + mobile menu ---------- */
  var header = $('.site-header');
  var nav = $('#site-nav');
  var navToggle = $('#nav-toggle');

  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', function () {
    setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      navToggle.focus();
    }
  });
  document.addEventListener('click', function (e) {
    if (!header.contains(e.target)) setMenu(false);
  });

  /* ---------- Highlight the section currently in view ---------- */
  var navLinks = $$('.site-nav a');
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  function markCurrent() {
    var probe = window.scrollY + window.innerHeight * 0.35;
    var current = sections[0];
    sections.forEach(function (s) { if (s.offsetTop <= probe) current = s; });
    // At the very bottom the last section may be too short to reach the probe line.
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) {
      current = sections[sections.length - 1];
    }
    navLinks.forEach(function (a) {
      if (a.getAttribute('href') === '#' + current.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { markCurrent(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', markCurrent);
  markCurrent();

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$('.reveal');
  function show(el) {
    el.classList.add('is-visible');
    setTimeout(function () { el.classList.add('is-done'); }, 1400);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        show(entry.target);
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(show);
  }

  /* ---------- Case study screenshot switcher ---------- */
  var shotImg = $('#shot-img');
  var shotUrl = $('#shot-url');
  var shotTabs = $$('.shot-tab');
  shotTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      if (tab.getAttribute('aria-pressed') === 'true') return;
      shotTabs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === tab)); });
      var name = tab.dataset.shot;
      var next = new Image();
      var base = 'assets/img/mbk-' + name;
      shotImg.classList.add('is-swapping');
      next.onload = next.onerror = function () {
        shotImg.srcset = base + '-720.webp 720w, ' + base + '.webp 1440w';
        shotImg.src = base + '.webp';
        shotImg.alt = tab.dataset.alt;
        shotUrl.textContent = tab.dataset.url;
        shotImg.classList.remove('is-swapping');
      };
      next.src = base + '.webp';
    });
  });

  /* ---------- Project filter ---------- */
  var filters = $$('.filter');
  var projects = $$('#project-grid .project');
  var filterStatus = $('#filter-status');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.dataset.filter;
      var shown = 0;
      filters.forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
        b.classList.toggle('is-active', b === btn);
      });
      projects.forEach(function (p) {
        var match = cat === 'all' || p.dataset.cat.split(' ').indexOf(cat) !== -1;
        p.hidden = !match;
        if (match) { shown++; show(p); }
      });
      // "More on GitHub" card is always present, so leave it out of the count.
      filterStatus.textContent = 'Showing ' + (shown - 1) + ' projects';
    });
  });

  /* ---------- Contact form ---------- */
  var form = $('#contact-form');
  if (form) {
    var fields = {
      name: $('#cf-name'),
      email: $('#cf-email'),
      subject: $('#cf-subject'),
      message: $('#cf-message')
    };
    var honeypot = $('#cf-company');
    var submitBtn = $('#cf-submit');
    var btnLabel = $('.btn-label', submitBtn);
    var statusBox = $('#cf-status');
    var counter = $('#cf-count');
    var loadedAt = Date.now();
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    var rules = {
      name: function (v) {
        if (!v) return 'Please enter your name.';
        if (v.length < 2) return 'Your name looks too short.';
        return '';
      },
      email: function (v) {
        if (!v) return 'Please enter your email address.';
        if (!EMAIL_RE.test(v)) return 'Please enter a valid email address, like name@example.com.';
        return '';
      },
      subject: function (v) {
        if (!v) return 'Please add a subject.';
        if (v.length < 3) return 'The subject looks too short.';
        return '';
      },
      message: function (v) {
        if (!v) return 'Please write a message.';
        if (v.length < 20) return 'Please write at least 20 characters so I have some context.';
        return '';
      }
    };

    function validateField(key) {
      var input = fields[key];
      var error = rules[key](input.value.trim());
      var errorEl = $('#' + input.id + '-error');
      errorEl.textContent = error;
      if (error) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
      return !error;
    }

    function setStatus(kind, html) {
      statusBox.className = 'form-status' + (kind ? ' is-' + kind : '');
      statusBox.innerHTML = html || '';
    }

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.classList.toggle('is-loading', loading);
      btnLabel.textContent = loading ? 'Sending…' : 'Send message';
    }

    var mailtoFallback = function () {
      var subject = encodeURIComponent(fields.subject.value.trim() || 'Hello from your portfolio');
      var body = encodeURIComponent(fields.message.value.trim());
      return 'mailto:' + CONTACT_EMAIL + '?subject=' + subject + '&body=' + body;
    };

    Object.keys(fields).forEach(function (key) {
      var input = fields[key];
      // Validate when leaving a field; while typing only clear an existing error.
      input.addEventListener('blur', function () { if (input.value.trim()) validateField(key); });
      input.addEventListener('input', function () {
        if (input.getAttribute('aria-invalid') === 'true') validateField(key);
      });
    });

    fields.message.addEventListener('input', function () {
      counter.textContent = String(fields.message.value.length);
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      setStatus('', '');

      var firstInvalid = null;
      Object.keys(fields).forEach(function (key) {
        if (!validateField(key) && !firstInvalid) firstInvalid = fields[key];
      });
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      // Spam checks. Bots that trip these get a normal-looking success so they don't adapt.
      var tooFast = Date.now() - loadedAt < MIN_FILL_MS;
      if (honeypot.value || tooFast) {
        form.reset();
        counter.textContent = '0';
        setStatus('success', 'Thanks! Your message has been sent.');
        return;
      }

      var lastSent = 0;
      try { lastSent = Number(localStorage.getItem('contact:lastSent')) || 0; } catch (err) { /* ignore */ }
      var wait = COOLDOWN_MS - (Date.now() - lastSent);
      if (wait > 0) {
        setStatus('error', 'You just sent a message. Please wait ' + Math.ceil(wait / 1000) + ' seconds before sending another.');
        return;
      }

      if (navigator.onLine === false) {
        setStatus('error', 'You appear to be offline. Check your connection and try again.');
        return;
      }

      var payload = {
        name: fields.name.value.trim(),
        email: fields.email.value.trim(),
        subject: fields.subject.value.trim(),
        message: fields.message.value.trim(),
        _subject: 'Portfolio: ' + fields.subject.value.trim(),
        _replyto: fields.email.value.trim(),
        _template: 'table',
        _honey: ''
      };

      setLoading(true);
      var controller = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (controller) controller.abort(); }, REQUEST_TIMEOUT_MS);

      fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok || String(data.success) !== 'true') throw new Error(data.message || 'Request failed');
          });
        })
        .then(function () {
          try { localStorage.setItem('contact:lastSent', String(Date.now())); } catch (err) { /* ignore */ }
          form.reset();
          counter.textContent = '0';
          setStatus('success', 'Thanks, your message has been sent. I’ll reply to the email address you gave.');
        })
        .catch(function () {
          setStatus('error', 'Sorry, the message could not be sent. Please try again, or <a href="' +
            mailtoFallback() + '">email me directly</a>.');
        })
        .then(function () {
          clearTimeout(timer);
          setLoading(false);
          statusBox.focus();
        });
    });
  }

  /* ---------- Footer year ---------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
