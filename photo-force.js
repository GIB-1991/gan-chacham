(function () {
  var VERSION = 'fast-batch-card-photos-20260603';
  var STORE_KEY = 'gan_chacham_photo_map_' + VERSION;
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol|\.svg/i;
  var FALLBACKS = {
    fruit: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Plum_tree_with_fruit.jpg',
    citrus: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Plum_tree_with_fruit.jpg',
    ornamental: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/Usamljeni_jasen_-_panoramio_%28cropped%29.jpg/1280px-Usamljeni_jasen_-_panoramio_%28cropped%29.jpg',
    tropical: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Trientalis_borealis_1177.JPG/1280px-Trientalis_borealis_1177.JPG',
    bush: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Cytisus_scoparius2.jpg/1280px-Cytisus_scoparius2.jpg',
    lawn: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Poa_annua.jpg/1280px-Poa_annua.jpg',
    default: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Ranunculus_repens_1_%28cropped%29.JPG/1280px-Ranunculus_repens_1_%28cropped%29.JPG'
  };

  var photoMap = {};
  var pendingPages = {};
  var queued = false;
  var activeBatch = false;

  try {
    photoMap = JSON.parse(localStorage.getItem(STORE_KEY) || '{}') || {};
  } catch (e) {
    photoMap = {};
  }

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

  function fallback(p) {
    if (!p) return FALLBACKS.default;
    if (p.bg && FALLBACKS[p.bg]) return FALLBACKS[p.bg];
    if (p.type && FALLBACKS[p.type]) return FALLBACKS[p.type];
    return FALLBACKS.default;
  }

  function saveMap() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(photoMap)); } catch (e) {}
  }

  async function jsonWithTimeout(url) {
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

  function show(img, url) {
    if (!img || !safe(url)) return;
    var box = img.closest('.card-img');
    if (box) {
      box.classList.remove('no-real-photo');
      box.querySelectorAll('.card-photo-empty').forEach(function (node) { node.remove(); });
    }
    if (img.getAttribute('src') === url && img.classList.contains('show')) return;
    img.onload = function () { img.classList.add('show'); };
    img.onerror = function () { img.classList.remove('show'); };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function hideLoaders() {
    document.querySelectorAll('.photo-loading,.photo-loading.show').forEach(function (loader) {
      loader.classList.remove('show');
      loader.style.display = 'none';
      loader.style.opacity = '0';
    });
  }

  function applyCard(id) {
    var p = byId(id);
    var img = document.getElementById('cimg-' + id);
    if (!p || !img) return;

    var page = pageName(p);
    show(img, page && safe(photoMap[page]) ? photoMap[page] : fallback(p));

    if (page && photoMap[page] === undefined) {
      pendingPages[page] = true;
      scheduleBatch();
    }
  }

  function repairCards() {
    hideLoaders();
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) {
      applyCard(img.id.replace('cimg-', ''));
    });
  }

  function scheduleBatch() {
    if (queued || activeBatch) return;
    queued = true;
    setTimeout(runBatch, 120);
  }

  async function runBatch() {
    queued = false;
    var pages = Object.keys(pendingPages).filter(function (page) { return photoMap[page] === undefined; });
    pendingPages = {};
    if (!pages.length) return;
    activeBatch = true;

    try {
      for (var i = 0; i < pages.length; i += 40) {
        var chunk = pages.slice(i, i + 40);
        var url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(chunk.join('|')) + '&prop=pageimages&pithumbsize=1000&format=json&origin=*';
        try {
          var data = await jsonWithTimeout(url);
          var resultPages = Object.values(data.query && data.query.pages || {});
          resultPages.forEach(function (page) {
            var source = page && page.thumbnail && page.thumbnail.source;
            photoMap[page.title] = safe(source) ? source : null;
          });
          chunk.forEach(function (title) {
            if (photoMap[title] === undefined) photoMap[title] = null;
          });
        } catch (e) {
          chunk.forEach(function (title) {
            if (photoMap[title] === undefined) photoMap[title] = null;
          });
        }
      }
      saveMap();
    } finally {
      activeBatch = false;
      repairCards();
    }
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
      '.card-photo-empty{display:none!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function patchApis() {
    window.fetchWikiImg = function (name) {
      var p = plants().find(function (item) { return item.name === name; }) || { name: name };
      var page = pageName(p);
      return Promise.resolve(page && safe(photoMap[page]) ? photoMap[page] : fallback(p));
    };
    window.tryLoadImg = function (id, size, ok, fail) {
      var p = byId(id);
      if (!p) {
        if (fail) fail();
        return;
      }
      var page = pageName(p);
      var url = page && safe(photoMap[page]) ? photoMap[page] : fallback(p);
      if (ok) ok(url);
      if (page && photoMap[page] === undefined) {
        pendingPages[page] = true;
        scheduleBatch();
      }
    };
    window.loadCardImg = function (id) { applyCard(id); };
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
      setTimeout(repairCards, 60);
      return result;
    };
  }

  function observe() {
    var area = document.getElementById('pa');
    if (!area || window.__photoForceObserver) return;
    window.__photoForceObserver = true;
    new MutationObserver(function () { setTimeout(repairCards, 60); }).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try { return typeof P !== 'undefined' && Array.isArray(P) && typeof window.openM === 'function'; }
    catch (e) { return false; }
  }

  var tries = 0;
  function boot() {
    installCss();
    hideLoaders();
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
    setInterval(hideLoaders, 1200);
    window.__photoForceVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
