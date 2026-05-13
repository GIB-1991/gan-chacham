(function () {
  const VERSION = 'plant-image-repair-20260513';
  const STAGES = ['small', 'medium', 'large'];
  const STAGE_LABELS = {
    small: 'צמח צעיר',
    medium: 'בן 3-4',
    large: 'צמח בוגר'
  };

  const PAGE_OVERRIDES = {
    'ערבה בוכיה': 'Salix babylonica',
    'שסק': 'Eriobotrya japonica',
    'מנגו': 'Mangifera indica',
    'תאנה': 'Ficus carica',
    'שמיר': 'Dill',
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
    'ברוש מצוי': 'Cupressus sempervirens',
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
    'פטוניה': 'Petunia',
    'שעועית': 'Common bean',
    'כרישה': 'Leek',
    'מלפפון': 'Cucumber',
    'עגבנייה': 'Tomato',
    'פלפל': 'Bell pepper',
    'חציל': 'Eggplant',
    'חסה': 'Lettuce',
    'קישוא': 'Zucchini',
    'אבטיח': 'Watermelon',
    'מלון': 'Melon'
  };

  const QUERY_OVERRIDES = {
    'ערבה בוכיה': {
      must: ['salix', 'willow', 'babylonica'],
      small: ['Salix babylonica sapling', 'young weeping willow', 'willow sapling'],
      medium: ['young weeping willow tree', 'Salix babylonica tree', 'weeping willow tree'],
      large: ['large weeping willow tree', 'Salix babylonica mature tree', 'weeping willow lake']
    },
    'שסק': {
      must: ['eriobotrya', 'loquat', 'japonica'],
      reject: ['citrus', 'lime', 'lemon', 'orange', 'grapefruit'],
      small: ['Eriobotrya japonica seedling', 'loquat sapling'],
      medium: ['young loquat tree Eriobotrya japonica', 'Eriobotrya japonica tree'],
      large: ['Eriobotrya japonica fruits tree', 'loquat fruit tree']
    },
    'מנגו': {
      must: ['mango', 'mangifera'],
      small: ['Mangifera indica seedling', 'mango sapling'],
      medium: ['young mango tree Mangifera indica', 'mango tree'],
      large: ['mango tree fruits Mangifera indica', 'mango orchard']
    },
    'תאנה': {
      must: ['fig', 'ficus', 'carica'],
      small: ['Ficus carica sapling', 'young fig tree'],
      medium: ['Ficus carica tree', 'fig tree'],
      large: ['fig tree fruit Ficus carica', 'mature fig tree']
    },
    'שמיר': {
      must: ['dill', 'anethum'],
      reject: ['tree'],
      small: ['dill seedling', 'Anethum graveolens seedling'],
      medium: ['dill plant Anethum graveolens', 'young dill plant'],
      large: ['dill flower umbels', 'Anethum graveolens mature plant']
    }
  };

  const GLOBAL_REJECT = ['logo', 'icon', 'map', 'diagram', 'drawing', 'illustration', 'herbarium', 'distribution', 'range map', 'coat of arms'];
  const CITRUS_WORDS = ['citrus', 'lemon', 'lime', 'orange', 'grapefruit', 'pomelo', 'clementine'];

  function normalize(value) {
    return String(value || '').toLowerCase().replace(/[_-]+/g, ' ');
  }

  function uniq(values) {
    return Array.from(new Set(values.filter(Boolean).map(value => String(value).trim()).filter(Boolean)));
  }

  function getGlobal(name) {
    try { return window[name]; } catch (e) { return undefined; }
  }

  function getPlantById(id) {
    try {
      if (typeof P !== 'undefined' && Array.isArray(P)) return P.find(plant => String(plant.id) === String(id));
    } catch (e) {}
    return null;
  }

  function getAllPlants() {
    try { return typeof P !== 'undefined' && Array.isArray(P) ? P : []; } catch (e) { return []; }
  }

  function getWikiInfo(name) {
    try {
      if (typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES && WIKI_PAGES[name]) return WIKI_PAGES[name];
    } catch (e) {}
    return {};
  }

  function isCitrusPlant(plant, page) {
    return plant?.bg === 'citrus' || /לימון|ליים|תפוז|אשכולית|קלמנטינה|פומלה|citrus|lemon|lime|orange|grapefruit|pomelo|clementine/i.test(`${plant?.name || ''} ${page || ''}`);
  }

  function profileFor(plantOrName) {
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const name = plant?.name || plantOrName;
    const wiki = getWikiInfo(name);
    const page = PAGE_OVERRIDES[name] || wiki.page || name;
    const override = QUERY_OVERRIDES[name] || {};
    const kind = plant?.type === 'bush' ? 'plant' : plant?.type === 'lawn' ? 'grass' : 'tree';
    const pageTokens = normalize(page).split(/\s+/).filter(token => token.length > 3 && !['tree', 'plant', 'fruit'].includes(token));
    const citrus = isCitrusPlant(plant, page);

    return {
      name,
      page,
      kind,
      must: uniq([...(override.must || []), ...pageTokens]),
      reject: uniq([...(override.reject || []), ...(citrus ? [] : CITRUS_WORDS)]),
      queries: {
        small: uniq([...(override.small || []), wiki.small, `${page} seedling`, `${page} sapling`, `young ${page} plant`]),
        medium: uniq([...(override.medium || []), `${page} young ${kind}`, `${page} established plant`, page]),
        large: uniq([...(override.large || []), wiki.large, `${page} mature ${kind}`, `${page} fruit flower`, page])
      }
    };
  }

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function fetchWikipediaApiThumb(page, width) {
    if (!page) return null;
    try {
      const api = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(page)}&prop=pageimages&pithumbsize=${width || 1200}&format=json&origin=*`;
      const data = await fetchJson(api);
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      return pages[0]?.thumbnail?.source || null;
    } catch (e) {
      return null;
    }
  }

  async function fetchWikipediaSummaryThumb(page) {
    if (!page) return null;
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page)}`;
      const data = await fetchJson(url);
      return data.thumbnail?.source || data.originalimage?.source || null;
    } catch (e) {
      return null;
    }
  }

  async function fetchWikiThumb(page, width) {
    const key = `repair_wiki_${page}_${width || 1200}_${VERSION}`;
    try { if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return imgCache[key]; } catch (e) {}

    const url = await fetchWikipediaApiThumb(page, width) || await fetchWikipediaSummaryThumb(page);
    try { if (typeof imgCache !== 'undefined') imgCache[key] = url || null; } catch (e) {}
    return url || null;
  }

  function scoreTitle(rawTitle, profile, stage) {
    const title = normalize(rawTitle).replace(/^file:/, '');
    if (GLOBAL_REJECT.some(word => title.includes(word))) return -90;
    if ((profile.reject || []).some(word => title.includes(normalize(word)))) return -80;

    let score = 0;
    const mustHits = (profile.must || []).filter(word => title.includes(normalize(word))).length;
    score += mustHits * 26;
    if ((profile.must || []).length && mustHits === 0) score -= 8;

    if (/\.jpe?g|\.png|\.webp/.test(title)) score += 6;
    if (/fruit|flower|leaf|tree|plant|shrub|sapling|seedling/.test(title)) score += 8;

    if (stage === 'small') {
      if (/seedling|sapling|young|juvenile|nursery|pot|potted/.test(title)) score += 24;
      if (/mature|old|ancient|large/.test(title)) score -= 10;
    }
    if (stage === 'medium') {
      if (/young|small|tree|plant|shrub|garden/.test(title)) score += 14;
      if (/seedling/.test(title)) score -= 4;
    }
    if (stage === 'large') {
      if (/tree|mature|fruit|flower|orchard|large|old/.test(title)) score += 18;
      if (/seedling|sapling/.test(title)) score -= 10;
    }
    return score;
  }

  async function fetchImageInfo(title) {
    try {
      const fileTitle = title.startsWith('File:') ? title : `File:${title}`;
      const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*`;
      const data = await fetchJson(api);
      const page = data.query?.pages ? Object.values(data.query.pages)[0] : null;
      const info = page?.imageinfo?.[0];
      if (!info || !/^image\/(jpeg|png|webp)/i.test(info.mime || '')) return null;
      return info.thumburl || info.url || null;
    } catch (e) {
      return null;
    }
  }

  async function fetchCommons(query, profile, stage) {
    const key = `repair_commons_${query}_${stage}_${VERSION}`;
    try { if (typeof imgCache !== 'undefined' && imgCache[key] !== undefined) return imgCache[key]; } catch (e) {}

    let bestUrl = null;
    try {
      const api = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=14&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
      const data = await fetchJson(api);
      const results = data.query?.search || [];
      const ranked = results
        .map(result => ({ title: result.title || '', score: scoreTitle(result.title || '', profile, stage) }))
        .filter(item => item.score > -40)
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      for (const item of ranked) {
        bestUrl = await fetchImageInfo(item.title);
        if (bestUrl) break;
      }
    } catch (e) {
      bestUrl = null;
    }

    try { if (typeof imgCache !== 'undefined') imgCache[key] = bestUrl || null; } catch (e) {}
    return bestUrl || null;
  }

  function makePlaceholder(plant, stage) {
    const name = plant?.name || 'צמח';
    const label = STAGE_LABELS[stage] || '';
    const detail = plant?.sizes?.[stage] || '';
    const bg = plant?.bg === 'citrus' ? '#d59b2d' : plant?.type === 'tropical' ? '#1f7a55' : plant?.type === 'bush' ? '#6f8b43' : plant?.type === 'ornamental' ? '#6a4fb3' : '#557a45';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#f3f6e8"/></linearGradient></defs><rect width="1200" height="800" fill="url(#g)"/><circle cx="240" cy="185" r="150" fill="rgba(255,255,255,.16)"/><circle cx="985" cy="660" r="210" fill="rgba(0,0,0,.09)"/><text x="600" y="330" text-anchor="middle" font-size="132" font-family="Arial, sans-serif">🌿</text><text x="600" y="450" text-anchor="middle" direction="rtl" font-size="64" font-weight="700" font-family="Arial, sans-serif" fill="#17251b">${escapeXml(name)}</text><text x="600" y="525" text-anchor="middle" direction="rtl" font-size="44" font-family="Arial, sans-serif" fill="#274432">${escapeXml(label)}</text><text x="600" y="588" text-anchor="middle" direction="rtl" font-size="28" font-family="Arial, sans-serif" fill="#274432">${escapeXml(detail).slice(0, 70)}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }

  function escapeXml(value) {
    return String(value || '').replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]));
  }

  async function resolveImage(plantOrName, stage, fallbackStage) {
    const plant = typeof plantOrName === 'object' ? plantOrName : null;
    const name = plant?.name || plantOrName;
    const safeStage = STAGES.includes(stage) ? stage : 'medium';
    const profile = profileFor(plant || name);
    const stageKey = `repair_resolved_${name}_${safeStage}_${VERSION}`;
    const directKey = `${name}__${safeStage}`;
    const customKey = plant ? `custom_${plant.id}_${safeStage}` : null;

    try {
      if (customKey && typeof imgCache !== 'undefined' && imgCache[customKey]) return imgCache[customKey];
      if (typeof imgCache !== 'undefined' && imgCache[stageKey]) return imgCache[stageKey];
    } catch (e) {}

    let url = null;
    const queries = profile.queries[safeStage] || [];
    for (const query of queries) {
      url = await fetchCommons(query, profile, safeStage);
      if (url) break;
    }

    if (!url) url = await fetchWikiThumb(profile.page, safeStage === 'small' ? 900 : 1200);
    if (!url && fallbackStage && fallbackStage !== safeStage) url = await resolveImage(plant || name, fallbackStage, null);
    if (!url && safeStage !== 'medium') url = await resolveImage(plant || name, 'medium', null);
    if (!url) url = makePlaceholder(plant || { name }, safeStage);

    try {
      if (typeof imgCache !== 'undefined') {
        imgCache[stageKey] = url;
        imgCache[directKey] = url;
      }
    } catch (e) {}
    return url;
  }

  function setImage(img, url) {
    if (!img || !url) return;
    img.classList.remove('show');
    img.onload = () => img.classList.add('show');
    img.onerror = () => img.classList.remove('show');
    img.src = url;
    if (img.complete && img.naturalWidth > 0) img.classList.add('show');
  }

  function installCss() {
    if (document.getElementById('plant-image-repair-css')) return;
    const style = document.createElement('style');
    style.id = 'plant-image-repair-css';
    style.textContent = `
      .m-photos.stage-gallery{height:300px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b;}
      .m-photos.stage-gallery .m-slot{min-width:0;isolation:isolate;}
      .m-photos.stage-gallery .m-slot-real{filter:saturate(1.05) contrast(1.03);}
      .m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important;text-shadow:0 1px 3px rgba(0,0,0,.45);}
      .m-photos.stage-gallery .m-slot-lbl small{display:block;margin-top:3px;font-size:.68rem;line-height:1.18;font-weight:500!important;opacity:.92!important;}
      .m-photos.stage-gallery .slot-lbl{display:none!important;}
      .m-photos.stage-gallery .slot-emoji{opacity:.28;}
      .real-photo.show,.m-slot-real.show{background:#eef2e6;}
      @media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px}.m-photos.stage-gallery .m-slot-lbl{font-size:.86rem!important}}
    `;
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
      if (label) label.innerHTML = `${STAGE_LABELS[stage]}${detail ? `<br><small>${escapeXml(detail)}</small>` : ''}`;
      if (bgLabel) bgLabel.textContent = STAGE_LABELS[stage];
    });
  }

  function repairModal(plant) {
    if (!plant) return;
    labelModal(plant);
    STAGES.forEach(stage => {
      const img = document.getElementById(`mimg-${stage}`);
      const loader = document.getElementById(`mload-${stage}`);
      if (!img) return;
      if (loader) loader.classList.add('show');
      resolveImage(plant, stage, stage === 'medium' ? 'large' : 'medium').then(url => {
        if (loader) loader.classList.remove('show');
        setImage(img, url);
      }).catch(() => {
        if (loader) loader.classList.remove('show');
        setImage(img, makePlaceholder(plant, stage));
      });
    });
  }

  function repairCard(id, stage) {
    const plant = getPlantById(id);
    const img = document.getElementById(`cimg-${id}`);
    const loader = document.getElementById(`cload-${id}`);
    if (!plant || !img) return;
    if (loader) loader.classList.add('show');
    resolveImage(plant, stage || 'medium', 'large').then(url => {
      if (loader) loader.classList.remove('show');
      setImage(img, url);
    }).catch(() => {
      if (loader) loader.classList.remove('show');
      setImage(img, makePlaceholder(plant, stage || 'medium'));
    });
  }

  function repairVisibleCards() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(img => {
      const id = img.id.replace('cimg-', '');
      repairCard(id, 'medium');
    });
  }

  function patchGlobals() {
    window.fetchWikiImg = function repairedFetchWikiImg(plantName, stage) {
      const plant = getAllPlants().find(item => item.name === plantName);
      return resolveImage(plant || plantName, stage || 'medium', 'large');
    };

    window.tryLoadImg = function repairedTryLoadImg(id, stage, onSuccess, onFail) {
      const plant = getPlantById(id);
      if (!plant) {
        if (onFail) onFail();
        return;
      }
      resolveImage(plant, stage || 'medium', 'large').then(url => {
        if (url) {
          if (onSuccess) onSuccess(url);
        } else if (onFail) {
          onFail();
        }
      }).catch(() => {
        const fallback = makePlaceholder(plant, stage || 'medium');
        if (onSuccess) onSuccess(fallback);
      });
    };

    window.loadCardImg = function repairedLoadCardImg(id, stage) {
      repairCard(id, stage || 'medium');
    };
  }

  function patchModalOpen() {
    if (window.__plantImageRepairOpenM) return;
    const previous = window.openM;
    if (typeof previous !== 'function') return;
    window.__plantImageRepairOpenM = true;
    window.openM = async function repairedOpenM(id) {
      const result = await previous.apply(this, arguments);
      const plant = getPlantById(id) || (() => { try { return typeof AP !== 'undefined' ? AP : null; } catch (e) { return null; } })();
      setTimeout(() => repairModal(plant), 60);
      return result;
    };
  }

  function patchRender() {
    if (window.__plantImageRepairRender) return;
    const previous = window.render;
    if (typeof previous !== 'function') return;
    window.__plantImageRepairRender = true;
    window.render = function repairedRender() {
      const result = previous.apply(this, arguments);
      setTimeout(repairVisibleCards, 80);
      setTimeout(repairVisibleCards, 600);
      return result;
    };
  }

  function observeCards() {
    const area = document.getElementById('pa');
    if (!area || window.__plantImageRepairObserver) return;
    window.__plantImageRepairObserver = true;
    const observer = new MutationObserver(() => setTimeout(repairVisibleCards, 80));
    observer.observe(area, { childList: true, subtree: true });
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
    if (!ready()) {
      tries += 1;
      if (tries < 180) setTimeout(boot, 100);
      return;
    }

    installCss();
    patchGlobals();
    patchModalOpen();
    patchRender();
    observeCards();
    repairVisibleCards();
    setTimeout(repairVisibleCards, 800);
    setTimeout(repairVisibleCards, 2200);
    window.__plantImageRepairVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
