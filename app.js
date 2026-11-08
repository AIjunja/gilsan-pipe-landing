(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('#mobile-nav');
  function closeMenu() {
    mobileNav.hidden = true;
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', '메뉴 열기');
  }
  menu.addEventListener('click', () => {
    const opening = mobileNav.hidden;
    mobileNav.hidden = !opening;
    menu.setAttribute('aria-expanded', String(opening));
    menu.setAttribute('aria-label', opening ? '메뉴 닫기' : '메뉴 열기');
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !mobileNav.hidden) { closeMenu(); menu.focus(); }
  });
  matchMedia('(min-width: 851px)').addEventListener('change', event => { if (event.matches) closeMenu(); });

  const tabs = [...document.querySelectorAll('[role="tab"]')];
  function selectTab(tab, focus = false) {
    tabs.forEach(item => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      const panel = document.getElementById(item.getAttribute('aria-controls'));
      panel.hidden = !selected;
      panel.classList.toggle('is-switching', selected);
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', event => {
      let next;
      if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
    });
  });

  const dialog = document.querySelector('#inquiry-dialog');
  const form = document.querySelector('#inquiry-form');
  const inquiryStatus = document.querySelector('#inquiry-status');
  const fallback = document.querySelector('#copy-fallback');
  const output = document.querySelector('#inquiry-result');
  let opener;
  document.querySelectorAll('[data-inquiry]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    inquiryStatus.textContent = '';
    fallback.hidden = true;
    const selected = button.dataset.inquiryProduct;
    if (selected) form.elements.product.value = selected;
    dialog.showModal();
  }));
  function closeDialog() { dialog.close(); }
  dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => { if (opener?.isConnected) opener.focus(); });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(form);
    const get = key => String(data.get(key) || '').trim() || '상담 필요';
    const content = ['[길산파이프 제품 상담 메모]', `제품군: ${get('product')}`, `강종: ${get('grade')}`, `규격: ${get('size')}`, `수량: ${get('quantity')}`, `요청 사항: ${get('notes')}`].join('\n');
    output.value = content;
    try {
      await navigator.clipboard.writeText(content);
      inquiryStatus.textContent = '상담 내용을 복사했어요. 전화 상담 시 참고해 주세요. 문의가 접수된 상태는 아닙니다.';
      fallback.hidden = true;
    } catch {
      inquiryStatus.textContent = '자동 복사를 사용할 수 없어 직접 복사할 수 있는 내용을 열었어요.';
      fallback.hidden = false;
      output.focus();
      output.select();
    }
  });

  let toastTimer;
  function toast(message) {
    const el = document.querySelector('#toast');
    clearTimeout(toastTimer);
    el.textContent = message;
    el.classList.add('visible');
    toastTimer = setTimeout(() => el.classList.remove('visible'), 3000);
  }
  document.querySelector('[data-copy-address]').addEventListener('click', async () => {
    const address = '충남 논산시 부적면 감곡1길 7-24';
    const status = document.querySelector('#address-status');
    try {
      await navigator.clipboard.writeText(address);
      status.textContent = '주소를 복사했어요.';
      toast('길산파이프 주소를 복사했어요.');
    } catch {
      status.textContent = `자동 복사가 제한되어 있어요. 주소를 직접 선택해 복사해 주세요: ${address}`;
    }
  });

  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.body.classList.add('reveal-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-entering');
        observer.unobserve(entry.target);
      }
    }), { threshold: 0.18 });
    document.querySelectorAll('.section-marker, .quality-image').forEach(element => observer.observe(element));
  }
})();
