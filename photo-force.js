(function () {
  var VERSION = 'commons-visible-plant-photos-20260604';
  var STORE_KEY = 'gan_chacham_commons_photo_map_' + VERSION;
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol|\.svg/i;
  var BAD_TITLE = /logo|icon|map|diagram|symbol|drawing|illustration|botanical illustration|scan|herbarium|fruit bowl|food|recipe|market|plate|child|baby|person|people|statue|cat|dog|animal/i;
  var GOOD_TITLE = /tree|plant|shrub|sapling|seedling|vine|flower|leaves|leaf|garden|orchard|grove|field|bloom|trunk|foliage|habit|cultivated/i;
  var loading = {};
  var photoMap = {};

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

  function safeUrl(url) {
    url = String(url || '');
    return /^https?:\/\//i.test(url) && !BAD_URL.test(url);
  }

  function saveMap() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(photoMap)); } catch (e) {}
  }

  function keyForPlant(p) {
    return p && (p.name || p.id) ? String(p.name || p.id) : '';
  }

  function searchTerms(p) {
    var info = wiki(p.name);
    var terms = [];
    if (info.large) terms.push(info.large);
    if (info.page) {
      terms.push(info.page + ' whole plant');
      terms.push(info.page + ' tree');
      terms.push(info.page + ' shrub');
    }
    terms.push(p.name + ' plant');
    return terms.filter(function (term, index, arr) {
      return term && arr.indexOf(term) === index;
    });
  }

  async function jsonWithTimeout(url) {
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 5000) : null;
    try {
      var response = await fetch(url, { cache: 'force-cache', signal: ctrl && ctrl.signal });
      if (!response.ok) throw new Error(response.status);
      return response.json();
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  function titleScore(title) {
    title = String(title || '');
    if (BAD_TITLE.test(title)) return -100;
    var score = 0;
    if (GOOD_TITLE.test(title)) score += 12;
    if (/\.(jpg|jpeg|png|webp)$/i.test(title)) score += 4;
    if (/fruit/i.test(title)) score -= 2;
    return score;
  }

  async function commonsImage(query) {
    var searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=12&srsearch=' + encodeURIComponent(query) + '&format=json&origin=*';
    var searchData = await jsonWithTimeout(searchUrl);
    var results = searchData.query && searchData.query.search || [];
    var candidates = results
      .filter(function (item) { return /\.(jpg|jpeg|png|webp)$/i.test(item.title || '') && !BAD_TITLE.test(item.title || ''); })
      .sort(function (a, b) { return titleScore(b.title) - titleScore(a.title); })
      .slice(0, 4);
    if (!candidates.length) return null;

    var titles = candidates.map(function (item) { return item.title; }).join('|');
    var infoUrl = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(titles) + '&prop=imageinfo&iiprop=url&iiurlwidth=900&format=json&origin=*';
    var infoData = await jsonWithTimeout(infoUrl);
    var pages = Object.values(infoData.query && infoData.query.pages || {});

    for (var i = 0; i < candidates.length; i++) {
      var wanted = candidates[i].title.replace(/^File:/, '');
      var page = pages.find(function (entry) {
        return String(entry.title || '').replace(/^File:/, '') === wanted;
      });
      var info = page && page.imageinfo && page.imageinfo[0];
      var url = info && (info.thumburl || info.url);
      if (safeUrl(url)) return url;
    }
    return null;
  }

  async function wikipediaImage(p) {
    var page = wiki(p.name).page;
    if (!page) return null;
    var url = 'https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(page) + '&prop=pageimages&pithumbsize=900&format=json&origin=*';
    var data = await jsonWithTimeout(url);
    var pages = Object.values(data.query && data.query.pages || {});
    var source = pages[0] && pages[0].thumbnail && pages[0].thumbnail.source;
    return safeUrl(source) ? source : null;
  }

  async function resolvePlantPhoto(p) {
    var key = keyForPlant(p);
    if (!key) return null;
    if (photoMap[key] !== undefined) return photoMap[key];
    if (loading[key]) return loading[key];

    loading[key] = (async function () {
      var terms = searchTerms(p);
      for (var i = 0; i < terms.length; i++) {
        try {
          var found = await commonsImage(terms[i]);
          if (found) {
            photoMap[key] = found;
            saveMap();
            return found;
          }
        } catch (e) {}
      }

      try {
        var wikiPhoto = await wikipediaImage(p);
        photoMap[key] = wikiPhoto || null;
        saveMap();
        return photoMap[key];
      } catch (e) {
        photoMap[key] = null;
        saveMap();
        return null;
      }
    })();

    return loading[key];
  }

  function clearGenericImage(img) {
    if (!img) return;
    img.classList.remove('show');
    img.removeAttribute('src');
    var box = img.closest('.card-img');
    if (box) {
      box.classList.remove('no-real-photo');
      box.classList.add('photo-pending');
      box.querySelectorAll('.card-photo-empty').forEach(function (node) { node.remove(); });
    }
  }

  function showImage(img, url) {
    if (!img || !safeUrl(url)) return;
    var box = img.closest('.card-img');
    if (box) {
      box.classList.remove('photo-pending');
      box.classList.remove('no-real-photo');
      box.querySelectorAll('.card-photo-empty').forEach(function (node) { node.remove(); });
    }
    img.onload = function () { img.classList.add('show'); };
    img.onerror = function () { img.classList.remove('show'); };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function markMissing(img) {
    if (!img) return;
    img.classList.remove('show');
    img.removeAttribute('src');
    var box = img.closest('.card-img');
    if (box) {
      box.classList.remove('photo-pending');
      box.classList.add('no-real-photo');
      if (!box.querySelector('.card-photo-empty')) {
        var note = document.createElement('div');
        note.className = 'card-photo-empty';
        note.textContent = '\u05d0\u05d9\u05df \u05ea\u05de\u05d5\u05e0\u05d4 \u05de\u05ea\u05d0\u05d9\u05de\u05d4';
        box.appendChild(note);
      }
    }
  }

  function hideLoaders() {
    document.querySelectorAll('.photo-loading,.photo-loading.show').forEach(function (loader) {
      loader.classList.remove('show');
      loader.style.display = 'none';
      loader.style.opacity = '0';
    });
  }

  function loadCard(id) {
    var p = byId(id);
    var img = document.getElementById('cimg-' + id);
    if (!p || !img) return;

    var key = keyForPlant(p);
    if (photoMap[key] && safeUrl(photoMap[key])) {
      showImage(img, photoMap[key]);
      return;
    }
    if (photoMap[key] === null) {
      markMissing(img);
      return;
    }

    clearGenericImage(img);
    resolvePlantPhoto(p).then(function (url) {
      var current = document.getElementById('cimg-' + id);
      if (url) showImage(current, url);
      else markMissing(current);
    });
  }

  function visibleCards() {
    var cards = document.querySelectorAll('img.real-photo[id^="cimg-"]');
    cards.forEach(function (img) {
      if (!img.__photoObserverAttached && window.IntersectionObserver && window.__photoForceIO) {
        img.__photoObserverAttached = true;
        window.__photoForceIO.observe(img);
      } else if (!window.IntersectionObserver) {
        loadCard(img.id.replace('cimg-', ''));
      }
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
      '.card-img{background:#dfe9d8!important}',
      '.card-img.photo-pending::after{content:"\\05d8\\05d5\\05e2\\05df \\05ea\\05de\\05d5\\05e0\\05d4...";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#244b33;font-weight:800;font-size:.9rem}',
      '.card-img.no-real-photo::after{content:"";display:none}',
      '.card-photo-empty{position:absolute;inset:0;display:flex!important;align-items:center;justify-content:center;color:#244b33;font-weight:800;font-size:.9rem;background:#dfe9d8}',
      '.card-img .real-photo.show{opacity:1!important;display:block!important}',
      '.photo-loading,.photo-loading.show{display:none!important;opacity:0!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function patchApis() {
    window.fetchWikiImg = function (name) {
      var p = plants().find(function (item) { return item.name === name; }) || { name: name, type: 'ornamental' };
      return resolvePlantPhoto(p);
    };
    window.tryLoadImg = function (id, size, ok, fail) {
      var p = byId(id);
      if (!p) {
        if (fail) fail();
        return;
      }
      resolvePlantPhoto(p).then(function (url) {
        if (url && ok) ok(url);
        else if (fail) fail();
      });
    };
    window.loadCardImg = function (id) { loadCard(id); };
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
      setTimeout(visibleCards, 80);
      return result;
    };
  }

  function observeArea() {
    if (window.IntersectionObserver && !window.__photoForceIO) {
      window.__photoForceIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) loadCard(entry.target.id.replace('cimg-', ''));
        });
      }, { rootMargin: '500px 0px' });
    }

    var area = document.getElementById('pa');
    if (!area || window.__photoForceObserver) return;
    window.__photoForceObserver = true;
    new MutationObserver(function () { setTimeout(visibleCards, 80); }).observe(area, { childList: true, subtree: true });
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
    observeArea();
    visibleCards();
    setInterval(hideLoaders, 1200);
    window.__photoForceVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
