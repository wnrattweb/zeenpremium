/* ZEEN — dış servis veya framework gerektirmeyen etkileşimler. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = $('.motion-control');
  let paused = false;
  try { paused = localStorage.getItem('zeen-motion') === 'off'; } catch (_) {}
  const setMotion = () => {
    document.documentElement.classList.toggle('no-motion', paused || reduced.matches);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.textContent = paused ? 'Hareketi aç' : 'Hareketi durdur';
  };
  motionButton.addEventListener('click', () => {
    paused = !paused;
    try { localStorage.setItem('zeen-motion', paused ? 'off' : 'on'); } catch (_) {}
    setMotion();
  });
  reduced.addEventListener('change', setMotion);
  setMotion();

  const menuButton = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const closeMenu = (focus = false) => {
    menu.hidden = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Menüyü aç');
    if (focus) menuButton.focus();
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menu.hidden = !open;
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
  });
  $$('a', menu).forEach(link => link.addEventListener('click', () => closeMenu()));
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !menu.hidden) closeMenu(true);
  });
  matchMedia('(min-width: 761px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  // Dikey sekmeler: fare, dokunma ve yön tuşlarıyla çalışır.
  const tabs = $$('.flavor-tab');
  const photo = $('#flavor-photo');
  const panel = $('#flavor-panel');
  const activateTab = tab => {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
    });
    photo.src = tab.dataset.image;
    photo.alt = tab.dataset.alt;
    $('#flavor-label').textContent = tab.dataset.label;
    panel.setAttribute('aria-labelledby', tab.id);
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); activateTab(tabs[next]); }
    });
  });

  // Native dialog: klavye odağı, Esc ile kapatma, fotoğraf geçişleri.
  const gallery = $$('.gallery-item');
  const dialog = $('.lightbox');
  let currentPhoto = 0;
  let opener;
  const showPhoto = index => {
    currentPhoto = (index + gallery.length) % gallery.length;
    const item = gallery[currentPhoto];
    const source = $('img', item);
    $('#lightbox-photo').src = source.getAttribute('src');
    $('#lightbox-photo').alt = source.alt;
    $('#lightbox-caption').textContent = `${currentPhoto + 1} / ${gallery.length} — ${$('.caption span', item).textContent}`;
  };
  gallery.forEach((item, index) => item.addEventListener('click', () => {
    if (typeof dialog.showModal !== 'function') { window.open($('img', item).src, '_blank', 'noopener'); return; }
    opener = item;
    showPhoto(index);
    dialog.showModal();
    document.body.classList.add('locked');
  }));
  $('.lightbox-close').addEventListener('click', () => dialog.close());
  $('.lightbox-prev').addEventListener('click', () => showPhoto(currentPhoto - 1));
  $('.lightbox-next').addEventListener('click', () => showPhoto(currentPhoto + 1));
  dialog.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); showPhoto(currentPhoto - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); showPhoto(currentPhoto + 1); }
  });
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('locked');
    if (opener) opener.focus({ preventScroll: true });
  });

  // İçerik JavaScript kapalıyken de görünür; animasyonlar yalnızca iyileştirmedir.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('waiting'); observer.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    $$('.reveal').forEach(item => {
      if (item.getBoundingClientRect().top > innerHeight - 20) item.classList.add('waiting');
      observer.observe(item);
    });
    document.documentElement.classList.add('js-ready');
    const nav = $$('.desktop-nav a');
    const sectionObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      nav.forEach(link => {
        if (link.getAttribute('href') === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }), { rootMargin: '-20% 0px -60% 0px' });
    $$('main section[id]').forEach(section => sectionObserver.observe(section));
  }
  $('#year').textContent = new Date().getFullYear();
})();
