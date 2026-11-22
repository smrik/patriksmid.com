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
  function linkFrom(original, cls) {
    const a = element('a',cls,original.textContent.trim() || original.getAttribute('aria-label'));
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
