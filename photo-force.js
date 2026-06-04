(function () {
  var VERSION = 'excel-garden-display-only-20260604';

  var EXCEL_NAMES = [
    '\u05e2\u05e8\u05d1\u05d4 \u05d1\u05d5\u05db\u05d9\u05d4',
    '\u05ea\u05e4\u05d5\u05d6 \u05d8\u05d1\u05d5\u05e8\u05d9',
    '\u05dc\u05d9\u05de\u05d5\u05df \u05e0\u05e0\u05e1\u05d9',
    '\u05e4\u05e4\u05d0\u05d9\u05d4',
    '\u05e9\u05d6\u05d9\u05e3 \u05e4\u05d9\u05e1\u05e8\u05d3\u05d9',
    '\u05d0\u05d1\u05d5\u05e7\u05d3\u05d5',
    '\u05de\u05e0\u05d2\u05d5',
    '\u05e4\u05e7\u05d0\u05df',
    '\u05e6\u05e4\u05e6\u05e4\u05d4',
    '\u05e0\u05e7\u05d8\u05e8\u05d9\u05e0\u05d4',
    '\u05ea\u05d5\u05ea \u05e2\u05e5',
    '\u05ea\u05e4\u05d5\u05d7 \u05e4\u05d9\u05e0\u05e7 \u05dc\u05d9\u05d9\u05d3\u05d9',
    '\u05d0\u05dc\u05d4 \u05e1\u05d9\u05e0\u05d9\u05ea',
    '\u05e4\u05d5\u05de\u05dc\u05d4',
    '\u05e9\u05e7\u05d3',
    '\u05de\u05d2\u05e0\u05d5\u05dc\u05d9\u05d4 \u05d2\u05d3\u05d5\u05dc\u05ea \u05e4\u05e8\u05d7\u05d9\u05dd',
    '\u05d2\u05d5\u05d3\u05d2\u05d3\u05df',
    '\u05e4\u05d8\u05dc',
    '\u05d0\u05d5\u05db\u05de\u05e0\u05d9\u05d5\u05ea',
    '\u05d3\u05e9\u05d0 \u05d9\u05e4\u05e0\u05d9',
    '\u05d3\u05e9\u05d0 \u05e7\u05d5\u05e7\u05d5\u05d9\u05d4',
    '\u05d5\u05d9\u05e1\u05d8\u05e8\u05d9\u05d4'
  ];

  var EXCEL_FLOORS = {
    '\u05e2\u05e8\u05d1\u05d4 \u05d1\u05d5\u05db\u05d9\u05d4': '\u05e7\u05d5\u05de\u05d4 \u05e2\u05dc\u05d9\u05d5\u05e0\u05d4',
    '\u05ea\u05e4\u05d5\u05d6 \u05d8\u05d1\u05d5\u05e8\u05d9': '\u05e7\u05d5\u05de\u05d4 \u05e2\u05dc\u05d9\u05d5\u05e0\u05d4',
    '\u05dc\u05d9\u05de\u05d5\u05df \u05e0\u05e0\u05e1\u05d9': '\u05e7\u05d5\u05de\u05d4 \u05e2\u05dc\u05d9\u05d5\u05e0\u05d4',
    '\u05e4\u05e4\u05d0\u05d9\u05d4': '\u05e7\u05d5\u05de\u05d4 \u05e2\u05dc\u05d9\u05d5\u05e0\u05d4',
    '\u05e9\u05d6\u05d9\u05e3 \u05e4\u05d9\u05e1\u05e8\u05d3\u05d9': '\u05e7\u05d5\u05de\u05d4 \u05e2\u05dc\u05d9\u05d5\u05e0\u05d4',
    '\u05d0\u05d1\u05d5\u05e7\u05d3\u05d5': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05de\u05e0\u05d2\u05d5': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e4\u05e7\u05d0\u05df': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e6\u05e4\u05e6\u05e4\u05d4': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e0\u05e7\u05d8\u05e8\u05d9\u05e0\u05d4': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05ea\u05d5\u05ea \u05e2\u05e5': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05ea\u05e4\u05d5\u05d7 \u05e4\u05d9\u05e0\u05e7 \u05dc\u05d9\u05d9\u05d3\u05d9': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05d0\u05dc\u05d4 \u05e1\u05d9\u05e0\u05d9\u05ea': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e4\u05d5\u05de\u05dc\u05d4': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e9\u05e7\u05d3': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05de\u05d2\u05e0\u05d5\u05dc\u05d9\u05d4 \u05d2\u05d3\u05d5\u05dc\u05ea \u05e4\u05e8\u05d7\u05d9\u05dd': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05d2\u05d5\u05d3\u05d2\u05d3\u05df': '\u05e7\u05d5\u05de\u05d4 \u05ea\u05d7\u05ea\u05d5\u05e0\u05d4',
    '\u05e4\u05d8\u05dc': '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd',
    '\u05d0\u05d5\u05db\u05de\u05e0\u05d9\u05d5\u05ea': '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd',
    '\u05d3\u05e9\u05d0 \u05d9\u05e4\u05e0\u05d9': '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd',
    '\u05d3\u05e9\u05d0 \u05e7\u05d5\u05e7\u05d5\u05d9\u05d4': '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd',
    '\u05d5\u05d9\u05e1\u05d8\u05e8\u05d9\u05d4': '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd'
  };

  var PLANT_PHOTOS = {
    '\u05e2\u05e8\u05d1\u05d4 \u05d1\u05d5\u05db\u05d9\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Salix_babylonica_in_Golden_Valley_Tree_Park%2C_May_2022.jpg/960px-Salix_babylonica_in_Golden_Valley_Tree_Park%2C_May_2022.jpg',
    '\u05ea\u05e4\u05d5\u05d6 \u05d8\u05d1\u05d5\u05e8\u05d9': 'https://upload.wikimedia.org/wikipedia/commons/c/c4/Sapindales_-_Citrus_sinensis_-_9.jpg',
    '\u05dc\u05d9\u05de\u05d5\u05df \u05e0\u05e0\u05e1\u05d9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Schnee_Zitrone_Citrus_%C3%97_limon_1.JPG/960px-Schnee_Zitrone_Citrus_%C3%97_limon_1.JPG',
    '\u05e4\u05e4\u05d0\u05d9\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Carica_papaya_14_7_2012.jpg/960px-Carica_papaya_14_7_2012.jpg',
    '\u05e9\u05d6\u05d9\u05e3 \u05e4\u05d9\u05e1\u05e8\u05d3\u05d9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/20140317Prunus_cerasifera_Hockenheimer_Rheinbogen5.jpg/960px-20140317Prunus_cerasifera_Hockenheimer_Rheinbogen5.jpg',
    '\u05d0\u05d1\u05d5\u05e7\u05d3\u05d5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Persea_americana_%28Avocado%29_tree_in_RDA%2C_Bogra_05.jpg/960px-Persea_americana_%28Avocado%29_tree_in_RDA%2C_Bogra_05.jpg',
    '\u05de\u05e0\u05d2\u05d5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Mango_tree_Kerala_in_full_bloom.jpg/960px-Mango_tree_Kerala_in_full_bloom.jpg',
    '\u05e4\u05e7\u05d0\u05df': 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Carya_illinoinensis_%28pecan_tree%29_1_%2824790682337%29.jpg/960px-Carya_illinoinensis_%28pecan_tree%29_1_%2824790682337%29.jpg',
    '\u05e6\u05e4\u05e6\u05e4\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Populus_alba_tree_and_reflection_of_the_Orb_Aqueduct_cf08.jpg/960px-Populus_alba_tree_and_reflection_of_the_Orb_Aqueduct_cf08.jpg',
    '\u05e0\u05e7\u05d8\u05e8\u05d9\u05e0\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Starr-190322-6367-Prunus_persica_var_persica-peach_and_nectarine_trees_flowering_in_orchard-Hawea_Pl_Olinda-Maui_%2848296185457%29.jpg/960px-Starr-190322-6367-Prunus_persica_var_persica-peach_and_nectarine_trees_flowering_in_orchard-Hawea_Pl_Olinda-Maui_%2848296185457%29.jpg',
    '\u05ea\u05d5\u05ea \u05e2\u05e5': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Morus_sp._02.jpg/960px-Morus_sp._02.jpg',
    '\u05ea\u05e4\u05d5\u05d7 \u05e4\u05d9\u05e0\u05e7 \u05dc\u05d9\u05d9\u05d3\u05d9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Tree_with_red_apples_in_Barkedal_4.jpg/960px-Tree_with_red_apples_in_Barkedal_4.jpg',
    '\u05d0\u05dc\u05d4 \u05e1\u05d9\u05e0\u05d9\u05ea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Pistacia_chinensis_%28Anacardiaceae%29_%28tree%29.JPG/960px-Pistacia_chinensis_%28Anacardiaceae%29_%28tree%29.JPG',
    '\u05e4\u05d5\u05de\u05dc\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Trauttmansdorff_gardens_-_Citrus_x_paradisi_02.JPG/960px-Trauttmansdorff_gardens_-_Citrus_x_paradisi_02.JPG',
    '\u05e9\u05e7\u05d3': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Shkediya02_ST_04.jpg/960px-Shkediya02_ST_04.jpg',
    '\u05de\u05d2\u05e0\u05d5\u05dc\u05d9\u05d4 \u05d2\u05d3\u05d5\u05dc\u05ea \u05e4\u05e8\u05d7\u05d9\u05dd': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Magnolia_grandiflora_%22Sempreverde%22.jpg/960px-Magnolia_grandiflora_%22Sempreverde%22.jpg',
    '\u05d2\u05d5\u05d3\u05d2\u05d3\u05df': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Prunus_avium_RF.jpg/960px-Prunus_avium_RF.jpg',
    '\u05e4\u05d8\u05dc': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Framboise_Margy_3.jpg/960px-Framboise_Margy_3.jpg',
    '\u05d0\u05d5\u05db\u05de\u05e0\u05d9\u05d5\u05ea': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Vaccinium_corymbosum_NBG_LR.jpg/960px-Vaccinium_corymbosum_NBG_LR.jpg',
    '\u05d3\u05e9\u05d0 \u05d9\u05e4\u05e0\u05d9': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Ophiopogon_japonicus_at_Coker_Arboretum.jpg/960px-Ophiopogon_japonicus_at_Coker_Arboretum.jpg',
    '\u05d3\u05e9\u05d0 \u05e7\u05d5\u05e7\u05d5\u05d9\u05d4': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Pennisetum_clandestinum_pasture.jpg/960px-Pennisetum_clandestinum_pasture.jpg',
    '\u05d5\u05d9\u05e1\u05d8\u05e8\u05d9\u05d4': 'https://commons.wikimedia.org/wiki/Special:FilePath/Wisteria%20sinensis.jpg?width=900'
  };

  function cleanName(name) {
    return String(name || '')
      .normalize('NFKC')
      .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
      .replace(/\(X?\d+\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function plants() {
    try {
      if (typeof P !== 'undefined' && Array.isArray(P)) return P;
      if (typeof window !== 'undefined' && Array.isArray(window.P)) return window.P;
    } catch (e) {}
    return [];
  }

  function catalog() {
    try {
      if (typeof CATALOG_ALL !== 'undefined' && Array.isArray(CATALOG_ALL) && CATALOG_ALL.length) return CATALOG_ALL;
      if (typeof window !== 'undefined' && Array.isArray(window.CATALOG_ALL) && window.CATALOG_ALL.length) return window.CATALOG_ALL;
      return plants();
    } catch (e) {
      return plants();
    }
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function findBase(name) {
    var clean = cleanName(name);
    var all = catalog();
    return all.find(function (p) { return cleanName(p.name) === clean; }) ||
      all.find(function (p) {
        var n = cleanName(p.name);
        return n && (clean.includes(n) || n.includes(clean));
      }) ||
      null;
  }

  function findVisiblePlant(name) {
    var clean = cleanName(name);
    return plants().find(function (p) { return cleanName(p.name) === clean; }) ||
      plants().find(function (p) {
        var n = cleanName(p.name);
        return n && (clean.includes(n) || n.includes(clean));
      }) ||
      null;
  }

  function fallbackPlant(name, index) {
    return {
      id: 9000 + index,
      name: name,
      type: 'ornamental',
      bg: 'ornamental',
      lbl: '\u05e6\u05de\u05d7',
      e: '\ud83c\udf3f',
      floor: EXCEL_FLOORS[name] || '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd',
      prune: null, pm: [], pi: null, pmth: null,
      fert: null, fm: [], supp: null, sm: [],
      rules: null, crit: null,
      waterSummer: null, waterWinter: null, waterType: null,
      light: '\u05e9\u05de\u05e9 \u05de\u05dc\u05d0\u05d4', lightAlt: null, climate: [],
      indoor: false, geo: null, winter: null, summer: null
    };
  }

  function buildExcelPlants() {
    var used = {};
    return EXCEL_NAMES.map(function (name, index) {
      var plant = clone(findVisiblePlant(name) || findBase(name) || fallbackPlant(name, index));
      plant.name = name;
      plant.floor = EXCEL_FLOORS[name] || plant.floor || '\u05e0\u05e1\u05e4\u05d7\u05d9\u05dd';
      plant.photoUrl = PLANT_PHOTOS[name] || plant.photoUrl || null;
      if (used[String(plant.id)]) plant.id = 9000 + index;
      used[String(plant.id)] = true;
      return plant;
    });
  }

  function replaceVisiblePlants(excelPlants) {
    var list = plants();
    if (!list.length) return;
    list.length = 0;
    excelPlants.forEach(function (plant) { list.push(plant); });
    if (typeof updCounts === 'function') updCounts();
    if (typeof renderAlerts === 'function') renderAlerts();
    if (typeof render === 'function') render();
  }

  async function forceExcelInitialGarden() {
    var list = plants();
    if (!list.length) return;
    var excelPlants = buildExcelPlants();
    replaceVisiblePlants(excelPlants);
    applyPhotos();
  }

  function photoFor(name) {
    return PLANT_PHOTOS[cleanName(name)] || null;
  }

  function setImg(img, url) {
    if (!img || !url) return;
    img.src = url;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.classList.add('show');
    var box = img.closest('.card-img');
    if (box) {
      box.classList.remove('photo-pending', 'no-real-photo');
      box.querySelectorAll('.card-photo-empty,.photo-loading').forEach(function (node) {
        node.style.display = 'none';
      });
    }
  }

  function plantById(id) {
    return plants().find(function (plant) { return String(plant.id) === String(id); }) || null;
  }

  function applyPhotos() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) {
      var id = img.id.replace('cimg-', '');
      var plant = plantById(id);
      var url = plant && (plant.photoUrl || photoFor(plant.name));
      if (url) setImg(img, url);
    });
    hideModalPhotos();
  }

  function hideModalPhotos() {
    var box = document.getElementById('mPhotos');
    if (!box) return;
    box.innerHTML = '';
    box.className = 'm-photos modal-photos-removed';
    box.style.display = 'none';
    box.style.height = '0';
  }

  function injectCss() {
    if (document.getElementById('excel-photo-force-css')) return;
    var style = document.createElement('style');
    style.id = 'excel-photo-force-css';
    style.textContent = [
      '.card-img .real-photo.show{display:block!important;opacity:1!important;width:100%!important;height:100%!important;object-fit:cover!important}',
      '.photo-loading,.photo-loading.show,.card-photo-empty{display:none!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}'
    ].join('\n');
    document.head.appendChild(style);
  }

  function patchRender() {
    if (window.__excelPhotoForceRender || typeof render !== 'function') return;
    var originalRender = render;
    window.__excelPhotoForceRender = true;
    render = function () {
      var result = originalRender.apply(this, arguments);
      setTimeout(applyPhotos, 0);
      setTimeout(applyPhotos, 200);
      return result;
    };
  }

  function patchModal() {
    if (window.__excelPhotoForceOpenM || typeof openM !== 'function') return;
    var originalOpenM = openM;
    window.__excelPhotoForceOpenM = true;
    openM = function () {
      var result = originalOpenM.apply(this, arguments);
      hideModalPhotos();
      setTimeout(hideModalPhotos, 0);
      setTimeout(hideModalPhotos, 200);
      return result;
    };
  }

  try {
    window.fetchWikiImg = function (name) {
      return Promise.resolve(photoFor(name));
    };
  } catch (e) {}

  try {
    if (typeof onUserLoggedIn === 'function' && !window.__excelPhotoForceLogin) {
      var originalLogin = onUserLoggedIn;
      window.__excelPhotoForceLogin = true;
      onUserLoggedIn = async function () {
        await originalLogin.apply(this, arguments);
        await forceExcelInitialGarden();
      };
    }
  } catch (e) {}

  function boot() {
    injectCss();
    patchRender();
    patchModal();
    forceExcelInitialGarden();
    applyPhotos();
  }

  boot();
  setTimeout(boot, 300);
  setTimeout(boot, 1200);
  setInterval(applyPhotos, 3000);
  window.__excelPhotoForceVersion = VERSION;
})();