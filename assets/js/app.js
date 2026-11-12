/* Local AI Basecamp: navigation, progress, quizzes, search, copy buttons and theme.
   Works on every page. Progress is stored in this browser only (localStorage). */
(function () {
  var C = window.COURSE || { modules: [], lessons: [] };
  var body = document.body;
  var root = body.getAttribute('data-root') || '';
  var page = body.getAttribute('data-page') || '';
  var KEY = 'basecamp-v1';

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function href(id) { return id === 'home' ? root + 'index.html' : root + 'lessons/' + id + '.html'; }

  /* ---------- Saved state ---------- */
  var S = { done: {}, checks: {}, quiz: {}, open: {} };
  try {
    var raw = localStorage.getItem(KEY);
    if (raw) { var j = JSON.parse(raw); S.done = j.done || {}; S.checks = j.checks || {}; S.quiz = j.quiz || {}; S.open = j.open || {}; }
  } catch (e) { /* storage blocked: the site still works, progress is just not saved */ }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  var CORE = C.lessons.filter(function (l) { return l.mod !== 'R' && !l.optional; });

  /* ---------- Theme ---------- */
  var html = document.documentElement;
  function isDark() { var t = html.getAttribute('data-theme'); return t ? t === 'dark' : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches); }
  var themeBtn = $('#themeBtn');
  if (themeBtn) themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try { localStorage.setItem('basecamp-theme', next); } catch (e) {}
  });

  /* ---------- Course map and progress ---------- */
  function paintProgress() {
    $$('#nav li[data-id]').forEach(function (li) { li.classList.toggle('done', !!S.done[li.getAttribute('data-id')]); });
    C.modules.forEach(function (m) {
      var el = $('#nav [data-count="' + m.k + '"]');
      if (!el || m.k === 'R') return;
      var items = C.lessons.filter(function (l) { return l.mod === m.k; });
      el.textContent = items.filter(function (l) { return S.done[l.id]; }).length + '/' + items.length;
    });
    var n = CORE.filter(function (l) { return S.done[l.id]; }).length;
    var pct = CORE.length ? Math.round(n / CORE.length * 100) : 0;
    if ($('#progText')) $('#progText').textContent = n + ' of ' + CORE.length + ' core lessons';
    if ($('#progPct')) $('#progPct').textContent = pct + '%';
    if ($('#progBar')) $('#progBar').style.width = pct + '%';
    paintHome();
  }
  $$('#nav .mod').forEach(function (d) {
    var k = d.getAttribute('data-m'), b = $('.mod-h', d);
    if (!d.classList.contains('open') && S.open[k]) { d.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
    b.addEventListener('click', function () {
      d.classList.toggle('open');
      var o = d.classList.contains('open');
      b.setAttribute('aria-expanded', o ? 'true' : 'false');
      S.open[k] = o; save();
    });
  });
  var cur = $('#nav a[aria-current="page"]');
  if (cur && cur.scrollIntoView) { try { cur.scrollIntoView({ block: 'center' }); } catch (e) {} window.scrollTo(0, 0); }

  /* ---------- Start page ---------- */
  function paintHome() {
    if (page !== 'home') return;
    var next = CORE.filter(function (l) { return !S.done[l.id]; })[0];
    var btn = $('#continueBtn');
    if (btn) {
      var started = CORE.some(function (l) { return S.done[l.id]; });
      if (next) { btn.href = href(next.id); btn.textContent = (started ? 'Continue: ' : 'Start: ') + next.title; }
      else { btn.href = href('capstone'); btn.textContent = 'All core lessons done. Revisit the capstone'; }
    }
    $$('.mcard[data-mod]').forEach(function (card) {
      var k = card.getAttribute('data-mod'); if (k === 'R') return;
      var items = C.lessons.filter(function (l) { return l.mod === k; });
      var d = items.filter(function (l) { return S.done[l.id]; }).length;
      var bar = $('.meter i', card); if (bar) bar.style.width = (items.length ? d / items.length * 100 : 0) + '%';
      var dc = $('.done-count', card); if (dc) dc.textContent = ' · ' + d + ' done';
    });
  }

  /* ---------- Lesson page enhancements ---------- */
  var view = $('#view');
  // Interactive widgets
  $$('[data-widget]', view).forEach(function (el) {
    var f = window.WIDGETS && window.WIDGETS[el.getAttribute('data-widget')];
    if (f) { try { f(el); } catch (e) { el.textContent = 'This calculator could not load.'; } }
  });
  // Copy buttons on code blocks
  $$('pre', view).forEach(function (pre) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'copy'; b.textContent = 'Copy';
    b.addEventListener('click', function () {
      var code = pre.querySelector('code') || pre;
      var text = code.innerText;
      var ok = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1400); };
      var fallback = function () {
        var r = document.createRange(); r.selectNodeContents(code);
        var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
        b.textContent = 'Selected, press Ctrl+C'; setTimeout(function () { b.textContent = 'Copy'; }, 2000);
      };
      try { navigator.clipboard.writeText(text).then(ok, fallback); } catch (e) { fallback(); }
    });
    pre.appendChild(b);
  });
  // Checklists that remember their state
  $$('input[data-k]', view).forEach(function (c) {
    var k = c.getAttribute('data-k'), lab = c.closest('.ck');
    c.checked = !!S.checks[k]; if (lab) lab.classList.toggle('on', c.checked);
    c.addEventListener('change', function () {
      if (c.checked) S.checks[k] = 1; else delete S.checks[k];
      if (lab) lab.classList.toggle('on', c.checked);
      save();
    });
  });
  // Quizzes
  var qs = $$('.q', view), right = 0, answered = 0;
  qs.forEach(function (q) {
    var ol = $('ol', q), correct = +q.getAttribute('data-correct');
    if (!ol) return;
    $$('li', ol).forEach(function (li, i) {
      li.innerHTML = '<button type="button">' + li.innerHTML + '</button>';
      $('button', li).addEventListener('click', function () {
        if (q.classList.contains('done')) return;
        q.classList.add('done');
        var bs = $$('button', ol);
        bs.forEach(function (x) { x.disabled = true; });
        if (bs[correct - 1]) bs[correct - 1].classList.add('right');
        if (i + 1 !== correct) bs[i].classList.add('wrong'); else right++;
        answered++;
        if (answered === qs.length) {
          var p = document.createElement('p'); p.className = 'note';
          p.textContent = 'You got ' + right + ' of ' + qs.length + ' right on the first try.' + (right < qs.length ? ' Re-read the explanations, then try again tomorrow.' : ' Nice work.');
          q.parentNode.appendChild(p);
        }
      });
    });
  });
  // Mark complete
  var doneBtn = $('#doneBtn');
  if (doneBtn) {
    var id = doneBtn.getAttribute('data-id');
    var paint = function () { doneBtn.textContent = S.done[id] ? 'Completed ✓ (undo)' : 'Mark lesson complete'; doneBtn.className = 'btn' + (S.done[id] ? '' : ' primary'); };
    paint();
    doneBtn.addEventListener('click', function () { if (S.done[id]) delete S.done[id]; else S.done[id] = true; save(); paint(); paintProgress(); });
  }

  /* ---------- Mobile menu ---------- */
  var menuBtn = $('#menuBtn');
  if (menuBtn) menuBtn.addEventListener('click', function (e) { e.stopPropagation(); body.classList.toggle('rail-open'); });
  document.addEventListener('click', function (e) {
    if (body.classList.contains('rail-open') && !e.target.closest('#rail') && !e.target.closest('#menuBtn')) body.classList.remove('rail-open');
  });

  /* ---------- Search (Ctrl+K) ---------- */
  var scrim = $('#scrim'), sin = $('#sinput'), sres = $('#sres'), sel = 0, hits = [];
  var GL = window.GLOSSARY || [];
  function openSearch() { scrim.classList.add('on'); sin.value = ''; runSearch(); setTimeout(function () { sin.focus(); }, 20); }
  function closeSearch() { scrim.classList.remove('on'); }
  function label(l) { return (l.num ? l.num + '  ' : '') + l.title + (l.optional ? '  (optional)' : ''); }
  function runSearch() {
    var q = sin.value.toLowerCase().trim(), words = q.split(/\s+/).filter(Boolean);
    hits = [];
    if (words.length) {
      C.lessons.forEach(function (l) {
        var t = l.title.toLowerCase(), b = l.text.toLowerCase();
        if (!words.every(function (w) { return t.indexOf(w) > -1 || b.indexOf(w) > -1; })) return;
        var score = words.reduce(function (a, w) { return a + (t.indexOf(w) > -1 ? 10 : 0) + (b.indexOf(w) > -1 ? 1 : 0); }, 0);
        var pos = b.indexOf(words[0]);
        hits.push({ href: href(l.id), title: label(l), sub: pos > -1 ? '…' + l.text.slice(Math.max(0, pos - 50), pos + 90) + '…' : '', score: score });
      });
      GL.forEach(function (g) {
        if (words.every(function (w) { return (g[0] + ' ' + g[1]).toLowerCase().indexOf(w) > -1; }))
          hits.push({ href: href('glossary'), title: 'Glossary: ' + g[0], sub: g[1], score: 5 });
      });
      hits.sort(function (a, b) { return b.score - a.score; });
      hits = hits.slice(0, 9);
    } else {
      hits = CORE.filter(function (l) { return !S.done[l.id]; }).slice(0, 8).map(function (l) { return { href: href(l.id), title: label(l), sub: 'Next up' }; });
    }
    sel = 0; paintSearch();
  }
  function paintSearch() {
    sres.innerHTML = hits.length ? hits.map(function (h, i) {
      return '<a href="' + h.href + '" class="' + (i === sel ? 'sel' : '') + '">' + esc(h.title) + (h.sub ? '<small>' + esc(h.sub) + '</small>' : '') + '</a>';
    }).join('') : '<p>No results. Try another word.</p>';
  }
  if (scrim) {
    $('#searchBtn').addEventListener('click', openSearch);
    scrim.addEventListener('click', function (e) { if (e.target === scrim) closeSearch(); });
    sin.addEventListener('input', runSearch);
    sin.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(hits.length - 1, sel + 1); paintSearch(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paintSearch(); }
      else if (e.key === 'Enter' && hits[sel]) { location.href = hits[sel].href; }
    });
  }
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); }
    else if (e.key === 'Escape') { closeSearch(); body.classList.remove('rail-open'); }
  });

  paintProgress();
})();
