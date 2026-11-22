// Enhance the site's own navigation. Keep the original links usable without JS.
(() => {
  if (document.querySelector('patrik-navigation')) return;
  const selector = '[data-patrik-shell]';
  const narrow = matchMedia('(max-width: 56rem)');
  const element = (tag, cls, value) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (value) node.textContent = value;
    return node;
  };
  const shell = element('patrik-navigation');
  const rail = element('aside', 'ps-rail');
  const mobile = element('div', 'ps-bar');
  const dialog = element('dialog', 'ps-drawer');
  dialog.id = 'patrik-navigation-drawer';
  dialog.setAttribute('aria-label', 'Navigation');
  const trigger = element('button', 'ps-toggle');
  trigger.type = 'button';
  trigger.setAttribute('aria-label', 'Open navigation');
  trigger.setAttribute('aria-controls', dialog.id);
  trigger.setAttribute('aria-expanded', 'false');
  const menuIcon = element('span', 'ps-menu-icon');
  menuIcon.setAttribute('aria-hidden','true');
  trigger.append(menuIcon);
  mobile.append(trigger);
  shell.append(rail, mobile, dialog);

  let source;
  function close() {
    if (dialog.open) dialog.close();
  }
  function panel(inDrawer) {
    const box = element('div', 'ps-panel');
    const top = element('div', 'ps-heading');
    const brand = source.querySelector('.patrik-sitebar-brand') || source.querySelector('a[href]');
    if (brand) top.append(linkFrom(brand, 'ps-brand'));
    if (inDrawer) {
      const back = element('button', 'ps-close', '‹');
      back.type = 'button';
      back.setAttribute('aria-label','Close navigation');
      back.addEventListener('click',close);
      top.append(back);
    }
    box.append(top);
    const nav = element('nav', 'ps-links');
    nav.setAttribute('aria-label','Site navigation');
    const links = source.querySelectorAll('nav a[href], .patrik-sitebar-links a[href]');
    for (const a of links) nav.append(linkFrom(a,'ps-link'));
    box.append(nav);
    const original = source.querySelector('select[data-patrik-theme]');
    if (original) {
      const label = element('label','ps-appearance','Appearance');
      const select = element('select');
      // v2.js keeps every marked selector in sync, including across tabs.
      select.setAttribute('data-patrik-theme','');
      for (const option of original.options) select.append(option.cloneNode(true));
      select.value = original.value;
      label.append(select);
      box.append(label);
    }
    return box;
  }
  // Outline symbols for the common destinations. App-specific links use a document icon.
  const icons = {
    websites: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
    projects: 'M3 6h7l2 3h9v11H3z',
    writing: 'M4 16 16 4l4 4L8 20l-5 1z M13 7l4 4',
    blog: 'M4 5h7l1 2 1-2h7v14h-7l-1 1-1-1H4z M12 7v13',
    personal: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M4 21v-2a8 8 0 0 1 16 0v2',
    about: 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 11v6 M12 7v.1',
    page: 'M5 3h9l5 5v13H5z M14 3v6h5 M8 14h8 M8 17h6'
  };
  function linkIcon(label) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns,'svg');
    svg.setAttribute('viewBox','0 0 24 24');
    svg.setAttribute('aria-hidden','true');
    svg.setAttribute('fill','none');
    svg.setAttribute('stroke','currentColor');
    svg.setAttribute('stroke-width','1.5');
    svg.setAttribute('stroke-linejoin','round');
    svg.setAttribute('stroke-linecap','round');
    const path = document.createElementNS(ns,'path');
    path.setAttribute('d',Object.hasOwn(icons,label) ? icons[label] : icons.page);
    svg.append(path);
    return svg;
  }
  function linkFrom(original, cls) {
    const a = element('a',cls,original.textContent.trim() || original.getAttribute('aria-label'));
    if (cls === 'ps-link') a.prepend(linkIcon(a.textContent.trim().toLowerCase()));
    a.href = original.href;
    if (original.target) a.target = original.target;
    if (original.rel) a.rel = original.rel;
    const url = new URL(a.href);
    const samePage = url.origin === location.origin && url.pathname.replace(/\/$/,'') === location.pathname.replace(/\/$/,'');
    if (original.hasAttribute('aria-current') || (samePage && (!url.hash || url.hash === location.hash))) {
      a.setAttribute('aria-current',original.getAttribute('aria-current') || 'page');
    }
    a.addEventListener('click', close);
    return a;
  }
  function refresh() {
    const next = document.querySelector(selector);
    if (source !== next) {
      observeSource.disconnect();
      source = next;
      if (source) observeSource.observe(source,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['href','aria-current','hidden']});
    }
    const active = Boolean(source && !source.closest('[hidden]'));
    document.documentElement.toggleAttribute('data-patrik-navigation',active);
    if (!active) {close();shell.remove();return;}
    if (!shell.isConnected) document.body.append(shell);
    rail.replaceChildren(panel(false));
    const brand = source.querySelector('.patrik-sitebar-brand') || source.querySelector('a[href]');
    mobile.replaceChildren(trigger);
    if (brand) mobile.append(linkFrom(brand,'ps-brand'));
    if (dialog.open) dialog.replaceChildren(panel(true));
  }
  const observeSource = new MutationObserver(refresh);
  new MutationObserver(() => {
    if (!source?.isConnected || !shell.isConnected && document.querySelector(selector) !== source) refresh();
  }).observe(document.body, {subtree:true,childList:true});
  trigger.addEventListener('click',() => {
    dialog.replaceChildren(panel(true));
    dialog.showModal();
    trigger.setAttribute('aria-expanded','true');
  });
  dialog.addEventListener('close',() => {
    trigger.setAttribute('aria-expanded','false');
    if (narrow.matches && shell.isConnected) trigger.focus({preventScroll:true});
  });
  dialog.addEventListener('click',e=>{
    if (e.target !== dialog) return;
    const r=dialog.getBoundingClientRect();
    if (e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) close();
  });
  narrow.addEventListener('change',close);
  document.addEventListener('nav',refresh);
  window.addEventListener('hashchange',refresh);
  refresh();
})();
