(function () {
  const VERSION = 'safe-botanical-no-random-20260518';
  const STAGES = ['small', 'medium', 'large'];
  const STAGE_LABELS = { small: 'צמח צעיר', medium: 'בן 3-4', large: 'צמח בוגר' };

  const PAGE_OVERRIDES = {
    'ערבה בוכיה': 'Salix babylonica',
    'ערבה בוכייה': 'Salix babylonica',
    'מנגו': 'Mangifera indica',
    'תאנה': 'Ficus carica',
    'שמיר': 'Anethum graveolens',
    'שסק': 'Eriobotrya japonica',
    'לימון': 'Citrus limon',
    'לימון ננסי': 'Citrus limon',
    'תפוז': 'Orange (fruit)',
    'תפוז טבורי': 'Orange (fruit)',
    'אבוקדו': 'Avocado',
    'רימון': 'Pomegranate',
    'זית': 'Olive',
    'נענע': 'Mentha',
    'בזיליקום': 'Basil',
    'רוזמרין': 'Salvia rosmarinus',
    'לבנדר': 'Lavandula',
    'בננה': 'Banana',
    'תמר': 'Date palm',
    'חרוב': 'Ceratonia siliqua',
    'שקד': 'Almond',
    'אפרסק': 'Peach',
    'תפוח': 'Apple',
    'אגס': 'Pear',
    'אורן ירושלים': 'Pinus halepensis',
    'ברוש': 'Cupressus sempervirens',
    'אקליפטוס': 'Eucalyptus',
    'יוקה': 'Yucca',
    'אלוורה': 'Aloe vera',
    'מונסטרה': 'Monstera deliciosa',
    'כלנית': 'Anemone coronaria',
    'נרקיס': 'Narcissus',
    'חמניה': 'Helianthus annuus',
    'עגבנייה': 'Tomato',
    'מלפפון': 'Cucumber',
    'פלפל': 'Capsicum annuum',
    'חציל': 'Eggplant'
  };

  const BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|cat|kitten|defaultImage|logo|icon|map|diagram|symbol/i;
  const SAFE_HOST = /(^data:image\/(png|jpe?g|webp);)|upload\.wikimedia\.org|wikipedia\.org/i;

  function plants() {
    try { return typeof P !== 'undefined' && Array.isArray(P) ? P : []; }
    catch (e) { return []; }
  }

  function plantById(id) {
    return plants().find(p => String(p.id) === String(id)) || null;
  }

  function wikiInfo(name) {
    try { return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES && WIKI_PAGES[name] ? WIKI_PAGES[name] : {}; }
    catch (e) { return {}; }
  }

  function safeUrl(url) {
    const value = String(url || '');
    return !!value && !BAD_URL.test(value) && SAFE_HOST.test(value);
  }

  function pageFor(plantName) {
    const info = wikiInfo(plantName);
    return PAGE_OVERRIDES[plantName] || info.page || plantName || 'Plant';
  }

  function esc(value) {
    return String(value || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function placeholder(plant, stage) {
    const label = STAGE_LABELS[stage] || '';
    const name = esc(plant && plant.name ? plant.name : 'צמח');
    const bg1 = stage === 'small' ? '#d9ead3' : stage === 'large' ? '#b7cfaa' : '#c9ddbd';
    const bg2 = stage === 'small' ? '#f7fbf2' : stage === 'large' ? '#edf4e4' : '#f3f8ed';
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop stop-color="${bg1}" offset="0"/>
            <stop stop-color="${bg2}" offset="1"/>
          </linearGradient>
        </defs>
        <rect width="1200" height="800" fill="url(#g)"/>
        <circle cx="600" cy="350" r="120" fill="#ffffff" opacity=".72"/>
        <path d="M610 475c-5-92 13-166 76-230-92 38-141 94-162 181-24-62-70-106-145-133 53 50 83 107 92 182h139z" fill="#2f6b3f" opacity=".9"/>
        <text x="600" y="615" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="700" fill="#173f25">${name}</text>
        <text x="600" y="680" direction="rtl" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#42604b">${esc(label)}</text>
      </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function cleanBadCache() {
    try {
      if (typeof imgCache !== 'undefined') {
        Object.keys(imgCache).forEach(key => {
          const value = imgCache[key];
          if (!value || BAD_URL.test(String(value)) || /^resolved_|^commons_|^wc__|^wp__|real-photo-fallbacks|botanical-photos|force-real-photos/.test(key)) {
            delete imgCache[key];
          }
        });
      }
    } catch (e) {}

    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        const raw = localStorage.getItem(key);
        if (!raw || !BAD_URL.test(raw)) continue;
        if (/image|photo|img|gan_chacham_local_images/i.test(key)) localStorage.removeItem(key);
      }
    } catch (e) {}
  }

  async function wikiMainImage(pageName) {
    const cacheKey = `safe_wp_${VERSION}_${pageName}`;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
    } catch (e) {}

    let url = null;
    try {
      const endpoint = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageName)}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const res = await fetch(endpoint, { cache: 'force-cache' });
      if (res.ok) {
        const data = await res.json();
        const page = data.query && data.query.pages ? Object.values(data.query.pages)[0] : null;
        const candidate = page && page.thumbnail && page.thumbnail.source;
        if (safeUrl(candidate)) url = candidate;
      }
    } catch (e) {}

    try { if (typeof imgCache !== 'undefined') imgCache[cacheKey] = url; } catch (e) {}
    return url;
  }

  async function resolveStage(plant, stage) {
    const safeStage = STAGES.includes(stage) ? stage : 'medium';
    const customKey = plant ? `custom_${plant.id}_${safeStage}` : null;
    const directKey = plant ? `${plant.name}__${safeStage}` : null;

    try {
      const custom = customKey && typeof imgCache !== 'undefined' ? imgCache[customKey] : null;
      if (safeUrl(custom)) return custom;
      if (custom && !safeUrl(custom) && typeof imgCache !== 'undefined') delete imgCache[customKey];

      const direct = directKey && typeof imgCache !== 'undefined' ? imgCache[directKey] : null;
      if (safeUrl(direct)) return direct;
      if (direct && !safeUrl(direct) && typeof imgCache !== 'undefined') delete imgCache[directKey];
    } catch (e) {}

    const pageUrl = await wikiMainImage(pageFor(plant && plant.name));
    const url = pageUrl || placeholder(plant, safeStage);

    try {
      if (typeof imgCache !== 'undefined' && directKey) imgCache[directKey] = url;
    } catch (e) {}

    return url;
  }

  function showImage(img, url) {
    if (!img || !url) return;
    img.classList.remove('show');
    img.onload = () => img.classList.add('show');
    img.onerror = () => img.classList.remove('show');
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function installCss() {
    if (document.getElementById('safe-botanical-image-css')) return;
    const style = document.createElement('style');
    style.id = 'safe-botanical-image-css';
    style.textContent = [
      '.real-photo.show,.m-slot-real.show{opacity:1!important}',
      '.card-img:has(.real-photo.show) .plant-emoji-big,.m-slot:has(.m-slot-real.show) .slot-emoji{display:none!important}',
      '.m-photos.stage-gallery{height:310px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b}',
      '.m-photos.stage-gallery .m-slot{min-width:0;isolation:isolate}',
      '.m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important}',
      '.m-photos.stage-gallery .m-slot-lbl small{display:block;margin-top:3px;font-size:.68rem;line-height:1.18;font-weight:500!important;opacity:.92!important}',
      '@media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px!important}}'
    ].join('');
    document.head.appendChild(style);
  }

  function labelModal(plant) {
    const photos = document.getElementById('mPhotos');
    if (photos) photos.classList.add('stage-gallery');
    STAGES.forEach(stage => {
      const slot = document.getElementById(`mslot-${stage}`);
      const label = slot && slot.querySelector('.m-slot-lbl');
      const detail = plant && plant.sizes && plant.sizes[stage] ? plant.sizes[stage] : '';
      if (label) label.innerHTML = STAGE_LABELS[stage] + (detail ? `<br><small>${esc(detail)}</small>` : '');
    });
  }

  async function repairCard(id, stage) {
    const plant = plantById(id);
    const img = document.getElementById(`cimg-${id}`);
    const loader = document.getElementById(`cload-${id}`);
    if (!plant || !img) return;
    if (loader) loader.classList.add('show');
    const url = await resolveStage(plant, stage || 'medium');
    if (loader) loader.classList.remove('show');
    showImage(img, url);
  }

  function repairCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(img => {
      repairCard(img.id.replace('cimg-', ''), 'medium');
    });
  }

  async function repairModal(plant) {
    if (!plant) return;
    labelModal(plant);
    for (const stage of STAGES) {
      const img = document.getElementById(`mimg-${stage}`);
      const loader = document.getElementById(`mload-${stage}`);
      if (!img) continue;
      if (loader) loader.classList.add('show');
      const url = await resolveStage(plant, stage);
      if (loader) loader.classList.remove('show');
      showImage(img, url);
    }
  }

  function patchGlobals() {
    window.fetchWikiImg = function safeFetchWikiImg(plantName, stage) {
      const plant = plants().find(p => p.name === plantName) || { name: plantName };
      return resolveStage(plant, stage || 'medium');
    };
    window.tryLoadImg = function safeTryLoadImg(id, stage, onSuccess, onFail) {
      const plant = plantById(id);
      if (!plant) { if (onFail) onFail(); return; }
      resolveStage(plant, stage || 'medium').then(url => {
        if (onSuccess) onSuccess(url);
      }).catch(() => {
        if (onSuccess) onSuccess(placeholder(plant, stage || 'medium'));
        else if (onFail) onFail();
      });
    };
    window.loadCardImg = function safeLoadCardImg(id, stage) {
      repairCard(id, stage || 'medium');
    };
  }

  function patchModal() {
    if (window.__safeBotanicalOpenM) return;
    const previous = window.openM;
    if (typeof previous !== 'function') return;
    window.__safeBotanicalOpenM = true;
    window.openM = async function safeBotanicalOpenM(id) {
      const result = await previous.apply(this, arguments);
      setTimeout(() => repairModal(plantById(id)), 50);
      setTimeout(() => repairModal(plantById(id)), 650);
      return result;
    };
  }

  function patchRender() {
    if (window.__safeBotanicalRender) return;
    const previous = window.render;
    if (typeof previous !== 'function') return;
    window.__safeBotanicalRender = true;
    window.render = function safeBotanicalRender() {
      const result = previous.apply(this, arguments);
      setTimeout(repairCards, 80);
      setTimeout(repairCards, 800);
      return result;
    };
  }

  function observeCards() {
    const area = document.getElementById('pa');
    if (!area || window.__safeBotanicalObserver) return;
    window.__safeBotanicalObserver = true;
    new MutationObserver(() => setTimeout(repairCards, 100)).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try {
      return typeof P !== 'undefined' && Array.isArray(P) && typeof imgCache !== 'undefined' && typeof window.openM === 'function';
    } catch (e) {
      return false;
    }
  }

  let tries = 0;
  function boot() {
    cleanBadCache();
    installCss();
    if (!ready()) {
      if (++tries < 240) setTimeout(boot, 100);
      return;
    }
    patchGlobals();
    patchModal();
    patchRender();
    observeCards();
    repairCards();
    setTimeout(repairCards, 1200);
    window.__realPhotoStageVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();