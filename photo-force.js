(function () {
  var VERSION = 'gardenia-catalog-redesign-20260605';
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

  function clean(name) { return String(name || '').normalize('NFKC').replace(/[\u200e\u200f\u202a-\u202e]/g, '').replace(/\(X?\d+\)/gi, '').replace(/\s+/g, ' ').trim(); }
  function list() { try { return Array.isArray(P) ? P : []; } catch (e) { return []; } }
  function catalog() { try { return Array.isArray(CATALOG_ALL) ? CATALOG_ALL : list(); } catch (e) { return list(); } }
  function clone(x) { return JSON.parse(JSON.stringify(x || {})); }
  function findIn(arr, name) { var c = clean(name); return arr.find(function (p) { return clean(p.name) === c; }) || arr.find(function (p) { var n = clean(p.name); return n && (c.includes(n) || n.includes(c)); }) || null; }
  function fallback(name, i) { return { id: 9000 + i, name: name, type: 'ornamental', bg: 'ornamental', lbl: 'צמח', e: '🌿', prune: null, pm: [], fert: null, fm: [], supp: null, sm: [], crit: null }; }
  function excelPlants() { var current = list(), all = catalog(), used = {}; return NAMES.map(function (name, i) { var p = clone(findIn(current, name) || findIn(all, name) || fallback(name, i)); p.name = name; p.photoUrl = PHOTOS[name] || p.photoUrl || null; if (used[String(p.id)]) p.id = 9000 + i; used[String(p.id)] = true; return p; }); }

  function disableFloors() { try { SHOW_FLOORS = false; } catch (e) {} var toggle = document.getElementById('floor-toggle'); if (toggle) toggle.style.display = 'none'; document.querySelectorAll('.floor-hdr').forEach(function (n) { n.style.display = 'none'; }); }
  function stripModalFloor() { var sub = document.getElementById('ms'); if (!sub) return; sub.textContent = String(sub.textContent || '').split('·')[0].split('Â·')[0].trim(); }
  function hideModalPhotos() { var box = document.getElementById('mPhotos'); if (!box) return; box.innerHTML = ''; box.className = 'm-photos modal-photos-removed'; box.style.display = 'none'; box.style.height = '0'; }

  function injectCss() {
    if (document.getElementById('excel-photo-force-css')) return;
    var style = document.createElement('style');
    style.id = 'excel-photo-force-css';
    style.textContent = [
      ':root{--gd-forest:#173f2a;--gd-leaf:#5f8f48;--gd-soft:#eef5e8;--gd-paper:#fffefa;--gd-cream:#f8f2e8;--gd-clay:#a66b43;--gd-line:#e5dac7;--gd-ink:#1f2f25;--gd-muted:#68766b;--gd-gold:#d2a13b}',
      'html,body{background:#f8f2e8!important;color:var(--gd-ink)!important}',
      '#app-shell{background:linear-gradient(180deg,#fffefa 0,#f8f2e8 250px,#edf5e8 100%)!important}',
      '.header{background:#fffefa!important;border-bottom:0!important;box-shadow:0 8px 34px rgba(23,63,42,.08)!important;padding:20px 40px 18px!important}',
      '.header::after{height:6px!important;background:linear-gradient(90deg,#173f2a 0,#5f8f48 42%,#d2a13b 72%,#a66b43 100%)!important}',
      '.header-title h1{font-family:"Frank Ruhl Libre",serif!important;font-size:2.35rem!important;line-height:.95!important;color:var(--gd-forest)!important;font-weight:900!important}',
      '.header-title h1 span{display:block!important;color:var(--gd-clay)!important;font-size:1.9rem!important;margin-top:4px!important}.header-title p{color:var(--gd-muted)!important;font-weight:700!important;margin-top:10px!important}',
      '.month-pill{background:#fff7e9!important;border:1px solid #e7d4b7!important;color:var(--gd-forest)!important;border-radius:999px!important;box-shadow:none!important}',
      '#user-header-info>div,.notif-bell{background:var(--gd-forest)!important;border-color:var(--gd-forest)!important;border-radius:999px!important;box-shadow:0 12px 26px rgba(23,63,42,.22)!important}',
      '.alerts-bar,.floor-hdr,#floor-toggle{display:none!important}',
      '.layout{max-width:1500px!important;grid-template-columns:300px 1fr!important;gap:30px!important;margin-top:28px!important;padding:0 34px 48px!important}',
      '.sidebar{background:rgba(255,254,250,.94)!important;border:1px solid var(--gd-line)!important;border-radius:18px!important;box-shadow:0 18px 52px rgba(32,49,38,.12)!important;padding:24px 18px!important;height:calc(100vh - 220px)!important}',
      '.sb-ttl{color:var(--gd-clay)!important;font-size:.78rem!important;font-weight:900!important;margin-bottom:10px!important}.divider{background:var(--gd-line)!important;margin:18px 8px!important}',
      '.sb-inp{height:48px!important;background:#fff!important;border:1px solid var(--gd-line)!important;border-radius:14px!important;color:var(--gd-ink)!important;padding:0 16px!important;font-weight:800!important}',
      '.flt{border-radius:14px!important;padding:12px 14px!important;margin-bottom:8px!important;font-weight:900!important;color:var(--gd-ink)!important;background:transparent!important}.flt:hover{background:#f4eadb!important}.flt.on{background:var(--gd-forest)!important;color:#fff!important;box-shadow:0 14px 30px rgba(23,63,42,.2)!important}',
      '.plants-area{padding-top:4px!important}.grid{grid-template-columns:repeat(auto-fill,minmax(315px,1fr))!important;gap:30px!important}',
      '.card{position:relative!important;background:transparent!important;border:0!important;border-radius:22px!important;overflow:visible!important;box-shadow:none!important;min-height:500px!important}',
      '.card.alert{border:0!important;box-shadow:none!important}.card:hover{transform:translateY(-6px)!important;box-shadow:none!important}',
      '.card-img{height:340px!important;border-radius:22px!important;overflow:hidden!important;border:1px solid rgba(23,63,42,.12)!important;box-shadow:0 18px 44px rgba(23,63,42,.16)!important;background:#dfe9d8!important}',
      '.card-img::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(14,34,22,.58) 100%);pointer-events:none;z-index:3}',
      '.real-photo{object-fit:cover!important;background:#dfe9d8!important}.card-img .real-photo.show{display:block!important;opacity:1!important;width:100%!important;height:100%!important;object-fit:cover!important}.photo-loading,.photo-loading.show,.card-photo-empty,.size-tabs{display:none!important}',
      '.alert-dot{top:18px!important;left:18px!important;z-index:8!important}.card-menu-btn{top:16px!important;right:16px!important;z-index:9!important;width:40px!important;height:40px!important;background:rgba(255,254,250,.96)!important;color:var(--gd-forest)!important;border-radius:999px!important;box-shadow:0 10px 22px rgba(0,0,0,.18)!important}',
      '.card-body{position:relative!important;margin:-82px 18px 0!important;background:var(--gd-paper)!important;border:1px solid var(--gd-line)!important;border-radius:20px!important;box-shadow:0 18px 44px rgba(32,49,38,.16)!important;padding:22px 20px 20px!important;min-height:235px!important;z-index:5!important}',
      '.card-name{font-family:"Frank Ruhl Libre",serif!important;color:var(--gd-forest)!important;font-size:1.72rem!important;line-height:1!important;margin:0 0 10px!important;font-weight:900!important}',
      '.card-type{background:#efe1cf!important;color:var(--gd-clay)!important;border-radius:999px!important;padding:5px 14px!important;font-weight:900!important;font-size:.82rem!important;margin-bottom:12px!important}',
      '.care-row{background:transparent!important;border:0!important;border-top:1px solid #eee5d6!important;border-radius:0!important;padding:10px 0!important;margin:0!important;color:var(--gd-muted)!important;font-size:.84rem!important;line-height:1.35!important}.care-row .ci{width:22px!important}',
      '.card-chips{border-top:1px solid #eee5d6!important;margin-top:4px!important;padding-top:12px!important}.cc{border-radius:999px!important;font-weight:900!important;padding:5px 11px!important}.cc.p{background:#fff3cc!important;color:#765414!important}.cc.f{background:#eaf6dd!important;color:#38562e!important}.cc.s{background:#e8f4f8!important;color:#2d5460!important}',
      '.card-ctx-menu{border-radius:16px!important;border:1px solid var(--gd-line)!important;box-shadow:0 18px 40px rgba(32,49,38,.18)!important}',
      '.overlay{background:rgba(23,63,42,.76)!important}.modal{background:var(--gd-paper)!important;border:1px solid var(--gd-line)!important;border-radius:22px!important;box-shadow:0 34px 100px rgba(12,31,19,.35)!important}.m-info{background:#fffefa!important;border-bottom:1px solid var(--gd-line)!important;padding:30px 36px!important}.m-info h2{font-family:"Frank Ruhl Libre",serif!important;color:var(--gd-forest)!important;font-size:2.4rem!important}.m-info .sub{color:var(--gd-muted)!important}',
      '.mseason,.msec,.nbox,.cbox,.cl-progress-box,.cl-item{border-radius:16px!important;border-color:var(--gd-line)!important}.msec-ttl{color:var(--gd-clay)!important;font-weight:900!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '@media(max-width:900px){.layout{grid-template-columns:1fr!important;padding:0 16px 28px!important;gap:18px!important}.sidebar{height:auto!important;border-radius:16px!important}.grid{grid-template-columns:1fr!important;gap:26px!important}.card-img{height:300px!important}.card{min-height:470px!important}.header{padding:18px!important}.header-title h1{font-size:1.9rem!important}.header-title h1 span{font-size:1.48rem!important}}'
    ].join('');
    document.head.appendChild(style);
  }
  function replaceMainList() { var p = list(); if (!p.length) return; var next = excelPlants(); p.length = 0; next.forEach(function (x) { p.push(x); }); if (typeof updCounts === 'function') updCounts(); }
  function plantById(id) { return list().find(function (p) { return String(p.id) === String(id); }) || null; }
  function setImg(img, url) { if (!img || !url) return; img.src = url; img.loading = 'lazy'; img.decoding = 'async'; img.classList.add('show'); var box = img.closest('.card-img'); if (box) box.classList.remove('photo-pending', 'no-real-photo'); }
  function applyPhotos() { document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function (img) { var p = plantById(img.id.replace('cimg-', '')); if (p) setImg(img, p.photoUrl || PHOTOS[clean(p.name)]); }); }
  function patchRender() { if (window.__excelNoFloorsRender || typeof render !== 'function') return; var old = render; window.__excelNoFloorsRender = true; render = function () { disableFloors(); var result = old.apply(this, arguments); disableFloors(); setTimeout(function () { disableFloors(); applyPhotos(); }, 0); return result; }; }
  function patchModal() { if (window.__excelNoFloorsModal || typeof openM !== 'function') return; var old = openM; window.__excelNoFloorsModal = true; openM = function () { var result = old.apply(this, arguments); hideModalPhotos(); stripModalFloor(); setTimeout(function () { hideModalPhotos(); stripModalFloor(); }, 0); setTimeout(function () { hideModalPhotos(); stripModalFloor(); }, 250); return result; }; }
  try { window.fetchWikiImg = function (name) { return Promise.resolve(PHOTOS[clean(name)] || null); }; } catch (e) {}
  try { if (typeof onUserLoggedIn === 'function' && !window.__excelNoFloorsLogin) { var oldLogin = onUserLoggedIn; window.__excelNoFloorsLogin = true; onUserLoggedIn = async function () { await oldLogin.apply(this, arguments); boot(true); }; } } catch (e) {}
  function boot(renderNow) { injectCss(); disableFloors(); patchRender(); patchModal(); replaceMainList(); if (renderNow && typeof render === 'function') render(); applyPhotos(); hideModalPhotos(); stripModalFloor(); }
  boot(false);
  setTimeout(function () { boot(true); }, 300);
  setTimeout(function () { boot(true); }, 1400);
  setInterval(function () { disableFloors(); applyPhotos(); stripModalFloor(); }, 1500);
  window.__excelPhotoForceVersion = VERSION;
})();