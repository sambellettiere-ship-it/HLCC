'use strict';

/* ── Active nav link ── */
(function markActiveNav() {
  const page = document.body.dataset.page;
  if (!page) return;
  const links = document.querySelectorAll('.nav__links a');
  links.forEach(a => {
    if (a.dataset.page === page) a.classList.add('active');
  });
})();

/* ── Mobile hamburger ── */
(function initHamburger() {
  const btn = document.querySelector('.nav__hamburger');
  const menu = document.querySelector('.nav__links');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    menu.classList.toggle('open', !open);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      btn.focus();
    }
  });

  document.addEventListener('click', e => {
    if (!btn.contains(e.target) && !menu.contains(e.target)) {
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
    }
  });
})();

/* ── Scroll-reveal ── */
(function initReveal() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }
  const pref = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (pref) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }
  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ── Calendar generation ── */
(function initCalendar() {
  const grid = document.getElementById('cal-grid');
  const titleEl = document.getElementById('cal-title');
  if (!grid || !titleEl) return;

  /* Events keyed by day-of-week (0=Sun … 6=Sat) or specific dates "YYYY-MM-DD" */
  const weeklyEvents = {
    5: [{ label: 'Better Together Night', type: 'community' }], // Every Friday
  };
  /* Monthly recurring: 2nd Saturday = family game night */
  const monthlyEvents = {
    family: { label: 'Family Game Night', type: 'family' },
  };

  let viewYear, viewMonth;
  const today = new Date();

  function render(year, month) {
    viewYear = year;
    viewMonth = month;

    const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                        'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    titleEl.textContent = `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    /* Find 2nd Saturday */
    let satCount = 0;
    let secondSat = -1;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(year, month, d).getDay() === 6) {
        satCount++;
        if (satCount === 2) { secondSat = d; break; }
      }
    }

    const dows = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    let html = dows.map(d => `<div class="calendar-grid__dow">${d}</div>`).join('');

    /* Blank cells before first day */
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="cal-day empty"></div>`;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dow = new Date(year, month, d).getDay();
      const isToday = (year === today.getFullYear() && month === today.getMonth() && d === today.getDate());
      let classes = 'cal-day';
      if (isToday) classes += ' today';

      let pills = '';
      if (weeklyEvents[dow]) {
        weeklyEvents[dow].forEach(ev => {
          pills += `<span class="cal-event-pill ${ev.type}">${ev.label}</span>`;
        });
      }
      if (d === secondSat) {
        pills += `<span class="cal-event-pill family">Family Night</span>`;
      }

      html += `<div class="${classes}"><div class="cal-day__num">${d}</div>${pills}</div>`;
    }

    /* Trailing blanks to complete 6-row grid */
    const total = firstDay + daysInMonth;
    const remainder = total % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        html += `<div class="cal-day empty"></div>`;
      }
    }

    grid.innerHTML = html;
  }

  /* Show next month (today is Apr 27 2026, so show May) */
  const initDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  render(initDate.getFullYear(), initDate.getMonth());

  /* Month navigation */
  document.getElementById('cal-prev')?.addEventListener('click', () => {
    let m = viewMonth - 1, y = viewYear;
    if (m < 0) { m = 11; y--; }
    render(y, m);
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    let m = viewMonth + 1, y = viewYear;
    if (m > 11) { m = 0; y++; }
    render(y, m);
  });
})();

/* ── Contact form ── */
(function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    /* TODO: Replace with a real form endpoint (e.g. Formspree.io) by updating
       form's action attribute and removing this preventDefault when ready. */
    const success = document.getElementById('form-success');
    if (success) {
      form.style.display = 'none';
      success.style.display = 'block';
    }
  });
})();
