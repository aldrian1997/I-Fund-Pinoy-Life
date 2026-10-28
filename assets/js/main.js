/* I Fund Pinoy Life — shared interactions */
(function () {
  document.documentElement.classList.remove('no-js');

  // Mobile navigation
  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var hdr = document.querySelector('.site-header');
      if (hdr) document.documentElement.style.setProperty('--nav-top', Math.round(hdr.getBoundingClientRect().bottom) + 'px');
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('visible'); });
  }

  // Toast + copy to clipboard
  var toast;
  function showToast(msg) {
    if (!toast) { toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); document.body.appendChild(toast); }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(function () { toast.classList.remove('show'); }, 1800);
  }
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () { showToast('Copied: ' + text); }, function () { showToast(text); });
      } else { showToast(text); }
    });
  });

  // Tabs
  document.querySelectorAll('[role="tablist"]').forEach(function (list) {
    var tabs = list.querySelectorAll('[role="tab"]');
    function select(tab) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(t); });
      t.addEventListener('keydown', function (e) {
        var n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!n) return;
        var next = tabs[(i + n + tabs.length) % tabs.length];
        select(next); next.focus();
      });
    });
  });

  var peso = function (n) { return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };

  // Fee calculator
  var calc = document.getElementById('fee-calc-input');
  if (calc) {
    var update = function () {
      var v = Math.max(0, parseFloat(String(calc.value).replace(/,/g, '')) || 0);
      var ops = v * 0.10, gw = v * 0.03, net = v - ops - gw;
      document.getElementById('fc-gross').textContent = peso(v);
      document.getElementById('fc-ops').textContent = '− ' + peso(ops);
      document.getElementById('fc-gw').textContent = '− ' + peso(gw);
      document.getElementById('fc-net').textContent = peso(net);
    };
    calc.addEventListener('input', update);
    document.querySelectorAll('[data-calc]').forEach(function (b) {
      b.addEventListener('click', function () { calc.value = b.getAttribute('data-calc'); update(); });
    });
    update();
  }

  // Donation planner (builds an email to donate@; no data is submitted by the site)
  var planner = document.getElementById('donate-planner');
  if (planner) {
    var currency = 'PHP';
    var amounts = { PHP: [500, 1000, 2500, 5000, 10000], USD: [10, 25, 50, 100, 250] };
    var sym = function () { return currency === 'PHP' ? '₱' : '$'; };
    var amountWrap = document.getElementById('amount-options');
    var other = document.getElementById('amount-other');
    var codeWrap = document.getElementById('code-field');
    var codeInput = document.getElementById('campaign-code');

    function renderAmounts() {
      amountWrap.innerHTML = '';
      amounts[currency].forEach(function (a, i) {
        var label = document.createElement('label');
        label.className = 'option amount';
        label.innerHTML = '<input type="radio" name="amount" value="' + a + '"' + (i === 1 ? ' checked' : '') + '><span>' + sym() + a.toLocaleString() + '</span>';
        amountWrap.appendChild(label);
      });
      document.getElementById('amount-prefix').textContent = sym();
    }

    function val(name) { var el = planner.querySelector('input[name="' + name + '"]:checked'); return el ? el.value : ''; }
    function labelFor(name) { var el = planner.querySelector('input[name="' + name + '"]:checked'); return el ? el.getAttribute('data-label') : ''; }

    function refresh() {
      var dest = val('dest');
      codeWrap.hidden = dest !== 'cause';
      var amt = parseFloat(other.value) > 0 ? parseFloat(other.value) : parseFloat(val('amount')) || 0;
      var amtText = sym() + amt.toLocaleString(undefined, { maximumFractionDigits: 2 });
      var method = labelFor('method');
      var destText = labelFor('dest') + (dest === 'cause' && codeInput.value.trim() ? ' (' + codeInput.value.trim() + ')' : '');
      document.getElementById('sum-dest').textContent = destText;
      document.getElementById('sum-amount').textContent = amtText + ' ' + currency;
      document.getElementById('sum-method').textContent = method;
      document.getElementById('donate-amount-label').textContent = amtText;

      var subject = 'Donation pledge: ' + amtText + ' ' + currency + ' via ' + method;
      var body = [
        'Hello I Fund Pinoy Life team,',
        '',
        'I would like to make a donation. Please send me the official payment instructions.',
        '',
        'Gift for: ' + destText,
        'Amount: ' + amtText + ' ' + currency,
        'Payment method: ' + method,
        '',
        'Name (optional):',
        'Keep my gift anonymous: Yes / No',
        '',
        'Thank you.'
      ].join('\n');
      document.getElementById('donate-email').href = 'mailto:donate@ifundpinoy.life?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    planner.addEventListener('change', function (e) {
      if (e.target.name === 'amount') other.value = '';
      refresh();
    });
    planner.addEventListener('input', refresh);
    document.querySelectorAll('[data-currency]').forEach(function (b) {
      b.addEventListener('click', function () {
        currency = b.getAttribute('data-currency');
        document.querySelectorAll('[data-currency]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        other.value = '';
        renderAmounts(); refresh();
      });
    });
    var params = new URLSearchParams(location.search);
    if (params.get('code')) {
      codeInput.value = params.get('code');
    }
    var preset = params.get('for');
    if (preset) { var r = planner.querySelector('input[name="dest"][value="' + preset + '"]'); if (r) r.checked = true; }
    renderAmounts(); refresh();
  }

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
