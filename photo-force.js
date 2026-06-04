(function () {
  var VERSION = 'excel-garden-no-floors-20260604';
  var NAMES = ['ערבה בוכיה','תפוז טבורי','לימון ננסי','פפאיה','שזיף פיסרדי','אבוקדו','מנגו','פקאן','צפצפה','נקטרינה','תות עץ','תפוח פינק ליידי','אלה סינית','פומלה','שקד','מגנוליה גדולת פרחים','גודגדן','פטל','אוכמניות','דשא יפני','דשא קוקויה','ויסטריה'];
  var PHOTOS = {
    'ערבה בוכיה':'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Salix_babylonica_in_Golden_Valley_Tree_Park%2C_May_2022.jpg/960px-Salix_babylonica_in_Golden_Valley_Tree_Park%2C_May_2022.jpg',
    'תפוז טבורי':'https://upload.wikimedia.org/wikipedia/commons/c/c4/Sapindales_-_Citrus_sinensis_-_9.jpg',
    'לימון ננסי':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Schnee_Zitrone_Citrus_%C3%97_limon_1.JPG/960px-Schnee_Zitrone_Citrus_%C3%97_limon_1.JPG',
    'פפאיה':'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Carica_papaya_14_7_2012.jpg/960px-Carica_papaya_14_7_2012.jpg',
    'שזיף פיסרדי':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/20140317Prunus_cerasifera_Hockenheimer_Rheinbogen5.jpg/960px-20140317Prunus_cerasifera_Hockenheimer_Rheinbogen5.jpg',
    'אבוקדו':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Persea_americana_%28Avocado%29_tree_in_RDA%2C_Bogra_05.jpg/960px-Persea_americana_%28Avocado%29_tree_in_RDA%2C_Bogra_05.jpg',
    'מנגו':'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Mango_tree_Kerala_in_full_bloom.jpg/960px-Mango_tree_Kerala_in_full_bloom.jpg',
    'פקאן':'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Carya_illinoinensis_%28pecan_tree%29_1_%2824790682337%29.jpg/960px-Carya_illinoinensis_%28pecan_tree%29_1_%2824790682337%29.jpg',
    'צפצפה':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Populus_alba_tree_and_reflection_of_the_Orb_Aqueduct_cf08.jpg/960px-Populus_alba_tree_and_reflection_of_the_Orb_Aqueduct_cf08.jpg',
    'נקטרינה':'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Starr-190322-6367-Prunus_persica_var_persica-peach_and_nectarine_trees_flowering_in_orchard-Hawea_Pl_Olinda-Maui_%2848296185457%29.jpg/960px-Starr-190322-6367-Prunus_persica_var_persica-peach_and_nectarine_trees_flowering_in_orchard-Hawea_Pl_Olinda-Maui_%2848296185457%29.jpg',
    'תות עץ':'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Morus_sp._02.jpg/960px-Morus_sp._02.jpg',
    'תפוח פינק ליידי':'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Tree_with_red_apples_in_Barkedal_4.jpg/960px-Tree_with_red_apples_in_Barkedal_4.jpg',
    'אלה סינית':'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Pistacia_chinensis_%28Anacardiaceae%29_%28tree%29.JPG/960px-Pistacia_chinensis_%28Anacardiaceae%29_%28tree%29.JPG',
    'פומלה':'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Trauttmansdorff_gardens_-_Citrus_x_paradisi_02.JPG/960px-Trauttmansdorff_gardens_-_Citrus_x_paradisi_02.JPG',
    'שקד':'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Shkediya02_ST_04.jpg/960px-Shkediya02_ST_04.jpg',
    'מגנוליה גדולת פרחים':'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Magnolia_grandiflora_%22Sempreverde%22.jpg/960px-Magnolia_grandiflora_%22Sempreverde%22.jpg',
    'גודגדן':'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Prunus_avium_RF.jpg/960px-Prunus_avium_RF.jpg',
    'פטל':'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Framboise_Margy_3.jpg/960px-Framboise_Margy_3.jpg',
    'אוכמניות':'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Vaccinium_corymbosum_NBG_LR.jpg/960px-Vaccinium_corymbosum_NBG_LR.jpg',
    'דשא יפני':'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Ophiopogon_japonicus_at_Coker_Arboretum.jpg/960px-Ophiopogon_japonicus_at_Coker_Arboretum.jpg',
    'דשא קוקויה':'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Pennisetum_clandestinum_pasture.jpg/960px-Pennisetum_clandestinum_pasture.jpg',
    'ויסטריה':'https://commons.wikimedia.org/wiki/Special:FilePath/Wisteria%20sinensis.jpg?width=900'
  };

  function clean(name) {
    return String(name || '').normalize('NFKC').replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/\(X?\d+\)/gi, '').replace(/\s+/g, ' ').trim();
  }
  function list() { try { return Array.isArray(P) ? P : []; } catch (e) { return []; } }
  function catalog() { try { return Array.isArray(CATALOG_ALL) ? CATALOG_ALL : list(); } catch (e) { return list(); } }
  function clone(x) { return JSON.parse(JSON.stringify(x || {})); }
  function findIn(arr, name) {
    var c = clean(name);
    return arr.find(function (p) { return clean(p.name) === c; }) || arr.find(function (p) {
      var n = clean(p.name);
      return n && (c.includes(n) || n.includes(c));
    }) || null;
  }
  function fallback(name, i) {
    return { id: 9000 + i, name: name, type: 'ornamental', bg: 'ornamental', lbl: 'צמח', e: '🌿', prune: null, pm: [], fert: null, fm: [], supp: null, sm: [], crit: null };
  }
  function excelPlants() {
    var current = list(), all = catalog(), used = {};
    return NAMES.map(function (name, i) {
      var p = clone(findIn(current, name) || findIn(all, name) || fallback(name, i));
      p.name = name;
      p.photoUrl = PHOTOS[name] || p.photoUrl || null;
      if (used[String(p.id)]) p.id = 9000 + i;
      used[String(p.id)] = true;
      return p;
    });
  }
  function disableFloors() {
    try { SHOW_FLOORS = false; } catch (e) {}
    var toggle = document.getElementById('floor-toggle');
    if (toggle) toggle.style.display = 'none';
    document.querySelectorAll('.floor-hdr').forEach(function (n) { n.style.display = 'none'; });
  }
  function stripModalFloor() {
    var sub = document.getElementById('ms');
    if (!sub) return;
    sub.textContent = String(sub.textContent || '').split('·')[0].split('Â·')[0].trim();
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
    style.textContent = '.alerts-bar,.floor-hdr,#floor-toggle{display:none!important}.card-img .real-photo.show{display:block!important;opacity:1!important;width:100%!important;height:100%!important;object-fit:cover!important}.photo-loading,.photo-loading.show,.card-photo-empty{display:none!important}#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}';
    document.head.appendChild(style);
  }
  function replaceMainList() {
    var p = list();
    if (!p.length) return;
    var next = excelPlants();
    p.length = 0;
    next.forEach(function (x) { p.push(x); });
    if (typeof updCounts === 'function') updCounts();
  }
  function plantById(id) { return list().find(function (p) { return String(p.id) === String(id); }) || null; }
  function setImg(img, url) {
    if (!img || !url) return;
    img.src = url;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.classList.add('show');
    var box = img.closest('.card-img');
    if (box) box.classList.remove('photo-pending', 'no-real-photo');
  }
  function applyPhotos() {
    document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) {
      var p = plantById(img.id.replace('cimg-', ''));
      if (p) setImg(img, p.photoUrl || PHOTOS[clean(p.name)]);
    });
  }
  function patchRender() {
    if (window.__excelNoFloorsRender || typeof render !== 'function') return;
    var old = render;
    window.__excelNoFloorsRender = true;
    render = function () {
      disableFloors();
      var result = old.apply(this, arguments);
      disableFloors();
      setTimeout(function () { disableFloors(); applyPhotos(); }, 0);
      return result;
    };
  }
  function patchModal() {
    if (window.__excelNoFloorsModal || typeof openM !== 'function') return;
    var old = openM;
    window.__excelNoFloorsModal = true;
    openM = function () {
      var result = old.apply(this, arguments);
      hideModalPhotos(); stripModalFloor();
      setTimeout(function () { hideModalPhotos(); stripModalFloor(); }, 0);
      setTimeout(function () { hideModalPhotos(); stripModalFloor(); }, 250);
      return result;
    };
  }
  try { window.fetchWikiImg = function (name) { return Promise.resolve(PHOTOS[clean(name)] || null); }; } catch (e) {}
  try {
    if (typeof onUserLoggedIn === 'function' && !window.__excelNoFloorsLogin) {
      var oldLogin = onUserLoggedIn;
      window.__excelNoFloorsLogin = true;
      onUserLoggedIn = async function () { await oldLogin.apply(this, arguments); boot(true); };
    }
  } catch (e) {}
  function boot(renderNow) {
    injectCss(); disableFloors(); patchRender(); patchModal(); replaceMainList();
    if (renderNow && typeof render === 'function') render();
    applyPhotos(); hideModalPhotos(); stripModalFloor();
  }
  boot(false);
  setTimeout(function () { boot(true); }, 300);
  setTimeout(function () { boot(true); }, 1400);
  setInterval(function () { disableFloors(); applyPhotos(); stripModalFloor(); }, 1500);
  window.__excelPhotoForceVersion = VERSION;
})();