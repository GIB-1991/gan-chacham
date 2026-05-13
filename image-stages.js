(function () {
  const PATCH_VERSION = 'plant-stage-photos-20260513';
  const STAGES = ['small', 'medium', 'large'];
  const STAGE_LABELS = {
    small: 'צמח צעיר',
    medium: 'בן 3-4',
    large: 'צמח בוגר'
  };

  const PAGE_OVERRIDES = {
    'שסק': 'Eriobotrya japonica',
    'מנגו': 'Mangifera indica',
    'תאנה': 'Ficus carica',
    'שמיר': 'Dill',
    'ערבה בוכיה': 'Salix babylonica',
    'לימון': 'Lemon',
    'לימון ננסי': 'Lemon',
    'ליים': 'Key lime',
    'תפוז': 'Orange (fruit)',
    'תפוז טבורי': 'Navel orange',
    'אשכולית': 'Grapefruit',
    'קלמנטינה': 'Clementine',
    'פומלה': 'Pomelo',
    'אבוקדו': 'Avocado',
    'רימון': 'Pomegranate',
    'זית': 'Olive',
    'ענב': 'Vitis vinifera',
    'ענבים': 'Vitis vinifera',
    'קיווי': 'Kiwifruit',
    'פסיפלורה': 'Passiflora edulis',
    'פשיפלורה': 'Passiflora edulis',
    'נענע': 'Mentha',
    'בזיליקום': 'Basil',
    'רוזמרין': 'Salvia rosmarinus',
    'מרווה': 'Salvia officinalis',
    'לואיזה': 'Aloysia citrodora',
    'זוטה לבנה': 'Micromeria fruticosa',
    'תימין': 'Thyme',
    'אורגנו': 'Oregano',
    'פטרוזיליה': 'Parsley',
    'כוסברה': 'Coriander',
    'עירית': 'Chives',
    'לבנדר': 'Lavandula',
    'ורד': 'Rose',
    'בוגנוויליה': 'Bougainvillea',
    'יסמין': 'Jasminum',
    'גרניום': 'Pelargonium',
    'בננה': 'Banana',
    'תמר': 'Phoenix dactylifera',
    'חרוב': 'Ceratonia siliqua',
    'שקד': 'Almond',
    'שזיף': 'Plum',
    'אפרסק': 'Peach',
    'משמש': 'Apricot',
    'תפוח': 'Apple',
    'אגס': 'Pear',
    'תות שדה': 'Strawberry',
    'פטל': 'Rubus idaeus',
    'אוכמניות': 'Blueberry',
    'סברס': 'Opuntia ficus-indica',
    'אורן ירושלים': 'Pinus halepensis',
    'ברוש': 'Cupressus sempervirens',
    'אקליפטוס': 'Eucalyptus',
    'הדס': 'Myrtus communis',
    'יוקה': 'Yucca',
    'אלוורה': 'Aloe vera',
    'מונסטרה': 'Monstera deliciosa',
    'סנסיווריה': 'Dracaena trifasciata',
    'סחלב': 'Orchidaceae',
    'רקפת': 'Cyclamen persicum',
    'כלנית': 'Anemone coronaria',
    'נרקיס': 'Narcissus',
    'צבעוני': 'Tulip',
    'חמניה': 'Sunflower',
    'לנטנה': 'Lantana camara',
    'פטוניה': 'Petunia'
  };

  const QUERY_OVERRIDES = {
    'שסק': {
      must: ['eriobotrya', 'loquat', 'japonica'],
      reject: ['citrus', 'lime', 'lemon', 'orange', 'grapefruit'],
      small: ['Eriobotrya japonica seedling', 'loquat sapling young tree'],
      medium: ['young loquat tree Eriobotrya japonica', 'Eriobotrya japonica tree'],
      large: ['Eriobotrya japonica fruits tree', 'loquat fruit tree']
    },
    'מנגו': {
      must: ['mango', 'mangifera'],
      small: ['Mangifera indica seedling', 'mango sapling'],
      medium: ['young mango tree Mangifera indica', 'Mangifera indica tree'],
      large: ['mango tree fruits Mangifera indica']
    },
    'תאנה': {
      must: ['ficus', 'fig', 'carica'],
      small: ['Ficus carica young tree', 'fig sapling'],
      medium: ['Ficus carica tree', 'young fig tree'],
      large: ['fig tree fruit Ficus carica']
    },
    'שמיר': {
      must: ['dill', 'anethum'],
      reject: ['tree'],
      small: ['Anethum graveolens seedling', 'dill seedling'],
      medium: ['dill plant Anethum graveolens', 'young dill plant'],
      large: ['Anethum graveolens flower umbels', 'dill mature plant']
    },
    'ערבה בוכיה': {
      must: ['salix', 'willow', 'babylonica'],
      small: ['Salix babylonica sapling', 'young weeping willow'],
      medium: ['young weeping willow tree', 'Salix babylonica tree'],
      large: ['large weeping willow tree Salix babylonica']
    }
  };

  const CITRUS_WORDS = ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'pomelo', 'clementine'];
  const GLOBAL_REJECT = ['logo', 'icon', 'map', 'diagram', 'drawing', 'illustration', 'herbarium', 'distribution', 'range map', 'coat of arms'];

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
  }

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[_-]+/g, ' ');
  }

  function uniq(values) {
    return Array.from(new Set(values.filter(Boolean).map(v => String(v).trim()).filter(Boolean)));
  }

  function getPlantById(id) {
    try {
      if (typeof P !== 'undefined' && Array.isArray(P)) return P.find(p => String(p.id) === String(id));
    } catch (e) {}
    return null;
  }

  function getWikiInfo(name) {
    let info = null;
    try {
      if (typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES) info = WIKI_PAGES[name] || null;
    } catch (e) {}
    return info || {};
  }

  function profileFor(plantOrName) {
    const name = typeof plantOrName === 'string' ? plantOrName : plantOrName?.name;
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const wikiInfo = getWikiInfo(name);
    const page = PAGE_OVERRIDES[name] || wikiInfo.page || name;
    const override = QUERY_OVERRIDES[name] || {};
    const pageTokens = normalize(page).split(/\s+/).filter(t => t.length > 3 && !['tree', 'plant', 'fruit'].includes(t));
    const isCitrus = plant?.bg === 'citrus' || /לימון|ליים|תפוז|אשכולית|קלמנטינה|פומלה|citrus|lemon|lime|orange|grapefruit|pomelo|clementine/i.test(`${name} ${page}`);
    const kind = plant?.type === 'bush' ? 'plant' : (plant?.type === 'lawn' ? 'grass' : 'tree');

    return {
      name,
      page,
      kind,
      isCitrus,
      must: uniq([...(override.must || []), ...pageTokens]),
      reject: uniq([...(override.reject || []), ...(isCitrus ? [] : CITRUS_WORDS)]),
      queries: {
        small: uniq([...(override.small || []), wikiInfo.small, `${page} seedling`, `young ${page} plant`, `${page} sapling`]),
        medium: uniq([...(override.medium || []), `${page} young ${kind}`, `${page} established plant`, page]),
        large: uniq([...(override.large || []), wikiInfo.large, `${page} mature ${kind}`, `${page} fruit flower`, page])
      }
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function fetchWikipediaThumb(page, width) {
    if (!page) return null;
    const key = `stage_page_${page}_${width}_${PATCH_VERSION}`;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return imgCache[key];
    } catch (e) {}

    let url = null;
    try {
      const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&pithumbsize=${width || 1200}&format=json&origin=*`;
      const data = await fetchJson(api);
      const pageObj = data.query?.pages ? Object.values(data.query.pages)[0] : null;
      url = pageObj?.thumbnail?.source || null;
    } catch (e) {
      url = null;
    }

    try { if (typeof imgCache !== 'undefined') imgCache[key] = url; } catch (e) {}
    return url;
  }

  function scoreCommonsTitle(rawTitle, profile, size) {
    const title = normalize(rawTitle).replace(/^file:/, '');
    if (!/\.(jpe?g|png|webp)$/i.test(rawTitle)) return -100;
    if (GLOBAL_REJECT.some(word => title.includes(word))) return -80;
    if (profile.reject?.some(word => title.includes(normalize(word)))) return -75;

    let score = 0;
    const mustHits = (profile.must || []).filter(word => title.includes(normalize(word))).length;
    score += mustHits * 28;
    if ((profile.must || []).length && mustHits === 0) score -= 15;

    if (size === 'small') {
      if (/seedling|sapling|young|juvenile|nursery|pot|potted/.test(title)) score += 25;
      if (/mature|old|ancient/.test(title)) score -= 12;
    }
    if (size === 'medium') {
      if (/young|sapling|small|tree|plant|shrub/.test(title)) score += 15;
      if (/seedling/.test(title)) score -= 5;
    }
    if (size === 'large') {
      if (/tree|mature|fruit|flower|orchard|full|large/.test(title)) score += 18;
      if (/seedling|sapling/.test(title)) score -= 12;
    }
    if (/fruit|flower|leaf|tree|plant|shrub/.test(title)) score += 7;
    return score;
  }

  async function fetchCommonsBest(query, profile, size) {
    const key = `stage_commons_${query}_${size}_${PATCH_VERSION}`;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return imgCache[key];
    } catch (e) {}

    let result = null;
    try {
      const search = `${query} filetype:bitmap`;
      const api = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=${encodeURIComponent(search)}&gsrlimit=10&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
      const data = await fetchJson(api);
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      const candidates = pages
        .map(page => ({
          title: page.title || '',
          url: page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url || null,
          mime: page.imageinfo?.[0]?.mime || ''
        }))
        .filter(item => item.url && /^image\/(jpeg|png|webp)/i.test(item.mime))
        .map(item => ({ ...item, score: scoreCommonsTitle(item.title, profile, size) }))
        .sort((a, b) => b.score - a.score);

      result = candidates.length && candidates[0].score > -20 ? candidates[0].url : null;
    } catch (e) {
      result = null;
    }

    try { if (typeof imgCache !== 'undefined') imgCache[key] = result; } catch (e) {}
    return result;
  }

  async function resolveStageImage(plantOrName, size) {
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const name = plant?.name || plantOrName;
    const safeSize = STAGES.includes(size) ? size : 'medium';
    const directKey = `${name}__${safeSize}`;
    const customKey = plant ? `custom_${plant.id}_${safeSize}` : null;

    try {
      if (customKey && typeof imgCache !== 'undefined' && imgCache[customKey]) return imgCache[customKey];
    } catch (e) {}

    const cacheKey = `stage_resolved_${name}_${safeSize}_${PATCH_VERSION}`;
    try {
      if (typeof imgCache !== 'undefined' && imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
    } catch (e) {}

    const profile = profileFor(plant || name);
    const queries = profile.queries[safeSize] || [];
    let url = null;

    for (const query of queries) {
      url = await fetchCommonsBest(query, profile, safeSize);
      if (url) break;
    }

    if (!url) url = await fetchWikipediaThumb(profile.page, safeSize === 'small' ? 900 : 1200);
    if (!url && profile.page !== name) url = await fetchCommonsBest(profile.page, profile, safeSize);

    try {
      if (typeof imgCache !== 'undefined') {
        imgCache[cacheKey] = url || null;
        imgCache[directKey] = url || null;
      }
    } catch (e) {}

    return url || null;
  }

  function installCss() {
    if (document.getElementById('plant-stage-photo-css')) return;
    const style = document.createElement('style');
    style.id = 'plant-stage-photo-css';
    style.textContent = `
      .m-photos.stage-gallery{height:300px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b;}
      .m-photos.stage-gallery .m-slot{min-width:0;isolation:isolate;}
      .m-photos.stage-gallery .m-slot-real{filter:saturate(1.05) contrast(1.03);}
      .m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important;text-shadow:0 1px 3px rgba(0,0,0,.45);}
      .m-photos.stage-gallery .m-slot-lbl small{display:block;margin-top:3px;font-size:.68rem;line-height:1.18;font-weight:500!important;opacity:.92!important;}
      .m-photos.stage-gallery .slot-lbl{display:none!important;}
      .m-photos.stage-gallery .slot-emoji{opacity:.35;}
      .m-photos.stage-gallery .slot-edit-btn{z-index:8;}
      .real-photo.show{background:#eef2e6;}
      @media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px}.m-photos.stage-gallery .m-slot-lbl{font-size:.86rem!important}}
    `;
    document.head.appendChild(style);
  }

  function labelModalStage(plant) {
    const photos = document.getElementById('mPhotos');
    if (photos) photos.classList.add('stage-gallery');

    STAGES.forEach(size => {
      const slot = document.getElementById(`mslot-${size}`);
      const label = slot?.querySelector('.m-slot-lbl');
      const bgLabel = slot?.querySelector('.slot-lbl');
      const detail = plant?.sizes?.[size] || '';
      const html = `${STAGE_LABELS[size]}${detail ? `<br><small>${detail}</small>` : ''}`;
      if (label) label.innerHTML = html;
      if (bgLabel) bgLabel.textContent = STAGE_LABELS[size];
      const img = document.getElementById(`mimg-${size}`);
      if (img) img.alt = `${plant?.name || ''} - ${STAGE_LABELS[size]}`;
    });
  }

  function loadStageIntoModal(plant, size) {
    const img = document.getElementById(`mimg-${size}`);
    const loader = document.getElementById(`mload-${size}`);
    if (!img || !plant) return;
    if (loader) loader.classList.add('show');

    resolveStageImage(plant, size).then(url => {
      if (loader) loader.classList.remove('show');
      if (!url) return;
      img.classList.remove('show');
      img.onload = () => img.classList.add('show');
      img.onerror = () => img.classList.remove('show');
      img.src = url;
    }).catch(() => {
      if (loader) loader.classList.remove('show');
    });
  }

  function enhanceModal(plant) {
    labelModalStage(plant);
    STAGES.forEach(size => loadStageIntoModal(plant, size));
  }

  function patchImageLoaders() {
    window.fetchWikiImg = async function patchedFetchWikiImg(plantName, size) {
      const plant = (() => {
        try {
          return typeof P !== 'undefined' && Array.isArray(P) ? P.find(item => item.name === plantName) : null;
        } catch (e) {
          return null;
        }
      })();
      return resolveStageImage(plant || plantName, size || 'medium');
    };

    window.tryLoadImg = function patchedTryLoadImg(id, size, onSuccess, onFail) {
      const plant = getPlantById(id);
      if (!plant) {
        if (onFail) onFail();
        return;
      }

      resolveStageImage(plant, size || 'medium').then(url => {
        if (url) {
          if (onSuccess) onSuccess(url);
        } else if (onFail) {
          onFail();
        }
      }).catch(() => {
        if (onFail) onFail();
      });
    };
  }

  function patchModal() {
    if (window.__plantStageOpenMPatched) return;
    const originalOpenM = window.openM;
    if (typeof originalOpenM !== 'function') return;
    window.__plantStageOpenMPatched = true;

    window.openM = async function patchedOpenM(id) {
      const result = await originalOpenM.apply(this, arguments);
      const plant = getPlantById(id) || (() => { try { return typeof AP !== 'undefined' ? AP : null; } catch (e) { return null; } })();
      setTimeout(() => enhanceModal(plant), 0);
      return result;
    };
  }

  function refreshCards() {
    try {
      if (typeof render === 'function') {
        setTimeout(() => render(), 0);
        return;
      }
    } catch (e) {}

    try {
      if (typeof P !== 'undefined' && Array.isArray(P)) {
        P.forEach(plant => {
          const img = document.getElementById(`cimg-${plant.id}`);
          if (!img) return;
          resolveStageImage(plant, 'medium').then(url => {
            if (!url) return;
            img.onload = () => img.classList.add('show');
            img.onerror = () => img.classList.remove('show');
            img.src = url;
          });
        });
      }
    } catch (e) {}
  }

  function ready() {
    try {
      return typeof P !== 'undefined' && Array.isArray(P) && typeof imgCache !== 'undefined' && typeof window.openM === 'function';
    } catch (e) {
      return false;
    }
  }

  let attempts = 0;
  function boot() {
    if (!ready()) {
      attempts += 1;
      if (attempts < 160) setTimeout(boot, 100);
      return;
    }

    installCss();
    patchImageLoaders();
    patchModal();
    refreshCards();
    window.__plantStagePhotosVersion = PATCH_VERSION;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
