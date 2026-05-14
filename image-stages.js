(function () {
  const VERSION = 'distinct-growth-stages-20260513';
  const STAGES = ['small', 'medium', 'large'];
  const STAGE_LABELS = { small: 'צמח צעיר', medium: 'בן 3-4', large: 'צמח בוגר' };
  const STAGE_WORDS = {
    small: ['seedling', 'sapling', 'young', 'juvenile', 'nursery', 'potted'],
    medium: ['young', 'small', 'garden', 'tree', 'plant', 'shrub'],
    large: ['large', 'mature', 'old', 'tree', 'orchard', 'full', 'fruit']
  };

  const PAGE_OVERRIDES = {
    'ערבה בוכיה': 'Salix babylonica', 'שסק': 'Eriobotrya japonica', 'מנגו': 'Mangifera indica',
    'תאנה': 'Ficus carica', 'שמיר': 'Dill', 'לימון': 'Lemon', 'לימון ננסי': 'Lemon', 'ליים': 'Key lime',
    'תפוז': 'Orange (fruit)', 'תפוז טבורי': 'Navel orange', 'אשכולית': 'Grapefruit', 'קלמנטינה': 'Clementine',
    'פומלה': 'Pomelo', 'אבוקדו': 'Avocado', 'רימון': 'Pomegranate', 'זית': 'Olive', 'ענב': 'Vitis vinifera',
    'ענבים': 'Vitis vinifera', 'קיווי': 'Kiwifruit', 'פסיפלורה': 'Passiflora edulis', 'פשיפלורה': 'Passiflora edulis',
    'נענע': 'Mentha', 'בזיליקום': 'Basil', 'רוזמרין': 'Salvia rosmarinus', 'מרווה': 'Salvia officinalis',
    'לואיזה': 'Aloysia citrodora', 'זוטה לבנה': 'Micromeria fruticosa', 'תימין': 'Thyme', 'אורגנו': 'Oregano',
    'פטרוזיליה': 'Parsley', 'כוסברה': 'Coriander', 'עירית': 'Chives', 'לבנדר': 'Lavandula', 'ורד': 'Rose',
    'בוגנוויליה': 'Bougainvillea', 'יסמין': 'Jasminum', 'גרניום': 'Pelargonium', 'בננה': 'Banana',
    'תמר': 'Phoenix dactylifera', 'חרוב': 'Ceratonia siliqua', 'שקד': 'Almond', 'שזיף': 'Plum',
    'אפרסק': 'Peach', 'משמש': 'Apricot', 'תפוח': 'Apple', 'אגס': 'Pear', 'תות שדה': 'Strawberry',
    'פטל': 'Rubus idaeus', 'אוכמניות': 'Blueberry', 'סברס': 'Opuntia ficus-indica',
    'אורן ירושלים': 'Pinus halepensis', 'ברוש': 'Cupressus sempervirens', 'ברוש מצוי': 'Cupressus sempervirens',
    'אקליפטוס': 'Eucalyptus', 'הדס': 'Myrtus communis', 'יוקה': 'Yucca', 'אלוורה': 'Aloe vera',
    'מונסטרה': 'Monstera deliciosa', 'סנסיווריה': 'Dracaena trifasciata', 'סחלב': 'Orchidaceae',
    'רקפת': 'Cyclamen persicum', 'כלנית': 'Anemone coronaria', 'נרקיס': 'Narcissus', 'צבעוני': 'Tulip',
    'חמניה': 'Sunflower', 'לנטנה': 'Lantana camara', 'פטוניה': 'Petunia', 'שעועית': 'Common bean',
    'כרישה': 'Leek', 'מלפפון': 'Cucumber', 'עגבנייה': 'Tomato', 'פלפל': 'Bell pepper', 'חציל': 'Eggplant',
    'חסה': 'Lettuce', 'קישוא': 'Zucchini', 'אבטיח': 'Watermelon', 'מלון': 'Melon'
  };

  const QUERY_OVERRIDES = {
    'ערבה בוכיה': {
      small: ['willow sapling', 'Salix sapling', 'young willow tree', 'Salix babylonica sapling'],
      medium: ['young weeping willow tree', 'small weeping willow tree', 'Salix babylonica young tree'],
      large: ['large weeping willow tree', 'mature weeping willow tree', 'Salix babylonica mature tree']
    },
    'שסק': {
      reject: ['citrus', 'lime', 'lemon', 'orange', 'grapefruit'],
      small: ['loquat sapling', 'Eriobotrya japonica seedling', 'young loquat plant'],
      medium: ['young loquat tree', 'Eriobotrya japonica young tree', 'loquat tree garden'],
      large: ['loquat fruit tree', 'Eriobotrya japonica fruits tree', 'mature loquat tree']
    },
    'מנגו': {
      small: ['mango sapling', 'Mangifera indica seedling'],
      medium: ['young mango tree', 'Mangifera indica young tree'],
      large: ['mature mango tree fruit', 'mango orchard tree']
    },
    'תאנה': {
      small: ['fig sapling', 'Ficus carica sapling'],
      medium: ['young fig tree', 'Ficus carica young tree'],
      large: ['mature fig tree fruit', 'Ficus carica fruit tree']
    },
    'שמיר': {
      reject: ['tree'],
      small: ['dill seedling', 'Anethum graveolens seedling'],
      medium: ['young dill plant', 'Anethum graveolens plant'],
      large: ['dill flower umbels', 'Anethum graveolens mature plant']
    }
  };

  const GLOBAL_REJECT = ['logo', 'icon', 'map', 'diagram', 'drawing', 'illustration', 'herbarium', 'distribution', 'range map', 'coat of arms'];
  const CITRUS_WORDS = ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'pomelo', 'clementine'];

  function normalize(value) { return String(value || '').toLowerCase().replace(/[_-]+/g, ' '); }
  function uniq(values) { return Array.from(new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean))); }
  function esc(value) { return String(value || '').replace(/[<>&"']/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[c])); }

  function plants() { try { return typeof P !== 'undefined' && Array.isArray(P) ? P : []; } catch (e) { return []; } }
  function plantById(id) { return plants().find(p => String(p.id) === String(id)) || null; }
  function wikiInfo(name) { try { return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES?.[name] ? WIKI_PAGES[name] : {}; } catch (e) { return {}; } }

  function isCitrus(plant, page) {
    return plant?.bg === 'citrus' || /לימון|ליים|תפוז|אשכולית|קלמנטינה|פומלה|citrus|lemon|lime|orange|grapefruit|pomelo|clementine/i.test(`${plant?.name || ''} ${page || ''}`);
  }

  function profile(plantOrName) {
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const name = plant?.name || plantOrName;
    const info = wikiInfo(name);
    const page = PAGE_OVERRIDES[name] || info.page || name;
    const override = QUERY_OVERRIDES[name] || {};
    const kind = plant?.type === 'bush' ? 'plant' : plant?.type === 'lawn' ? 'grass' : 'tree';
    const pageTokens = normalize(page).split(/\s+/).filter(t => t.length > 3 && !['tree', 'plant', 'fruit'].includes(t));
    const reject = uniq([...(override.reject || []), ...(isCitrus(plant, page) ? [] : CITRUS_WORDS)]);
    const must = uniq([...(override.must || []), ...pageTokens]);

    return {
      plant, name, page, kind, must, reject,
      queries: {
        small: uniq([...(override.small || []), info.small, `${page} sapling`, `${page} seedling`, `young ${page} plant`, `${kind} sapling`]),
        medium: uniq([...(override.medium || []), `${page} young ${kind}`, `young ${page}`, `${page} garden ${kind}`, `small ${page} tree`]),
        large: uniq([...(override.large || []), info.large, `large ${page} ${kind}`, `mature ${page} ${kind}`, `${page} orchard`, `${page} fruit tree`])
      }
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  function scoreTitle(titleRaw, prof, stage) {
    const title = normalize(titleRaw).replace(/^file:/, '');
    if (GLOBAL_REJECT.some(w => title.includes(w))) return -100;
    if ((prof.reject || []).some(w => title.includes(normalize(w)))) return -90;

    let score = 0;
    const hits = (prof.must || []).filter(w => title.includes(normalize(w))).length;
    score += hits * 26;
    if ((prof.must || []).length && hits === 0) score -= 5;
    if (/\.jpe?g|\.png|\.webp/.test(title)) score += 5;
    if (/tree|plant|shrub|leaf|fruit|flower|sapling|seedling|garden|orchard/.test(title)) score += 8;
    for (const word of STAGE_WORDS[stage] || []) if (title.includes(word)) score += 16;

    if (stage === 'small' && /mature|old|large|orchard/.test(title)) score -= 18;
    if (stage === 'medium' && /seedling|ancient|very old/.test(title)) score -= 10;
    if (stage === 'large' && /seedling|sapling|young/.test(title)) score -= 18;
    return score;
  }

  async function imageInfo(title) {
    try {
      const fileTitle = title.startsWith('File:') ? title : `File:${title}`;
      const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
      const data = await fetchJson(api);
      const page = data.query?.pages ? Object.values(data.query.pages)[0] : null;
      const info = page?.imageinfo?.[0];
      if (!info || !/^image\/(jpeg|png|webp)/i.test(info.mime || '')) return null;
      return info.thumburl || info.url || null;
    } catch (e) { return null; }
  }

  async function commonsSearch(query, prof, stage, avoid) {
    const cacheKey = `stage_commons_${VERSION}_${query}_${stage}`;
    let cached = null;
    try { cached = typeof imgCache !== 'undefined' ? imgCache[cacheKey] : null; } catch (e) {}
    if (cached && !avoid.has(cached)) return cached;

    try {
      const api = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=18&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const data = await fetchJson(api);
      const ranked = (data.query?.search || [])
        .map(r => ({ title: r.title || '', score: scoreTitle(r.title || '', prof, stage) }))
        .filter(r => r.score > -35)
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);

      for (const row of ranked) {
        const url = await imageInfo(row.title);
        if (url && !avoid.has(url)) {
          try { if (typeof imgCache !== 'undefined') imgCache[cacheKey] = url; } catch (e) {}
          return url;
        }
      }
    } catch (e) {}
    return null;
  }

  async function wikiThumb(page, avoid) {
    try {
      const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&pithumbsize=1200&format=json&origin=*`;
      const data = await fetchJson(api);
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      const url = pages[0]?.thumbnail?.source || null;
      return url && !avoid.has(url) ? url : null;
    } catch (e) { return null; }
  }

  function placeholder(plant, stage) {
    const bg = plant?.bg === 'citrus' ? '#d59b2d' : plant?.type === 'tropical' ? '#1f7a55' : plant?.type === 'bush' ? '#6f8b43' : plant?.type === 'ornamental' ? '#6a4fb3' : '#557a45';
    const name = plant?.name || 'צמח';
    const detail = plant?.sizes?.[stage] || '';
    const scale = stage === 'small' ? '62' : stage === 'medium' ? '94' : '142';
    const ground = stage === 'small' ? '650' : stage === 'medium' ? '610' : '565';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#f3f6e8"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><rect y="${ground}" width="1200" height="260" fill="rgba(34,64,42,.22)"/><text x="600" y="${Number(ground)-70}" text-anchor="middle" font-size="${scale}" font-family="Arial, sans-serif">🌿</text><text x="600" y="690" text-anchor="middle" direction="rtl" font-size="54" font-weight="700" font-family="Arial, sans-serif" fill="#17251b">${esc(name)}</text><text x="600" y="748" text-anchor="middle" direction="rtl" font-size="34" font-family="Arial, sans-serif" fill="#274432">${esc(STAGE_LABELS[stage])}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  async function resolveStage(plantOrName, stage, used) {
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const name = plant?.name || plantOrName;
    const safeStage = STAGES.includes(stage) ? stage : 'medium';
    const avoid = used || new Set();
    const customKey = plant ? `custom_${plant.id}_${safeStage}` : null;
    const cacheKey = `resolved_${VERSION}_${name}_${safeStage}`;

    try {
      if (customKey && typeof imgCache !== 'undefined' && imgCache[customKey] && !avoid.has(imgCache[customKey])) return imgCache[customKey];
      if (typeof imgCache !== 'undefined' && imgCache[cacheKey] && !avoid.has(imgCache[cacheKey])) return imgCache[cacheKey];
    } catch (e) {}

    const prof = profile(plant || name);
    let url = null;
    for (const query of prof.queries[safeStage] || []) {
      url = await commonsSearch(query, prof, safeStage, avoid);
      if (url) break;
    }

    if (!url && safeStage === 'medium') url = await wikiThumb(prof.page, avoid);
    if (!url) url = placeholder(plant || { name }, safeStage);

    try {
      if (typeof imgCache !== 'undefined') {
        imgCache[cacheKey] = url;
        imgCache[`${name}__${safeStage}`] = url;
      }
    } catch (e) {}
    return url;
  }

  function showImage(img, url) {
    if (!img || !url) return;
    img.classList.remove('show');
    img.onload = () => img.classList.add('show');
    img.onerror = () => img.classList.remove('show');
    img.src = url;
    if (url.startsWith('data:') || (img.complete && img.naturalWidth > 0)) img.classList.add('show');
  }

  function installCss() {
    if (document.getElementById('growth-stage-css')) return;
    const style = document.createElement('style');
    style.id = 'growth-stage-css';
    style.textContent = `.m-photos.stage-gallery{height:300px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b}.m-photos.stage-gallery .m-slot{min-width:0;isolation:isolate}.m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important}.m-photos.stage-gallery .m-slot-lbl small{display:block;margin-top:3px;font-size:.68rem;line-height:1.18;font-weight:500!important;opacity:.92!important}.m-photos.stage-gallery .slot-lbl{display:none!important}.m-photos.stage-gallery .slot-emoji{opacity:.2}.real-photo.show,.m-slot-real.show{background:#eef2e6}@media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px}}`;
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
      try {
        const url = await resolveStage(plant, stage, used);
        used.add(url);
        if (loader) loader.classList.remove('show');
        showImage(img, url);
      } catch (e) {
        if (loader) loader.classList.remove('show');
        const fallback = placeholder(plant, stage);
        used.add(fallback);
        showImage(img, fallback);
      }
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
      showImage(img, url);
    }).catch(() => {
      if (loader) loader.classList.remove('show');
      showImage(img, placeholder(plant, stage || 'medium'));
    });
  }

  function repairCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(img => repairCard(img.id.replace('cimg-', ''), 'medium'));
  }

  function patchGlobals() {
    window.fetchWikiImg = (plantName, stage) => resolveStage(plants().find(p => p.name === plantName) || plantName, stage || 'medium', new Set());
    window.tryLoadImg = (id, stage, onSuccess, onFail) => {
      const plant = plantById(id);
      if (!plant) { if (onFail) onFail(); return; }
      resolveStage(plant, stage || 'medium', new Set()).then(url => onSuccess ? onSuccess(url) : null).catch(() => onSuccess ? onSuccess(placeholder(plant, stage || 'medium')) : (onFail && onFail()));
    };
    window.loadCardImg = (id, stage) => repairCard(id, stage || 'medium');
  }

  function patchModal() {
    if (window.__distinctGrowthOpenM) return;
    const previous = window.openM;
    if (typeof previous !== 'function') return;
    window.__distinctGrowthOpenM = true;
    window.openM = async function distinctGrowthOpenM(id) {
      const result = await previous.apply(this, arguments);
      setTimeout(() => repairModal(plantById(id)), 60);
      return result;
    };
  }

  function patchRender() {
    if (window.__distinctGrowthRender) return;
    const previous = window.render;
    if (typeof previous !== 'function') return;
    window.__distinctGrowthRender = true;
    window.render = function distinctGrowthRender() {
      const result = previous.apply(this, arguments);
      setTimeout(repairCards, 100);
      setTimeout(repairCards, 800);
      return result;
    };
  }

  function observeCards() {
    const area = document.getElementById('pa');
    if (!area || window.__distinctGrowthObserver) return;
    window.__distinctGrowthObserver = true;
    new MutationObserver(() => setTimeout(repairCards, 100)).observe(area, { childList: true, subtree: true });
  }

  function ready() {
    try { return typeof P !== 'undefined' && Array.isArray(P) && typeof imgCache !== 'undefined' && typeof window.openM === 'function'; }
    catch (e) { return false; }
  }

  let tries = 0;
  function boot() {
    if (!ready()) { if (++tries < 180) setTimeout(boot, 100); return; }
    installCss();
    patchGlobals();
    patchModal();
    patchRender();
    observeCards();
    repairCards();
    setTimeout(repairCards, 1200);
    window.__distinctGrowthStagesVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
