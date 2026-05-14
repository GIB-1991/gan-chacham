(function () {
  const VERSION = 'real-photo-fallbacks-20260514';
  const STAGES = ['small', 'medium', 'large'];
  const STAGE_LABELS = { small: 'צמח צעיר', medium: 'בן 3-4', large: 'צמח בוגר' };

  const PAGE_OVERRIDES = {
    'ערבה בוכיה': 'weeping willow', 'שסק': 'loquat', 'מנגו': 'mango', 'תאנה': 'fig tree', 'שמיר': 'dill',
    'לימון': 'lemon tree', 'לימון ננסי': 'lemon tree', 'ליים': 'lime tree', 'תפוז': 'orange tree', 'תפוז טבורי': 'orange tree',
    'אשכולית': 'grapefruit tree', 'קלמנטינה': 'clementine tree', 'פומלה': 'pomelo tree', 'אבוקדו': 'avocado tree',
    'רימון': 'pomegranate tree', 'זית': 'olive tree', 'ענב': 'grape vine', 'ענבים': 'grape vine', 'קיווי': 'kiwi vine',
    'פסיפלורה': 'passion fruit vine', 'פשיפלורה': 'passion fruit vine', 'נענע': 'mint plant', 'בזיליקום': 'basil plant',
    'רוזמרין': 'rosemary plant', 'מרווה': 'sage plant', 'לואיזה': 'lemon verbena plant', 'זוטה לבנה': 'micromeria plant',
    'תימין': 'thyme plant', 'אורגנו': 'oregano plant', 'פטרוזיליה': 'parsley plant', 'כוסברה': 'coriander plant',
    'עירית': 'chives plant', 'לבנדר': 'lavender plant', 'ורד': 'rose bush', 'בוגנוויליה': 'bougainvillea',
    'יסמין': 'jasmine plant', 'גרניום': 'geranium plant', 'בננה': 'banana plant', 'תמר': 'date palm',
    'חרוב': 'carob tree', 'שקד': 'almond tree', 'שזיף': 'plum tree', 'אפרסק': 'peach tree', 'משמש': 'apricot tree',
    'תפוח': 'apple tree', 'אגס': 'pear tree', 'תות שדה': 'strawberry plant', 'פטל': 'raspberry plant',
    'אוכמניות': 'blueberry bush', 'סברס': 'prickly pear cactus', 'אורן ירושלים': 'aleppo pine', 'ברוש': 'cypress tree',
    'ברוש מצוי': 'cypress tree', 'אקליפטוס': 'eucalyptus tree', 'הדס': 'myrtle plant', 'יוקה': 'yucca plant',
    'אלוורה': 'aloe vera plant', 'מונסטרה': 'monstera plant', 'סנסיווריה': 'snake plant', 'סחלב': 'orchid plant',
    'רקפת': 'cyclamen plant', 'כלנית': 'anemone flower', 'נרקיס': 'narcissus flower', 'צבעוני': 'tulip flower',
    'חמניה': 'sunflower plant', 'לנטנה': 'lantana plant', 'פטוניה': 'petunia plant', 'שעועית': 'bean plant',
    'כרישה': 'leek plant', 'מלפפון': 'cucumber plant', 'עגבנייה': 'tomato plant', 'פלפל': 'pepper plant',
    'חציל': 'eggplant plant', 'חסה': 'lettuce plant', 'קישוא': 'zucchini plant', 'אבטיח': 'watermelon plant', 'מלון': 'melon plant'
  };

  const QUERY_OVERRIDES = {
    'ערבה בוכיה': { small: ['weeping willow sapling', 'young willow tree'], medium: ['young weeping willow tree'], large: ['large mature weeping willow tree'] },
    'שסק': { small: ['loquat sapling'], medium: ['young loquat tree'], large: ['mature loquat fruit tree'] },
    'מנגו': { small: ['mango sapling'], medium: ['young mango tree'], large: ['mature mango fruit tree'] },
    'תאנה': { small: ['fig sapling'], medium: ['young fig tree'], large: ['mature fig fruit tree'] },
    'שמיר': { small: ['dill seedling'], medium: ['dill plant'], large: ['flowering dill plant'] }
  };

  function plants() { try { return typeof P !== 'undefined' && Array.isArray(P) ? P : []; } catch (e) { return []; } }
  function plantById(id) { return plants().find(p => String(p.id) === String(id)) || null; }
  function wikiInfo(name) { try { return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES?.[name] ? WIKI_PAGES[name] : {}; } catch (e) { return {}; } }
  function esc(value) { return String(value || '').replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[c])); }
  function cleanQuery(value) { return String(value || '').replace(/\([^)]*\)/g, '').replace(/[^a-zA-Z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function hash(value) { let h = 2166136261; for (let i = 0; i < String(value).length; i++) { h ^= String(value).charCodeAt(i); h = Math.imul(h, 16777619); } return Math.abs(h >>> 0); }

  function baseQuery(plant) {
    const info = wikiInfo(plant?.name);
    return cleanQuery(PAGE_OVERRIDES[plant?.name] || info.page || plant?.name || 'garden plant');
  }

  function isTreeLike(plant, base) {
    return plant?.type === 'fruit' || plant?.type === 'ornamental' || plant?.type === 'tropical' || /tree|palm|pine|cypress|willow|mango|fig|olive|apple|pear|plum|peach|apricot|orange|lemon|lime|avocado|pomegranate|loquat|eucalyptus/.test(base);
  }

  function stageQueries(plant, stage) {
    const override = QUERY_OVERRIDES[plant?.name]?.[stage] || [];
    const base = baseQuery(plant);
    const tree = isTreeLike(plant, base);
    const youngWord = tree ? 'sapling' : 'seedling';
    const mediumWord = tree ? 'young tree' : 'young plant';
    const largeWord = tree ? 'mature large tree' : 'mature flowering plant';
    const generic = stage === 'small'
      ? [`${base} ${youngWord}`, `young ${base}`, `${base} nursery plant`]
      : stage === 'medium'
        ? [`${base} ${mediumWord}`, `garden ${base}`, `${base} plant`]
        : [`${base} ${largeWord}`, `large ${base}`, `${base} fruit flower`];
    return [...override, ...generic].map(cleanQuery).filter(Boolean);
  }

  async function fetchJson(url) {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function commonsImage(query, avoid) {
    const cacheKey = `commons_${VERSION}_${query}`;
    try { if (typeof imgCache !== 'undefined' && imgCache[cacheKey] && !avoid.has(imgCache[cacheKey])) return imgCache[cacheKey]; } catch (e) {}
    try {
      const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=8&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const data = await fetchJson(searchUrl);
      const results = (data.query?.search || []).filter(r => !/logo|icon|map|diagram|drawing|herbarium/i.test(r.title || '')).slice(0, 5);
      for (const result of results) {
        const title = result.title?.startsWith('File:') ? result.title : `File:${result.title}`;
        const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
        const infoData = await fetchJson(infoUrl);
        const page = infoData.query?.pages ? Object.values(infoData.query.pages)[0] : null;
        const info = page?.imageinfo?.[0];
        const url = info?.thumburl || info?.url || null;
        if (url && /^image\/(jpeg|png|webp)/i.test(info?.mime || '') && !avoid.has(url)) {
          try { if (typeof imgCache !== 'undefined') imgCache[cacheKey] = url; } catch (e) {}
          return url;
        }
      }
    } catch (e) {}
    return null;
  }

  function photoFallback(plant, stage, avoid) {
    const query = stageQueries(plant, stage)[0] || 'garden plant';
    const tags = query.split(/\s+/).filter(Boolean).slice(0, 5).join(',');
    const lock = hash(`${plant?.name || query}-${stage}-${VERSION}`) % 999999;
    let url = `https://loremflickr.com/1200/800/${encodeURIComponent(tags)}?lock=${lock}`;
    while (avoid.has(url)) {
      url = `https://loremflickr.com/1200/800/${encodeURIComponent(tags)}?lock=${lock + avoid.size + 11}`;
    }
    return url;
  }

  async function resolveStage(plant, stage, used) {
    const avoid = used || new Set();
    const safeStage = STAGES.includes(stage) ? stage : 'medium';
    const cacheKey = `resolved_${VERSION}_${plant?.name}_${safeStage}`;
    const customKey = plant ? `custom_${plant.id}_${safeStage}` : null;
    try {
      if (customKey && typeof imgCache !== 'undefined' && imgCache[customKey] && !avoid.has(imgCache[customKey])) return imgCache[customKey];
      if (typeof imgCache !== 'undefined' && imgCache[cacheKey] && !avoid.has(imgCache[cacheKey])) return imgCache[cacheKey];
    } catch (e) {}

    let url = null;
    for (const query of stageQueries(plant, safeStage)) {
      url = await commonsImage(query, avoid);
      if (url) break;
    }
    if (!url) url = photoFallback(plant, safeStage, avoid);

    try {
      if (typeof imgCache !== 'undefined') {
        imgCache[cacheKey] = url;
        imgCache[`${plant?.name}__${safeStage}`] = url;
      }
    } catch (e) {}
    return url;
  }

  function showImage(img, url, plant, stage, used) {
    if (!img || !url) return;
    img.classList.remove('show');
    img.onload = () => img.classList.add('show');
    img.onerror = () => {
      const fallback = photoFallback(plant, stage, used || new Set());
      if (fallback !== img.src) {
        img.onerror = () => { img.classList.remove('show'); };
        img.onload = () => img.classList.add('show');
        img.src = fallback;
      }
    };
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function clearBadCache() {
    try {
      if (typeof imgCache === 'undefined') return;
      Object.keys(imgCache).forEach(key => {
        if (/resolved_|stage_|repair_|distinct/.test(key) || String(imgCache[key] || '').startsWith('data:image/svg')) delete imgCache[key];
      });
    } catch (e) {}
  }

  function installCss() {
    if (document.getElementById('real-photo-stage-css')) return;
    const style = document.createElement('style');
    style.id = 'real-photo-stage-css';
    style.textContent = `.m-photos.stage-gallery{height:310px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b}.m-photos.stage-gallery .m-slot{min-width:0;isolation:isolate}.m-photos.stage-gallery .m-slot-real{filter:saturate(1.04) contrast(1.03)}.m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important}.m-photos.stage-gallery .m-slot-lbl small{display:block;margin-top:3px;font-size:.68rem;line-height:1.18;font-weight:500!important;opacity:.92!important}.m-photos.stage-gallery .slot-lbl{display:none!important}.m-photos.stage-gallery .slot-emoji{display:none!important}.real-photo.show,.m-slot-real.show{background:#eef2e6}@media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px}}`;
    document.head.appendChild(style);
  }

  function labelModal(plant) {
    const photos = document.getElementById('mPhotos');
    if (photos) photos.classList.add('stage-gallery');
    STAGES.forEach(stage => {
      const slot = document.getElementById(`mslot-${stage}`);
      const label = slot?.querySelector('.m-slot-lbl');
      const bgLabel = slot?.querySelector('.slot-lbl');
      const detail = plant?.sizes?.[stage] || '';
      if (label) label.innerHTML = `${STAGE_LABELS[stage]}${detail ? `<br><small>${esc(detail)}</small>` : ''}`;
      if (bgLabel) bgLabel.textContent = STAGE_LABELS[stage];
    });
  }

  async function repairModal(plant) {
    if (!plant) return;
    labelModal(plant);
    const used = new Set();
    for (const stage of STAGES) {
      const img = document.getElementById(`mimg-${stage}`);
      const loader = document.getElementById(`mload-${stage}`);
      if (!img) continue;
      if (loader) loader.classList.add('show');
      const url = await resolveStage(plant, stage, used);
      used.add(url);
      if (loader) loader.classList.remove('show');
      showImage(img, url, plant, stage, used);
    }
  }

  function repairCard(id, stage) {
    const plant = plantById(id);
    const img = document.getElementById(`cimg-${id}`);
    const loader = document.getElementById(`cload-${id}`);
    if (!plant || !img) return;
    if (loader) loader.classList.add('show');
    resolveStage(plant, stage || 'medium', new Set()).then(url => {
      if (loader) loader.classList.remove('show');
      showImage(img, url, plant, stage || 'medium', new Set());
    });
  }

  function repairCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(img => repairCard(img.id.replace('cimg-', ''), 'medium'));
  }

  function patchGlobals() {
    window.fetchWikiImg = (plantName, stage) => resolveStage(plants().find(p => p.name === plantName) || { name: plantName }, stage || 'medium', new Set());
    window.tryLoadImg = (id, stage, onSuccess, onFail) => {
      const plant = plantById(id);
      if (!plant) { if (onFail) onFail(); return; }
      resolveStage(plant, stage || 'medium', new Set()).then(url => onSuccess ? onSuccess(url) : null).catch(() => onSuccess ? onSuccess(photoFallback(plant, stage || 'medium', new Set())) : (onFail && onFail()));
    };
    window.loadCardImg = (id, stage) => repairCard(id, stage || 'medium');
  }

  function patchModal() {
    if (window.__realPhotoStageOpenM) return;
    const previous = window.openM;
    if (typeof previous !== 'function') return;
    window.__realPhotoStageOpenM = true;
    window.openM = async function realPhotoStageOpenM(id) {
      const result = await previous.apply(this, arguments);
      setTimeout(() => repairModal(plantById(id)), 60);
      return result;
    };
  }

  function patchRender() {
    if (window.__realPhotoStageRender) return;
    const previous = window.render;
    if (typeof previous !== 'function') return;
    window.__realPhotoStageRender = true;
    window.render = function realPhotoStageRender() {
      const result = previous.apply(this, arguments);
      setTimeout(repairCards, 80);
      setTimeout(repairCards, 900);
      return result;
    };
  }

  function observeCards() {
    const area = document.getElementById('pa');
    if (!area || window.__realPhotoStageObserver) return;
    window.__realPhotoStageObserver = true;
    new MutationObserver(() => setTimeout(repairCards, 100)).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try { return typeof P !== 'undefined' && Array.isArray(P) && typeof imgCache !== 'undefined' && typeof window.openM === 'function'; }
    catch (e) { return false; }
  }

  let tries = 0;
  function boot() {
    if (!ready()) { if (++tries < 180) setTimeout(boot, 100); return; }
    clearBadCache();
    installCss();
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
