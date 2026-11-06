/* Narrow Espresso — depth engine. Transform/opacity only.
   Never starts under prefers-reduced-motion. */
(function () {
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal-on-scroll needs the hidden start state only when motion is OK */
  if (!reduced) {
    document.documentElement.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('in'); });
    return; /* engine never starts */
  }

  var fine = window.matchMedia('(pointer: fine)').matches;

  /* --- parallax planes + hero image drift --- */
  var plx = Array.prototype.slice.call(document.querySelectorAll('[data-plx]'));
  var heroImg = document.querySelector('.hero-photo-frame img');
  var heroStage = document.querySelector('.hero-stage');
  var targets = plx.map(function () { return 0; });
  var current = plx.map(function () { return 0; });
  var imgTarget = 0, imgCurrent = 0;

  function measure() {
    var vh = window.innerHeight;
    plx.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height / 2 - vh / 2) / vh; /* -0.5..0.5ish */
      var rate = parseFloat(el.getAttribute('data-plx')) || 0;
      targets[i] = Math.max(-48, Math.min(48, -off * rate * 220));
    });
    if (heroImg && heroStage) {
      var hr = heroStage.getBoundingClientRect();
      var hoff = (hr.top + hr.height / 2 - vh / 2) / vh;
      imgTarget = Math.max(-26, Math.min(26, -hoff * 34));
    }
  }

  /* --- gallery: cards rotate toward flat at track centre --- */
  var track = document.getElementById('gallery');
  var cards = track ? Array.prototype.slice.call(track.querySelectorAll('.g-card')) : [];
  function gallery() {
    if (!track) return;
    var mid = track.getBoundingClientRect().left + track.clientWidth / 2;
    cards.forEach(function (card) {
      var r = card.getBoundingClientRect();
      var d = (r.left + r.width / 2 - mid) / track.clientWidth; /* -0.5..0.5 */
      var rot = Math.max(-11, Math.min(11, d * 26));
      card.style.transform = 'perspective(1100px) rotateY(' + rot.toFixed(2) + 'deg)';
    });
  }

  var ticking = false;
  function loop() {
    var moving = false;
    plx.forEach(function (el, i) {
      current[i] += (targets[i] - current[i]) * 0.08;
      if (Math.abs(targets[i] - current[i]) > 0.05) moving = true;
      var base = el.classList.contains('chip') ? ' translateZ(38px)' : '';
      el.style.transform = 'translate3d(0,' + current[i].toFixed(2) + 'px,0)' + base;
    });
    if (heroImg) {
      imgCurrent += (imgTarget - imgCurrent) * 0.08;
      if (Math.abs(imgTarget - imgCurrent) > 0.05) moving = true;
      heroImg.style.transform = 'translate3d(0,' + imgCurrent.toFixed(2) + 'px,0) scale(1.14)';
    }
    gallery();
    if (moving || ticking) requestAnimationFrame(loop);
    ticking = false;
  }
  function wake() {
    measure();
    if (!ticking) { ticking = true; requestAnimationFrame(loop); }
  }
  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', wake);
  if (track) track.addEventListener('scroll', function () { requestAnimationFrame(gallery); }, { passive: true });
  wake();

  /* --- pointer tilt on photo cards, fine pointers only, max 4 degrees --- */
  if (fine) {
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
      var raf = null;
      card.addEventListener('pointermove', function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - 0.5;
          var y = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform = 'perspective(1100px) rotateY(' + (x * 8).toFixed(2) + 'deg) rotateX(' + (-y * 8).toFixed(2) + 'deg)';
          raf = null;
        });
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }
})();
