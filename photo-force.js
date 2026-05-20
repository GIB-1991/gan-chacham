(function () {
  var VERSION = 'card-wiki-timeout-no-loader-20260521';
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol|\.svg/i;

  function plants() {
    try { return typeof P !== 'undefined' && Array.isArray(P) ? P : []; }
    catch (e) { return []; }
  }

  function byId(id) {
    return plants().find(function (p) { return String(p.id) === String(id); }) || null;
  }

  function wiki(name) {
    try { return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES && WIKI_PAGES[name] ? WIKI_PAGES[name] : {}; }
    catch (e) { return {}; }
  }

  function clean(value) {
    return String(value || '').replace(/\([^)]*\)/g, ' ').replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function pageName(p) {
    return clean(wiki(p && p.name || '').page || '');
  }

  function safe(url) {
    url = String(url || '');
    return /^https?:\/\//i.test(url) && !BAD_URL.test(url);
  }

  async function json(url) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4500) : null;
    try {
      var response = await fetch(url, { cache: 'force-cache', signal: ctrl && ctrl.signal });
      if (!response.ok) throw new Error(response.status);
      return response.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function wikiImage(p) {
    var page = pageName(p);
    if (!page) return null;
    var key = 'card_wiki_photo_' + VERSION + '_' + page;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return safe(imgCache[key]) ? imgCache[key] : null;
    } catch (e) {}

    var url = null;
    try {
      var data = await json('https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(page) + '&prop=pageimages&pithumbsize=1000&format=json&origin=*');
      var first = Object.values(data.query && data.query.pages || {})[0];
      var candidate = first && first.thumbnail && first.thumbnail.source;
      if (safe(candidate)) url = candidate;
    } catch (e) {}

    try { if (typeof imgCache !== 'undefined') imgCache[key] = url; } catch (e) {}
    return url;
  }

  async function commonsImage(p) {
    var page = pageName(p);
    if (!page) return null;
    var query = page + ' tree plant leaves foliage';
    var key = 'card_commons_photo_' + VERSION + '_' + page;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return safe(imgCache[key]) ? imgCache[key] : null;
    } catch (e) {}

    var url = null;
    try {
      var search = await json('https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=10&gsrsearch=' + encodeURIComponent(query) + '&prop=imageinfo&iiprop=url|mime&iiurlwidth=1000&format=json&origin=*');
      var pages = Object.values(search.query && search.query.pages || {});
      for (var i = 0; i < pages.length; i++) {
        var info = pages[i].imageinfo && pages[i].imageinfo[0];
        var candidate = info && (info.thumburl || info.url);
        var title = pages[i].title || '';
        if (/^image\/(jpeg|png|webp)/i.test(info && info.mime || '') && safe(candidate) && !/logo|icon|diagram|map|symbol|svg|pdf/i.test(title)) {
          url = candidate;
          break;
        }
      }
    } catch (e) {}

    try { if (typeof imgCache !== 'undefined') imgCache[key] = url; } catch (e) {}
    return url;
  }

  async function resolve(p) {
    if (!p) return null;
    var customKey = 'custom_' + p.id + '_medium';
    try {
      var custom = typeof imgCache !== 'undefined' ? imgCache[customKey] : null;
      if (safe(custom)) return custom;
    } catch (e) {}
    return await wikiImage(p) || await commonsImage(p);
  }

  function removeEmpty(box) {
    if (!box) return;
    box.classList.remove('no-real-photo');
    box.querySelectorAll('.card-photo-empty').forEach(function (node) { node.remove(); });
  }

  function markEmpty(box) {
    if (!box) return;
    box.classList.add('no-real-photo');
    if (!box.querySelector('.card-photo-empty')) {
      var empty = document.createElement('div');
      empty.className = 'card-photo-empty';
      empty.textContent = 'אין תמונה';
      box.appendChild(empty);
    }
  }

  function show(img, url) {
    if (!img) return;
    var box = img.closest('.card-img');
    img.classList.remove('show');
    if (!url) {
      img.removeAttribute('src');
      markEmpty(box);
      return;
    }
    removeEmpty(box);
    img.style.display = 'block';
    img.onload = function () { img.classList.add('show'); removeEmpty(box); };
    img.onerror = function () { img.classList.remove('show'); markEmpty(box); };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  async function repairCard(id) {
    var p = byId(id);
    var img = document.getElementById('cimg-' + id);
    var loader = document.getElementById('cload-' + id);
    if (!p || !img) return;
    if (loader) loader.classList.remove('show');
    var url = await resolve(p);
    if (loader) loader.classList.remove('show');
    show(img, url);
  }

  function repairCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) {
      repairCard(img.id.replace('cimg-', ''));
    });
  }

  function hideModalPhotos() {
    var box = document.getElementById('mPhotos');
    if (!box) return;
    box.innerHTML = '';
    box.className = 'm-photos modal-photos-removed';
    box.setAttribute('aria-hidden', 'true');
    box.style.display = 'none';
    box.style.height = '0';
    box.style.minHeight = '0';
    box.style.margin = '0';
    box.style.padding = '0';
    box.style.border = '0';
    box.style.overflow = 'hidden';
  }

  function installCss() {
    if (document.getElementById('photo-force-css')) return;
    var style = document.createElement('style');
    style.id = 'photo-force-css';
    style.textContent = [
      '.card-img .plant-emoji-big,.card-img .img-bg,.card-img .size-tabs{display:none!important}',
      '.card-img{background:#e6eddf!important}',
      '.card-img .real-photo.show{opacity:1!important;display:block!important}',
      '.photo-loading,.photo-loading.show{display:none!important;opacity:0!important}',
      '.card-img.no-real-photo{display:flex!important;align-items:center!important;justify-content:center!important;background:#e6eddf!important}',
      '.card-photo-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#38513d;font-size:.9rem;font-weight:800;background:#e6eddf;z-index:2}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function patchApis() {
    window.fetchWikiImg = function (name) {
      return resolve(plants().find(function (p) { return p.name === name; }) || { name: name });
    };
    window.tryLoadImg = function (id, size, ok, fail) {
      var p = byId(id);
      if (!p) {
        if (fail) fail();
        return;
      }
      resolve(p).then(function (url) {
        if (url && ok) ok(url);
        else if (fail) fail();
      }).catch(function () {
        if (fail) fail();
      });
    };
    window.loadCardImg = function (id) { repairCard(id); };
  }

  function patchOpenModal() {
    if (window.__photoForceOpenM) return;
    var old = window.openM;
    if (typeof old !== 'function') return;
    window.__photoForceOpenM = true;
    window.openM = function () {
      var result = old.apply(this, arguments);
      hideModalPhotos();
      setTimeout(hideModalPhotos, 0);
      setTimeout(hideModalPhotos, 80);
      setTimeout(hideModalPhotos, 700);
      if (result && typeof result.then === 'function') result.then(hideModalPhotos).catch(function () {});
      return result;
    };
  }

  function patchRender() {
    if (window.__photoForceRender) return;
    var old = window.render;
    if (typeof old !== 'function') return;
    window.__photoForceRender = true;
    window.render = function () {
      var result = old.apply(this, arguments);
      setTimeout(repairCards, 120);
      setTimeout(repairCards, 1200);
      return result;
    };
  }

  function observe() {
    var area = document.getElementById('pa');
    if (!area || window.__photoForceObserver) return;
    window.__photoForceObserver = true;
    new MutationObserver(function () { setTimeout(repairCards, 120); }).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try { return typeof P !== 'undefined' && Array.isArray(P) && typeof window.openM === 'function'; }
    catch (e) { return false; }
  }

  var tries = 0;
  function boot() {
    installCss();
    hideModalPhotos();
    if (!ready()) {
      if (++tries < 240) setTimeout(boot, 100);
      return;
    }
    patchApis();
    patchOpenModal();
    patchRender();
    observe();
    repairCards();
    setTimeout(repairCards, 1200);
    setInterval(function () {
      patchOpenModal();
      hideModalPhotos();
    }, 1500);
    window.__photoForceVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();