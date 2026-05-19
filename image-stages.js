(function () {
  var VERSION = 'modal-no-photo-strip-20260519';
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol|\.svg/i;
  var BAD_TEXT = /logo|icon|map|diagram|drawing|illustration|symbol|fruit|fruits|isolated|slice|sliced|peeled|market|basket|juice|dish|food|seed packet|herbarium|specimen|scan|person|people|man|woman|child|street|building|statue|sculpture|monument|cat|kitten/i;
  var GOOD_TEXT = /tree|plant|leaf|leaves|foliage|branch|branches|trunk|habit|habitus|orchard|garden|sapling|seedling|shrub|bush|vine|palm|cactus|flowering|bloom|field/i;

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

  function safe(url) {
    url = String(url || '');
    return /^https?:\/\//i.test(url) && !BAD_URL.test(url);
  }

  function plantPage(p) {
    var name = p && p.name || '';
    var page = wiki(name).page || '';
    return clean(page);
  }

  function query(p) {
    var page = plantPage(p);
    if (!page) return '';
    var kind = p && p.type === 'fruit' ? 'tree leaves foliage orchard' : 'plant leaves foliage garden';
    if (p && p.type === 'ornamental') kind = 'tree plant leaves foliage garden';
    if (p && p.type === 'lawn') kind = 'grass lawn plant';
    return (page + ' ' + kind + ' habit').trim();
  }

  function hitOk(hit, q) {
    var text = ((hit && hit.title) || '') + ' ' + ((hit && hit.snippet) || '') + ' ' + q;
    return !BAD_TEXT.test(text) && GOOD_TEXT.test(text);
  }

  async function json(url) {
    var response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(response.status);
    return response.json();
  }

  async function commons(p) {
    var q = query(p);
    if (!q) return null;
    var key = 'plant_photo_' + VERSION + '_' + (p && p.name || q);
    try {
      if (typeof imgCache !== 'undefined' && safe(imgCache[key])) return imgCache[key];
    } catch (e) {}

    try {
      var searchUrl = 'https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=28&srsearch=' + encodeURIComponent(q) + '&format=json&origin=*';
      var search = await json(searchUrl);
      var hits = (search.query && search.query.search || []).filter(function (hit) { return hitOk(hit, q); }).slice(0, 12);

      for (var i = 0; i < hits.length; i++) {
        var title = hits[i].title && hits[i].title.indexOf('File:') === 0 ? hits[i].title : 'File:' + hits[i].title;
        var infoUrl = 'https://commons.wikimedia.org/w/api.php?action=query&titles=' + encodeURIComponent(title) + '&prop=imageinfo&iiprop=url|mime&iiurlwidth=900&format=json&origin=*';
        var data = await json(infoUrl);
        var page = Object.values(data.query && data.query.pages || {})[0];
        var info = page && page.imageinfo && page.imageinfo[0];
        var url = info && (info.thumburl || info.url);
        if (/^image\/(jpeg|png|webp)/i.test(info && info.mime || '') && safe(url)) {
          try { if (typeof imgCache !== 'undefined') imgCache[key] = url; } catch (e) {}
          return url;
        }
      }
    } catch (e) {}

    try { if (typeof imgCache !== 'undefined') imgCache[key] = null; } catch (e) {}
    return null;
  }

  async function wikiImage(p) {
    var pageName = plantPage(p);
    if (!pageName) return null;
    var key = 'plant_wiki_' + VERSION + '_' + pageName;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return safe(imgCache[key]) ? imgCache[key] : null;
    } catch (e) {}

    var url = null;
    try {
      var data = await json('https://en.wikipedia.org/w/api.php?action=query&titles=' + encodeURIComponent(pageName) + '&prop=pageimages&pithumbsize=900&format=json&origin=*');
      var page = Object.values(data.query && data.query.pages || {})[0];
      var candidate = page && page.thumbnail && page.thumbnail.source;
      if (safe(candidate)) url = candidate;
    } catch (e) {}

    try { if (typeof imgCache !== 'undefined') imgCache[key] = url; } catch (e) {}
    return url;
  }

  function cleanCache() {
    try {
      if (typeof imgCache !== 'undefined') {
        Object.keys(imgCache).forEach(function (key) {
          var value = imgCache[key];
          if (
            !value ||
            BAD_URL.test(String(value)) ||
            /__(small|medium|large)$/.test(key) ||
            /^resolved_|^commons_|^wc__|^wp__|safe_tree_|safe_wp_|single_photo_|single_wiki_|real-photo-fallbacks|botanical-photos|force-real-photos|plant_photo_|plant_wiki_/.test(key)
          ) {
            delete imgCache[key];
          }
        });
      }
    } catch (e) {}

    try {
      for (var i = localStorage.length - 1; i >= 0; i--) {
        var key = localStorage.key(i);
        var value = localStorage.getItem(key);
        if (value && (BAD_URL.test(value) || /cat|kitten|statue|sculpture|logo|icon/i.test(value)) && /image|photo|img|gan_chacham_local_images/i.test(key)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {}
  }

  async function resolve(p) {
    if (!p) return null;
    var customKey = 'custom_' + p.id + '_medium';
    try {
      var custom = typeof imgCache !== 'undefined' ? imgCache[customKey] : null;
      if (safe(custom)) return custom;
      if (custom && typeof imgCache !== 'undefined') delete imgCache[customKey];
    } catch (e) {}
    return await commons(p) || await wikiImage(p);
  }

  function showPhoto(img, url) {
    if (!img) return;
    var box = img.closest('.card-img');
    img.classList.remove('show');
    if (box) {
      box.classList.remove('no-real-photo');
      var old = box.querySelector('.card-photo-empty');
      if (old) old.remove();
    }
    if (!url) {
      img.removeAttribute('src');
      if (box) markNoPhoto(box);
      return;
    }
    img.onload = function () { img.classList.add('show'); };
    img.onerror = function () {
      img.classList.remove('show');
      if (box) markNoPhoto(box);
    };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function markNoPhoto(box) {
    if (!box) return;
    box.classList.add('no-real-photo');
    if (!box.querySelector('.card-photo-empty')) {
      var empty = document.createElement('div');
      empty.className = 'card-photo-empty';
      empty.textContent = 'אין תמונה';
      box.appendChild(empty);
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
    if (document.getElementById('single-plant-photo-css')) return;
    var style = document.createElement('style');
    style.id = 'single-plant-photo-css';
    style.textContent = [
      '.modal #mPhotos,.modal .m-photos.modal-photos-removed{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '.modal #mPhotos *{display:none!important}',
      '.modal .m-info{padding-top:28px!important}',
      '.card-img{background:#e6eddf!important}',
      '.card-img .plant-emoji-big,.card-img .img-bg,.card-img .size-tabs{display:none!important}',
      '.card-img .real-photo.show{opacity:1!important}',
      '.card-img.no-real-photo{display:flex!important;align-items:center!important;justify-content:center!important;background:#e6eddf!important}',
      '.card-photo-empty{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#38513d;font-size:.9rem;font-weight:800;background:#e6eddf;z-index:2}',
      '.card-img.no-real-photo .real-photo{display:none!important}',
      '.m-slot,.m-slot-bg,.m-slot-real,.m-slot-loading,.m-slot-lbl,.slot-edit-btn{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  async function repairCard(id) {
    var p = byId(id);
    var img = document.getElementById('cimg-' + id);
    var loader = document.getElementById('cload-' + id);
    if (!p || !img) return;
    if (loader) loader.classList.add('show');
    var url = await resolve(p);
    if (loader) loader.classList.remove('show');
    showPhoto(img, url);
  }

  function repairCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) {
      repairCard(img.id.replace('cimg-', ''));
    });
  }

  function patchImageApi() {
    window.fetchWikiImg = function (name) {
      var p = plants().find(function (item) { return item.name === name; }) || { name: name };
      return resolve(p);
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

  function patchModal() {
    if (window.__singlePlantPhotoOpenM) return;
    var old = window.openM;
    if (typeof old !== 'function') return;
    window.__singlePlantPhotoOpenM = true;
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
    if (window.__singlePlantPhotoRender) return;
    var old = window.render;
    if (typeof old !== 'function') return;
    window.__singlePlantPhotoRender = true;
    window.render = function () {
      var result = old.apply(this, arguments);
      setTimeout(repairCards, 80);
      setTimeout(repairCards, 900);
      return result;
    };
  }

  function observe() {
    var area = document.getElementById('pa');
    if (!area || window.__singlePlantPhotoObserver) return;
    window.__singlePlantPhotoObserver = true;
    new MutationObserver(function () { setTimeout(repairCards, 100); }).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try { return typeof P !== 'undefined' && Array.isArray(P) && typeof window.openM === 'function'; }
    catch (e) { return false; }
  }

  var tries = 0;
  function boot() {
    cleanCache();
    installCss();
    hideModalPhotos();
    if (!ready()) {
      if (++tries < 240) setTimeout(boot, 100);
      return;
    }
    patchImageApi();
    patchModal();
    patchRender();
    observe();
    repairCards();
    setTimeout(repairCards, 1200);
    window.__singlePlantPhotoVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();