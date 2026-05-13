(function () {
  const APP_VERSION = 'israel-catalog-20260513';
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');
  const hostScript = document.currentScript;
  const mainScript = document.createElement('script');

  window.__GAN_PATCH_VERSION = APP_VERSION;
  window.onAuthSubmit = showAppLoadingError;
  window.loginWithGoogle = showAppLoadingError;

  if (authSubmitBtn) authSubmitBtn.disabled = true;
  if (googleBtn) googleBtn.disabled = true;

  mainScript.src = `script.js?v=${APP_VERSION}`;
  mainScript.onload = function () {
    installRuntimeFixes();
    installExtraCatalog();
  };
  mainScript.onerror = function () {
    console.error('Failed to load script.js');
    showAppLoadingError('לא ניתן לטעון את האפליקציה. נסה לרענן את הדף.');
    if (authSubmitBtn) authSubmitBtn.disabled = false;
    if (googleBtn) googleBtn.disabled = false;
  };

  if (hostScript && hostScript.parentNode) hostScript.parentNode.insertBefore(mainScript, hostScript.nextSibling);
  else document.body.appendChild(mainScript);
})();

function showAppLoadingError(msg = 'האפליקציה עדיין נטענת. נסה שוב בעוד רגע.') {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.color = '#dc2626';
  el.style.display = 'block';
}

function installRuntimeFixes() {
  if (window.__GAN_RUNTIME_FIXES_INSTALLED) return;
  window.__GAN_RUNTIME_FIXES_INSTALLED = true;

  const originalShowAuthError = window.showAuthError;
  const originalShowAuthScreen = window.showAuthScreen;
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');
  const cloud = {
    dbSavePlant: window.dbSavePlant,
    dbDeletePlant: window.dbDeletePlant,
    dbLoadPlants: window.dbLoadPlants,
    dbSavePlantingDate: window.dbSavePlantingDate,
    dbDeletePlantingDate: window.dbDeletePlantingDate,
    dbLoadPlantingDates: window.dbLoadPlantingDates,
    loginWithEmail: window.loginWithEmail,
    registerWithEmail: window.registerWithEmail,
    logout: window.logout,
    saveAge: window.saveAge,
    clearAge: window.clearAge,
    savePhotoEdit: window.savePhotoEdit,
    confirmResetPlant: window.confirmResetPlant
  };

  const LOCAL_SESSION_KEY = 'gan_chacham_local_session_v1';
  const LOCAL_LOGOUT_KEY = 'gan_chacham_local_logged_out_v1';
  const LOCAL_PLANTS_KEY = 'gan_chacham_local_plants_v2';
  const LOCAL_DATES_KEY = 'gan_chacham_local_planting_dates_v2';
  const LOCAL_IMAGES_KEY = 'gan_chacham_local_images_v2';
  const DEFAULT_PLANT_CANDIDATES = [['מנגו'], ['תאנה'], ['שמיר'], ['שסק'], ['ערבה בוכייה', 'ערבה בוכיה']];

  let enteringApp = false;
  let localMode = false;

  if (authSubmitBtn) authSubmitBtn.disabled = false;
  if (googleBtn) googleBtn.disabled = false;

  window.showAuthError = function patchedShowAuthError(msg, isError = true) {
    if (typeof originalShowAuthError === 'function') return originalShowAuthError(msg, isError);
    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#dc2626' : '#166534';
    el.style.display = 'block';
  };

  window.showAuthScreen = function patchedShowAuthScreen() {
    if (localMode) {
      currentUser = makeLocalUser();
      return;
    }
    if (typeof originalShowAuthScreen === 'function') originalShowAuthScreen();
  };

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('loadJson:', key, e);
      return fallback;
    }
  }
  function saveJson(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
  function hasLocalSession() { return localStorage.getItem(LOCAL_SESSION_KEY) === 'true'; }
  function hasLocalLogout() { return localStorage.getItem(LOCAL_LOGOUT_KEY) === 'true'; }
  function localPlantsExist() { return localStorage.getItem(LOCAL_PLANTS_KEY) !== null; }
  function localDatesExist() { return localStorage.getItem(LOCAL_DATES_KEY) !== null; }
  function makeLocalUser() { return { id: 'local-offline', email: 'מצב מקומי', user_metadata: { full_name: 'מצב מקומי' } }; }
  function readLocalPlants() { const plants = loadJson(LOCAL_PLANTS_KEY, []); return Array.isArray(plants) ? plants : []; }
  function readLocalDates() { const dates = loadJson(LOCAL_DATES_KEY, {}); return dates && typeof dates === 'object' ? dates : {}; }
  function hasOAuthReturn() {
    const search = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    return !!(search.get('code') || search.get('error') || search.get('error_description') || hash.get('access_token') || hash.get('error'));
  }

  function persistLocalImages() {
    try {
      if (typeof imgCache === 'undefined' || !imgCache) return;
      const customImages = {};
      Object.keys(imgCache).forEach(key => {
        if (key.startsWith('custom_') && imgCache[key]) customImages[key] = imgCache[key];
      });
      saveJson(LOCAL_IMAGES_KEY, customImages);
    } catch (e) {
      console.error('persistLocalImages:', e);
    }
  }

  function loadLocalImages() {
    if (typeof imgCache === 'undefined' || !imgCache) return;
    const customImages = loadJson(LOCAL_IMAGES_KEY, {});
    Object.keys(customImages).forEach(key => { imgCache[key] = customImages[key]; });
  }

  function persistLocalGarden() {
    try {
      saveJson(LOCAL_PLANTS_KEY, P);
      saveJson(LOCAL_DATES_KEY, plantingDates);
      persistLocalImages();
    } catch (e) {
      console.error('persistLocalGarden:', e);
      if (typeof showToast === 'function') showToast('לא הצלחנו לשמור בדפדפן. ייתכן שהאחסון המקומי מלא.');
    }
  }

  function loadLocalGarden() {
    if (localPlantsExist()) {
      P.length = 0;
      readLocalPlants().forEach(p => P.push(p));
    }
    Object.keys(plantingDates).forEach(key => delete plantingDates[key]);
    Object.assign(plantingDates, readLocalDates());
    loadLocalImages();
  }

  function renderCurrentGarden(message) {
    hideAuthScreen();
    renderUserHeader(currentUser);
    document.getElementById('monthPill').textContent = `📅 ${MHE[CUR - 1]} ${NOW.getFullYear()}`;
    document.getElementById('msel').value = 0;
    updCounts();
    renderAlerts();
    render();
    if (message && typeof showToast === 'function') showToast(message);
  }

  function enterLocalMode(reason) {
    localMode = true;
    localStorage.setItem(LOCAL_SESSION_KEY, 'true');
    localStorage.removeItem(LOCAL_LOGOUT_KEY);
    try { _db = null; } catch (e) {}
    try { currentUser = makeLocalUser(); } catch (e) {}
    loadLocalGarden();
    renderCurrentGarden(reason || 'הגינה נטענה מהדפדפן');
  }

  async function supabaseReachable(timeoutMs = 3500) {
    if (typeof SUPABASE_URL === 'undefined') return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/settings`, { method: 'GET', cache: 'no-store', signal: ctrl.signal });
      return true;
    } catch (e) {
      console.error('supabaseReachable:', e);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  function findDefaultPlants() {
    const catalog = typeof getAllCatalogPlants === 'function' ? getAllCatalogPlants() : (typeof CATALOG_ALL !== 'undefined' ? CATALOG_ALL : []);
    return DEFAULT_PLANT_CANDIDATES
      .map(names => names.map(name => catalog.find(p => p.name === name)).find(Boolean))
      .filter(Boolean);
  }

  window.dbSavePlant = async function patchedDbSavePlant(plant) {
    const idx = P.findIndex(p => p.id === plant.id);
    if (idx >= 0) P[idx] = { ...P[idx], ...plant };
    else P.push(plant);
    persistLocalGarden();
    if (!_db || !currentUser || localMode || typeof cloud.dbSavePlant !== 'function') return;
    try { await cloud.dbSavePlant(plant); } catch (e) { console.error('dbSavePlant cloud:', e); }
  };

  window.dbDeletePlant = async function patchedDbDeletePlant(id) {
    persistLocalGarden();
    if (!_db || !currentUser || localMode || typeof cloud.dbDeletePlant !== 'function') return;
    try { await cloud.dbDeletePlant(id); } catch (e) { console.error('dbDeletePlant cloud:', e); }
  };

  window.dbLoadPlants = async function patchedDbLoadPlants() {
    if (localMode || !_db || !currentUser || typeof cloud.dbLoadPlants !== 'function') return localPlantsExist() ? clone(readLocalPlants()) : null;
    try {
      const remotePlants = await cloud.dbLoadPlants();
      if (Array.isArray(remotePlants)) {
        if (remotePlants.length > 0) {
          saveJson(LOCAL_PLANTS_KEY, remotePlants);
          return clone(remotePlants);
        }
        if (localPlantsExist()) return clone(readLocalPlants());
        return [];
      }
    } catch (e) {
      console.error('dbLoadPlants cloud:', e);
    }
    return localPlantsExist() ? clone(readLocalPlants()) : null;
  };

  window.dbSavePlantingDate = async function patchedDbSavePlantingDate(plantId, dateStr) {
    plantingDates[plantId] = dateStr;
    persistLocalGarden();
    if (!_db || !currentUser || localMode || typeof cloud.dbSavePlantingDate !== 'function') return;
    try { await cloud.dbSavePlantingDate(plantId, dateStr); } catch (e) { console.error('dbSavePlantingDate cloud:', e); }
  };

  window.dbDeletePlantingDate = async function patchedDbDeletePlantingDate(plantId) {
    delete plantingDates[plantId];
    persistLocalGarden();
    if (!_db || !currentUser || localMode || typeof cloud.dbDeletePlantingDate !== 'function') return;
    try { await cloud.dbDeletePlantingDate(plantId); } catch (e) { console.error('dbDeletePlantingDate cloud:', e); }
  };

  window.dbLoadPlantingDates = async function patchedDbLoadPlantingDates() {
    if (localMode || !_db || !currentUser || typeof cloud.dbLoadPlantingDates !== 'function') return clone(readLocalDates());
    try {
      const remoteDates = await cloud.dbLoadPlantingDates();
      if (remoteDates && typeof remoteDates === 'object') {
        if (Object.keys(remoteDates).length > 0) {
          saveJson(LOCAL_DATES_KEY, remoteDates);
          return clone(remoteDates);
        }
        if (localDatesExist()) return clone(readLocalDates());
        saveJson(LOCAL_DATES_KEY, {});
        return {};
      }
    } catch (e) {
      console.error('dbLoadPlantingDates cloud:', e);
    }
    return clone(readLocalDates());
  };

  window.loginWithGoogle = async function patchedLoginWithGoogle() {
    if (!_db || !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    try {
      const returnUrl = new URL(window.location.href);
      returnUrl.search = '';
      returnUrl.hash = '';
      const { error } = await _db.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: returnUrl.toString(), queryParams: { prompt: 'select_account' } }
      });
      if (error) showAuthError('שגיאת התחברות עם Google: ' + error.message);
    } catch (e) {
      console.error('loginWithGoogle:', e);
      enterLocalMode('לא הצלחנו להתחבר ל-Google, לכן פתחנו את האתר במצב מקומי.');
    }
  };

  window.loginWithEmail = async function patchedLoginWithEmail(email, password) {
    if (!_db || !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    try { await cloud.loginWithEmail(email, password); }
    catch (e) {
      console.error('loginWithEmail:', e);
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
    }
  };

  window.registerWithEmail = async function patchedRegisterWithEmail(email, password) {
    if (!_db || !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    try { await cloud.registerWithEmail(email, password); }
    catch (e) {
      console.error('registerWithEmail:', e);
      showAuthError('לא הצלחנו להשלים הרשמה כרגע. אפשר להמשיך במצב מקומי.');
    }
  };

  window.logout = async function patchedLogout() {
    localStorage.removeItem(LOCAL_SESSION_KEY);
    localStorage.setItem(LOCAL_LOGOUT_KEY, 'true');
    if (localMode || !_db || typeof cloud.logout !== 'function') {
      currentUser = null;
      localMode = false;
      if (typeof originalShowAuthScreen === 'function') originalShowAuthScreen();
      return;
    }
    await cloud.logout();
  };

  window.onAuthSubmit = function patchedOnAuthSubmit() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    if (!email || !password) {
      showAuthError('יש להזין אימייל וסיסמה');
      return;
    }
    if (authMode === 'login') loginWithEmail(email, password);
    else registerWithEmail(email, password);
  };

  window.onUserLoggedIn = async function patchedOnUserLoggedIn() {
    if (enteringApp) return;
    enteringApp = true;
    try {
      try { currentUser = currentUser || (await _db.auth.getUser()).data.user; } catch (e) { console.error('getUser:', e); }
      if (!currentUser) { showAuthScreen(); return; }

      renderUserHeader(currentUser);
      hideAuthScreen();
      showToast('טוען את הגינה שלך...');

      let dbPlants = null;
      let dbDates = {};
      try { [dbPlants, dbDates] = await Promise.all([dbLoadPlants(), dbLoadPlantingDates()]); }
      catch (e) {
        console.error('load garden data:', e);
        showToast('חלק מהנתונים לא נטענו, אבל אפשר להמשיך לעבוד.');
      }
      try { await dbLoadCareLog(); } catch (e) { console.error('load care log:', e); }

      if (dbPlants !== null) {
        P.length = 0;
        if (dbPlants.length > 0 || localPlantsExist()) dbPlants.forEach(p => P.push(p));
        else {
          for (const p of findDefaultPlants()) {
            P.push(p);
            await dbSavePlant(p);
          }
        }
      }

      Object.keys(plantingDates).forEach(key => delete plantingDates[key]);
      if (dbDates) Object.assign(plantingDates, dbDates);
      loadLocalImages();
      persistLocalGarden();
      renderCurrentGarden('הגינה נטענה בהצלחה!');
    } finally {
      enteringApp = false;
    }
  };

  window.saveAge = function patchedSaveAge(pid) {
    if (typeof cloud.saveAge === 'function') cloud.saveAge(pid);
    persistLocalGarden();
  };
  window.clearAge = function patchedClearAge(pid) {
    if (typeof cloud.clearAge === 'function') cloud.clearAge(pid);
    persistLocalGarden();
  };
  window.savePhotoEdit = function patchedSavePhotoEdit() {
    if (typeof cloud.savePhotoEdit === 'function') cloud.savePhotoEdit();
    persistLocalImages();
  };
  window.confirmResetPlant = function patchedConfirmResetPlant() {
    if (typeof cloud.confirmResetPlant === 'function') cloud.confirmResetPlant();
    persistLocalGarden();
  };

  function cleanAuthUrl() {
    const clean = `${window.location.origin}${window.location.pathname}`;
    if (window.history && window.history.replaceState) window.history.replaceState({}, document.title, clean);
  }
  function readAuthError() {
    const sources = [new URLSearchParams(window.location.search), new URLSearchParams(window.location.hash.replace(/^#/, ''))];
    for (const params of sources) {
      const msg = params.get('error_description') || params.get('error');
      if (msg) return decodeURIComponent(msg.replace(/\+/g, ' '));
    }
    return '';
  }
  async function resumeOAuthSession() {
    if (!_db || localMode) return false;
    const authError = readAuthError();
    if (authError) {
      showAuthError('Google החזיר שגיאה: ' + authError);
      cleanAuthUrl();
      return false;
    }
    try {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code && typeof _db.auth.exchangeCodeForSession === 'function') {
        const { error } = await _db.auth.exchangeCodeForSession(code);
        if (error) {
          showAuthError('לא הצלחנו להשלים התחברות עם Google: ' + error.message);
          return false;
        }
        cleanAuthUrl();
      }
      const { data, error } = await _db.auth.getSession();
      if (error) {
        console.error('getSession:', error.message);
        return false;
      }
      if (data?.session?.user) {
        currentUser = data.session.user;
        await onUserLoggedIn();
        return true;
      }
    } catch (e) {
      console.error('resumeOAuthSession:', e);
    }
    return false;
  }

  function careStorageKey(key) { return currentUser ? `care_${currentUser.id}_${key}` : `care_${key}`; }
  function legacyCareStorageKey(key) { return `care_${key}`; }

  window.dbSaveCareLog = async function patchedDbSaveCareLog(key, val) {
    const storageKey = careStorageKey(key);
    const legacyKey = legacyCareStorageKey(key);
    if (val) {
      localStorage.setItem(storageKey, 'true');
      if (legacyKey !== storageKey) localStorage.removeItem(legacyKey);
    } else {
      localStorage.removeItem(storageKey);
      if (legacyKey !== storageKey) localStorage.removeItem(legacyKey);
    }
    if (!_db || !currentUser || localMode) return;
    try {
      const { error: deleteError } = await _db.from('care_log').delete().eq('key', key).eq('user_id', currentUser.id);
      if (deleteError) return console.error('dbSaveCareLog delete:', deleteError.message);
      if (val) {
        const { error: insertError } = await _db.from('care_log').insert({ key, user_id: currentUser.id, done: true });
        if (insertError) console.error('dbSaveCareLog insert:', insertError.message);
      }
    } catch (e) {
      console.error('dbSaveCareLog:', e);
    }
  };

  window.dbLoadCareLog = async function patchedDbLoadCareLog() {
    Object.keys(CL_DONE).forEach(k => delete CL_DONE[k]);
    const userPrefix = currentUser ? `care_${currentUser.id}_` : 'care_';
    const legacyPattern = /^care_\d+_(prune|fert|supp|crit)_\d+$/;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(userPrefix)) CL_DONE[k.slice(userPrefix.length)] = true;
      else if (currentUser && legacyPattern.test(k)) {
        const legacyKey = k.replace('care_', '');
        CL_DONE[legacyKey] = true;
        localStorage.setItem(careStorageKey(legacyKey), 'true');
        localStorage.removeItem(k);
      }
    }
    if (!_db || !currentUser || localMode) return;
    try {
      const { data, error } = await _db.from('care_log').select('key').eq('user_id', currentUser.id).eq('done', true);
      if (error) return console.error('dbLoadCareLog:', error.message);
      if (data) data.forEach(r => {
        CL_DONE[r.key] = true;
        localStorage.setItem(careStorageKey(r.key), 'true');
      });
    } catch (e) {
      console.error('dbLoadCareLog:', e);
    }
  };

  window.clToggle = function patchedClToggle(pid, type) {
    const k = clKey(pid, type);
    const next = !CL_DONE[k];
    if (next) CL_DONE[k] = true;
    else delete CL_DONE[k];
    dbSaveCareLog(k, next);
    renderChecklist(document.getElementById('pa'));
    updCounts();
  };

  window.clReset = function patchedClReset() {
    const keysToDelete = Object.keys(CL_DONE).filter(k => k.endsWith('_' + CUR));
    keysToDelete.forEach(k => {
      delete CL_DONE[k];
      dbSaveCareLog(k, false);
    });
    renderChecklist(document.getElementById('pa'));
  };

  function getPlantForImage(idOrName) {
    if (typeof idOrName === 'number') return P.find(p => p.id === idOrName) || null;
    return P.find(p => p.name === idOrName) || (typeof CATALOG_ALL !== 'undefined' ? CATALOG_ALL.find(p => p.name === idOrName) : null) || { name: idOrName };
  }
  function imageCacheKey(plant, size) { return `${plant.name}__${size || 'medium'}`; }
  async function fetchWikiThumb(lang, pageName) {
    const cacheKey = `wiki_thumb_${lang}_${pageName}`;
    if (imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
    try {
      const endpoint = `https://${lang}.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageName)}&prop=pageimages&pithumbsize=1000&format=json&origin=*`;
      const resp = await fetch(endpoint, { cache: 'force-cache' });
      const data = await resp.json();
      const pages = data.query?.pages;
      const page = pages ? Object.values(pages)[0] : null;
      const url = page?.thumbnail?.source || null;
      imgCache[cacheKey] = url;
      return url;
    } catch (e) {
      imgCache[cacheKey] = null;
      return null;
    }
  }
  async function resolveMainPlantImage(plant, size = 'medium') {
    if (!plant?.name) return null;
    const customKey = `custom_${plant.id}_${size}`;
    if (plant.id && imgCache[customKey]) return imgCache[customKey];
    const directKey = imageCacheKey(plant, size);
    if (imgCache[directKey] !== undefined) return imgCache[directKey];
    const page = (typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES[plant.name]?.page) || plant.name;
    let url = await fetchWikiThumb('en', page);
    if (!url) url = await fetchWikiThumb('he', plant.name);
    if (!url && typeof fetchCommonsImage === 'function') url = await fetchCommonsImage(`${page} plant`);
    imgCache[directKey] = url || null;
    if (size !== 'medium' && url) imgCache[imageCacheKey(plant, 'medium')] = imgCache[imageCacheKey(plant, 'medium')] || url;
    return imgCache[directKey];
  }
  window.fetchWikiImg = async function patchedFetchWikiImg(plantName, size) {
    return resolveMainPlantImage(getPlantForImage(plantName), size || 'medium');
  };
  window.tryLoadImg = function patchedTryLoadImg(id, size, onSuccess, onFail) {
    const plant = getPlantForImage(id);
    if (!plant) { if (onFail) onFail(); return; }
    resolveMainPlantImage(plant, size || 'medium').then(url => {
      if (url) { if (onSuccess) onSuccess(url); }
      else if (onFail) onFail();
    }).catch(e => {
      console.error('tryLoadImg:', e);
      if (onFail) onFail();
    });
  };

  setTimeout(async function startAuthRecovery() {
    if (_db && await supabaseReachable(2500)) {
      const restored = await resumeOAuthSession();
      if (restored) return;
    }
    if ((hasLocalSession() || (localPlantsExist() && !hasLocalLogout())) && !hasOAuthReturn()) {
      enterLocalMode('הגינה נטענה מהדפדפן');
      return;
    }
    if (_db) await resumeOAuthSession();
  }, 0);

  setTimeout(async function refreshCareLogAfterPatch() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    await dbLoadCareLog();
    if (typeof TF !== 'undefined' && TF === 'alerts') renderChecklist(document.getElementById('pa'));
  }, 0);
}

function installExtraCatalog() {
  if (window.__GAN_EXTRA_CATALOG_INSTALLED) return;
  if (typeof CATALOG_ALL === 'undefined' || typeof PLANT_DB === 'undefined') {
    setTimeout(installExtraCatalog, 80);
    return;
  }
  window.__GAN_EXTRA_CATALOG_INSTALLED = true;

  const profiles = {
    herb: {
      type: 'tropical', bg: 'tropical', lbl: 'צמח תבלין', e: '🌿', floor: 'קומה תחתונה',
      prune: 'קיטום קצוות ופריחה לאורך עונת הצימוח', pm: [3,4,5,6,9,10], pi: 'קל',
      pmth: 'לקטום ענפים צעירים כדי לעודד הסתעפות; להסיר פריחה אם רוצים עלים רכים.',
      fert: 'קומפוסט עדין או דשן אורגני מאוזן במינון נמוך', fm: [3,5,9],
      supp: 'קומפוסט ושכבת חיפוי דקה לשמירת לחות', sm: [3,9],
      rules: 'לגדל באדמה מנוקזת. לקטוף מעט ובתדירות גבוהה במקום גיזום חריף.',
      crit: 'עודף מים גורם לריקבון שורשים ופוגע בארומה.', waterSummer: 6, waterWinter: 1, waterType: 'רדודה',
      light: 'שמש מלאה', lightAlt: 'חצי שמש', climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לרוב אזורי הארץ; בקיץ חם עדיף שמש בוקר והצללה קלה אחר הצהריים.', harvestMonths: [3,4,5,6,7,8,9,10,11],
      winter: 'להפחית השקיה, להגן מרוחות וקור חזק, ולקטוף בעדינות.', summer: 'להשקות בתדירות גבוהה יותר ולחדש חיפוי סביב הצמח.',
      sizes: { small: 'עציץ 1-3 ליטר או שתיל צעיר', medium: 'גוש מפותח בקוטר 30-50 ס״מ', large: 'שיח תבלין מבוסס' }
    },
    leafy: {
      type: 'tropical', bg: 'tropical', lbl: 'ירק עלים', e: '🥬', floor: 'קומה תחתונה',
      prune: 'קטיף עלים חיצוניים לפי צורך', pm: [1,2,3,4,10,11,12], pi: 'קל',
      pmth: 'לקטוף עלים חיצוניים ולהשאיר לב צעיר להמשך צימוח.', fert: 'קומפוסט ודשן עשיר בחנקן במינון מתון', fm: [1,3,10,12],
      supp: 'חיפוי אורגני ושמירה על קרקע לחה', sm: [2,11], rules: 'לשמור על לחות יציבה וקרקע עשירה; בקיץ לגדל בהצללה.',
      crit: 'יובש וחום גורמים לפריחה מוקדמת וטעם מר.', waterSummer: 8, waterWinter: 3, waterType: 'רדודה',
      light: 'חצי שמש', lightAlt: 'שמש מלאה', climate: ['עמיד לקור'], indoor: false,
      geo: 'מתאים במיוחד לעונות קרירות ברוב הארץ; בקיץ רק עם הצללה והשקיה סדירה.', harvestMonths: [1,2,3,4,10,11,12],
      winter: 'עונת גידול טובה; לדאוג לניקוז אחרי גשם.', summer: 'להצליל, להשקות בקביעות, או להחליף במחזור סתיו.',
      sizes: { small: 'שתיל צעיר', medium: 'רוזטה או גוש עלים מפותח', large: 'צמח בוגר לקטיף מתמשך' }
    },
    veg: {
      type: 'tropical', bg: 'tropical', lbl: 'ירק מאכל', e: '🥕', floor: 'קומה תחתונה',
      prune: 'דילול וקטיף בזמן', pm: [1,2,3,10,11,12], pi: 'קל', pmth: 'לדקק שתילים צפופים ולשמור על מרווחים.',
      fert: 'קומפוסט בשל לפני שתילה; דישון קל בלבד בהמשך', fm: [1,10], supp: 'שמירה על קרקע רכה ולחה', sm: [1,11],
      rules: 'לזרוע או לשתול באדמה מאווררת, מנוקזת וללא גושים.', crit: 'השקיה לא אחידה גורמת לפיצול שורשים או עקה.',
      waterSummer: 7, waterWinter: 3, waterType: 'רדודה', light: 'שמש מלאה', lightAlt: 'חצי שמש', climate: ['עמיד לקור'], indoor: false,
      geo: 'עונות קרירות מתאימות במיוחד; באזורים חמים להתחיל בסתיו.', harvestMonths: [1,2,3,4,11,12],
      winter: 'לשמור על ניקוז ולהימנע מהצפה.', summer: 'לרוב לא מומלץ בקיץ מלא ללא הצללה.',
      sizes: { small: 'נבט או שתיל צעיר', medium: 'צמח מפותח לפני קטיף', large: 'מחזור גידול מלא' }
    },
    fruit: {
      type: 'fruit', bg: 'fruit', lbl: 'עץ פרי', e: '🍎', floor: 'קומה עליונה',
      prune: 'גיזום עיצוב אחרי קטיף או בתרדמה לפי סוג העץ', pm: [1,2,7,8], pi: 'בינוני',
      pmth: 'לפתוח מרכז העץ, להסיר ענפים יבשים/חולים ולשמור על כניסת אור ואוורור.', fert: 'קומפוסט ודשן עצי פרי מאוזן בתחילת צימוח ואחרי חנטה', fm: [2,4,9],
      supp: 'חיפוי סביב בית השורשים וברזל/מיקרואלמנטים במקרה של הצהבה', sm: [3,9],
      rules: 'השקיה עמוקה וסדירה, חיפוי, והימנעות מעיבוד קרקע עמוק ליד הגזע.', crit: 'לא להצמיד חיפוי לגזע; לבדוק מזיקים ומחלות בפרי ובעלים.',
      waterSummer: 45, waterWinter: 6, waterType: 'עמוקה', light: 'שמש מלאה', lightAlt: null, climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לגינה ישראלית עם התאמת זן לאזור: חוף, שפלה, הר או בקעה.', harvestMonths: [6,7,8,9],
      winter: 'עונת גיזום/תרדמה בחלק מהעצים; להפחית השקיה לפי גשם.', summer: 'להשקות עמוק, לחפות ולשמור על פרי מחשיפה קיצונית.',
      sizes: { small: 'שתיל עץ צעיר', medium: 'עץ צעיר בתחילת ניבה', large: 'עץ בוגר ומניב' }
    },
    citrus: {
      type: 'fruit', bg: 'citrus', lbl: 'הדר', e: '🍋', floor: 'קומה עליונה',
      prune: 'גיזום קל אחרי קטיף, בעיקר ענפים יבשים וצפופים', pm: [2,3], pi: 'קל',
      pmth: 'לשמור על נוף פתוח, להסיר חזירים וענפים הפונים פנימה.', fert: 'דשן הדרים עם מיקרואלמנטים וברזל לפי צורך', fm: [2,4,6,9],
      supp: 'ברזל כילאטי במקרה של עלים צהובים וחיפוי אורגני', sm: [3,9],
      rules: 'הדרים אוהבים השקיה עמוקה וסדירה וניקוז טוב.', crit: 'רגישים למחסור בברזל, כנימות ועש המנהרות.',
      waterSummer: 50, waterWinter: 8, waterType: 'עמוקה', light: 'שמש מלאה', lightAlt: null, climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לחוף, שפלה ועמקים; באזורים קרים להגן משתילים צעירים.', harvestMonths: [11,12,1,2,3],
      winter: 'עונת קטיף מרכזית; להשקות לפי גשמים ולבדוק ניקוז.', summer: 'השקיה עמוקה וקבועה, במיוחד בעצים צעירים ובעציצים.',
      sizes: { small: 'שתיל הדר צעיר', medium: 'עץ צעיר לפני ניבה מלאה', large: 'עץ הדר בוגר' }
    },
    ornamental: {
      type: 'ornamental', bg: 'ornamental', lbl: 'צמח נוי', e: '🌸', floor: 'קומה תחתונה',
      prune: 'ניקוי פריחות יבשות וגיזום עיצוב קל', pm: [3,4,9,10], pi: 'קל',
      pmth: 'להסיר פרחים יבשים וענפים חלשים כדי לעודד פריחה חדשה.', fert: 'דשן פריחה או קומפוסט עדין בתחילת עונה', fm: [3,5,9],
      supp: 'חיפוי ושיפור קרקע בקומפוסט', sm: [3,9], rules: 'להתאים שמש/צל לפי הצמח ולשמור על ניקוז.',
      crit: 'עודף מים או ניקוז חלש גורמים למחלות שורש.', waterSummer: 8, waterWinter: 2, waterType: 'רדודה',
      light: 'חצי שמש', lightAlt: 'שמש מלאה', climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לרוב אזורי הארץ עם התאמת חשיפה לשמש.', harvestMonths: [],
      winter: 'להפחית השקיה ולהסיר חלקים פגועים אחרי קור.', summer: 'להשקות בבוקר ולהגן מזמן שרב אם הצמח צעיר.',
      sizes: { small: 'שתיל קטן', medium: 'גוש פריחה מפותח', large: 'צמח נוי מבוסס' }
    },
    vine: {
      type: 'ornamental', bg: 'ornamental', lbl: 'מטפס', e: '🌺', floor: 'קומה עליונה',
      prune: 'גיזום עיצוב אחרי פריחה או בסוף חורף', pm: [2,3,9], pi: 'בינוני',
      pmth: 'לקשור לענפים תומכים, לקצר ענפים סוררים ולפתוח צפיפות.', fert: 'קומפוסט ודשן פריחה במנות קטנות', fm: [3,5,9],
      supp: 'תמיכה, קשירה וחיפוי סביב בסיס המטפס', sm: [3,9], rules: 'לספק סבכה/גדר חזקה ולכוון ענפים צעירים.',
      crit: 'מטפסים חזקים עלולים לחנוק צמחים סמוכים אם לא גוזמים.', waterSummer: 18, waterWinter: 4, waterType: 'עמוקה',
      light: 'שמש מלאה', lightAlt: 'חצי שמש', climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לגינות, פרגולות וגדרות ברוב הארץ.', harvestMonths: [], winter: 'זמן טוב לעיצוב מבנה ולניקוי ענפים יבשים.',
      summer: 'להשקות עמוק ולכוון צימוח חדש.', sizes: { small: 'מטפס צעיר', medium: 'כיסוי חלקי של סבכה', large: 'מטפס מבוסס על גדר/פרגולה' }
    },
    shrub: {
      type: 'bush', bg: 'bush', lbl: 'שיח', e: '🌳', floor: 'קומה תחתונה',
      prune: 'גיזום עיצוב וניקוי בסוף חורף ואחרי פריחה', pm: [2,3,9], pi: 'בינוני',
      pmth: 'לקצר ענפים ארוכים, להסיר יבש ולשמור על צורה טבעית.', fert: 'קומפוסט או דשן שחרור איטי באביב ובסתיו', fm: [3,9],
      supp: 'חיפוי אורגני סביב השיח', sm: [3,9], rules: 'השקיה עמוקה בשנים הראשונות; לאחר התבססות לרווח השקיות.',
      crit: 'גיזום חריף מדי בקיץ עלול לגרום לכוויות ולעקה.', waterSummer: 18, waterWinter: 3, waterType: 'עמוקה',
      light: 'שמש מלאה', lightAlt: 'חצי שמש', climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים לרוב אזורי הארץ לפי זן וחשיפה.', harvestMonths: [], winter: 'לנצל לתיקון צורה וניקוי.',
      summer: 'להשקות עמוק בבוקר ולשמור על חיפוי.', sizes: { small: 'שתיל שיח צעיר', medium: 'שיח חצי מבוסס', large: 'שיח בוגר ומלא' }
    },
    ground: {
      type: 'ornamental', bg: 'ornamental', lbl: 'כיסוי קרקע', e: '🍃', floor: 'קומה תחתונה',
      prune: 'דילול וקיטום שולי מרבד לפי צורך', pm: [3,6,9], pi: 'קל',
      pmth: 'לקצר שוליים שנכנסים לשבילים ולדלל אזורים צפופים.', fert: 'קומפוסט עדין בתחילת עונה', fm: [3,9],
      supp: 'חיפוי קל עד שהצמח סוגר שטח', sm: [3], rules: 'לשתול במרווחים נכונים ולשמור על השקיה עד קליטה.',
      crit: 'חלק מכיסויי הקרקע מתפשטים מהר ודורשים גבול ברור.', waterSummer: 10, waterWinter: 2, waterType: 'רדודה',
      light: 'חצי שמש', lightAlt: 'שמש מלאה', climate: ['עמיד לשרב'], indoor: false,
      geo: 'מתאים למדרונות, אדניות ושולי ערוגות.', harvestMonths: [], winter: 'גידול איטי יותר; להפחית השקיה.',
      summer: 'להשקות בתדירות ולגזום שוליים.', sizes: { small: 'שתיל כיסוי צעיר', medium: 'כתם כיסוי מתפשט', large: 'מרבד מבוסס' }
    },
    indoor: {
      type: 'tropical', bg: 'tropical', lbl: 'צמח בית', e: '🪴', floor: 'נספחים',
      prune: 'הסרת עלים יבשים וקיטום עדין לפי צורך', pm: [3,6,9], pi: 'קל',
      pmth: 'לנקות עלים יבשים ולסובב את העציץ לקבלת צימוח מאוזן.', fert: 'דשן צמחי בית מדולל באביב ובקיץ', fm: [3,5,7,9],
      supp: 'ניקוי אבק מהעלים ובדיקת ניקוז בתחתית העציץ', sm: [2,6,10], rules: 'אור מסונן, ניקוז טוב, והשקיה רק כשהשכבה העליונה מתייבשת.',
      crit: 'עודף מים הוא גורם הנזק הנפוץ ביותר בצמחי בית.', waterSummer: 3, waterWinter: 1, waterType: 'רדודה',
      light: 'חצי שמש', lightAlt: 'צל', climate: [], indoor: true,
      geo: 'מתאים לבית מואר, מרפסת מוצלת או פטיו מוגן.', harvestMonths: [], winter: 'להרחיק מקור, להפחית השקיה ולשמור על אור.',
      summer: 'להשקות מעט יותר, בלי שמש ישירה חזקה.', sizes: { small: 'עציץ קטן', medium: 'עציץ בינוני', large: 'צמח בית גדול ומרשים' }
    }
  };

  const defs = [
    { name:'לואיזה', profile:'herb', wiki:'Aloysia citrodora', q:'lemon verbena herb', overrides:{ e:'🌿', lbl:'לואיזה / לימונית', crit:'רגישה לקור חזק; בחורף קר כדאי לגזום רק לאחר סכנת קרה.' } },
    { name:'זעתר', profile:'herb', wiki:'Origanum syriacum', q:'zaatar oregano herb', overrides:{ lbl:'זעתר / אזוב מצוי', waterSummer:4, rules:'שמש מלאה, ניקוז מעולה וגיזום קל אחרי פריחה. מתאים מאוד לגינה ים־תיכונית.' } },
    { name:'זוטה לבנה', profile:'herb', wiki:'Micromeria fruticosa', q:'Micromeria fruticosa', overrides:{ lbl:'זוטה לבנה', waterSummer:4, rules:'צמח חסכן מים לאחר התבססות; לא לפנק בדישון כבד.' } },
    { name:'מליסה', profile:'herb', wiki:'Melissa officinalis', q:'lemon balm herb', overrides:{ lbl:'מליסה רפואית', light:'חצי שמש', waterSummer:7, crit:'בקיץ חם עדיף צל חלקי כדי למנוע צריבת עלים.' } },
    { name:'גרניום לימוני', profile:'herb', wiki:'Pelargonium graveolens', q:'scented geranium lemon', overrides:{ lbl:'פלרגוניום ריחני', e:'🌸', prune:'קיטום וגיזום עיצוב באביב ובסתיו', waterSummer:5 } },
    { name:'ארטישוק', profile:'veg', wiki:'Artichoke', q:'artichoke plant', overrides:{ lbl:'ירק רב־שנתי', e:'🌱', waterSummer:12, waterWinter:4, harvestMonths:[3,4,5], prune:'הסרת עלים יבשים וגבעולי פריחה אחרי קטיף', pm:[5,6], rules:'זקוק למקום רחב, שמש מלאה וקרקע עשירה.' } },
    { name:'סלרי', profile:'leafy', wiki:'Celery', q:'celery plant', overrides:{ lbl:'סלרי', waterSummer:10, crit:'לא לתת לקרקע להתייבש; יובש יוצר סיבים וטעם חריף.' } },
    { name:'כרפס', profile:'leafy', wiki:'Apium graveolens', q:'leaf celery plant', overrides:{ lbl:'כרפס עלים', waterSummer:9, harvestMonths:[1,2,3,4,11,12] } },
    { name:'קייל', profile:'leafy', wiki:'Kale', q:'kale plant', overrides:{ lbl:'קייל', e:'🥬', climate:['עמיד לקור'], harvestMonths:[1,2,3,4,11,12] } },
    { name:'מנגולד', profile:'leafy', wiki:'Chard', q:'swiss chard plant', overrides:{ lbl:'מנגולד', harvestMonths:[1,2,3,4,5,10,11,12] } },
    { name:'צנונית', profile:'veg', wiki:'Radish', q:'radish plant', overrides:{ lbl:'צנונית', e:'🥕', harvestMonths:[1,2,3,11,12], rules:'מחזור קצר; לזרוע במנות קטנות כל שבועיים בעונה קרירה.' } },
    { name:'משמש', profile:'fruit', wiki:'Apricot', q:'apricot tree fruit', overrides:{ lbl:'עץ פרי נשיר', harvestMonths:[5,6], climate:['עמיד לקור'], winter:'עץ נשיר; זמן טוב לגיזום פתיחה וריסוס חורפי לפי צורך.' } },
    { name:'לימון', profile:'citrus', wiki:'Lemon', q:'lemon tree', overrides:{ lbl:'הדר לימון', e:'🍋', harvestMonths:[1,2,3,4,8,9,10,11,12] } },
    { name:'קלמנטינה', profile:'citrus', wiki:'Clementine', q:'clementine tree', overrides:{ lbl:'הדר קלמנטינה', e:'🍊', harvestMonths:[11,12,1,2] } },
    { name:'גויאבה', profile:'fruit', wiki:'Guava', q:'guava tree fruit', overrides:{ lbl:'עץ פרי סובטרופי', harvestMonths:[8,9,10,11], waterSummer:40, crit:'רגישה לקור חזק בשנים הראשונות.' } },
    { name:'אפרסמון', profile:'fruit', wiki:'Persimmon', q:'persimmon tree fruit', overrides:{ lbl:'עץ פרי נשיר', harvestMonths:[10,11,12], climate:['עמיד לקור'] } },
    { name:'אנונה', profile:'fruit', wiki:'Annona', q:'annona custard apple tree', overrides:{ lbl:'עץ פרי סובטרופי', harvestMonths:[9,10,11], waterSummer:38, crit:'רגישה לקרה; עדיף מקום מוגן מרוחות קרות.' } },
    { name:'פיטנגו', profile:'fruit', wiki:'Eugenia uniflora', q:'surinam cherry tree', overrides:{ lbl:'שיח/עץ פרי', e:'🍒', harvestMonths:[4,5,6,9,10], waterSummer:25, pm:[2,8], pi:'קל' } },
    { name:'קרמבולה', profile:'fruit', wiki:'Carambola', q:'star fruit tree', overrides:{ lbl:'עץ פרי טרופי', e:'⭐', harvestMonths:[8,9,10,11], waterSummer:45, crit:'רגישה לקור ולקרקע גירנית; לעקוב אחרי הצהבות.' } },
    { name:'שזיף', profile:'fruit', wiki:'Plum', q:'plum tree fruit', overrides:{ lbl:'עץ פרי נשיר', harvestMonths:[6,7,8], climate:['עמיד לקור'] } },
    { name:'תפוח', profile:'fruit', wiki:'Apple', q:'apple tree fruit', overrides:{ lbl:'עץ פרי נשיר', e:'🍎', harvestMonths:[8,9,10], climate:['עמיד לקור'], geo:'מתאים במיוחד לאזורים קרירים והרריים; בשפלה לבחור זנים דלי קור.' } },
    { name:'ורד', profile:'ornamental', wiki:'Rose', q:'rose bush flower', overrides:{ type:'bush', bg:'bush', lbl:'שיח ורדים', e:'🌹', prune:'גיזום חורפי משמעותי וניקוי פריחות לאורך העונה', pm:[1,2,5,7,10], pi:'בינוני', waterSummer:12, crit:'לבדוק קימחון, כנימות וחילדון; להשקות בבסיס ולא על העלים.' } },
    { name:'אמנון ותמר', profile:'ornamental', wiki:'Pansy', q:'pansy flowers', overrides:{ lbl:'פרח עונתי חורפי', climate:['עמיד לקור'], harvestMonths:[], pm:[1,2,3,11,12], fm:[11,1], waterSummer:5, waterWinter:2, winter:'עונת פריחה מרכזית.', summer:'לרוב מסיים מחזור בחום הקיץ.' } },
    { name:'בגוניה', profile:'ornamental', wiki:'Begonia', q:'begonia flowers', overrides:{ lbl:'בגוניה פורחת', light:'חצי שמש', lightAlt:'צל', waterSummer:7, crit:'רגישה לשמש ישירה חזקה ולעודף מים.' } },
    { name:'סיגלית אוסטרלית', profile:'ground', wiki:'Viola hederacea', q:'Australian violet plant', overrides:{ lbl:'כיסוי קרקע מוצל', e:'🌼', light:'צל', lightAlt:'חצי שמש', waterSummer:8 } },
    { name:'וינקה', profile:'ornamental', wiki:'Catharanthus roseus', q:'vinca catharanthus flower', overrides:{ lbl:'וינקה / קתרנתוס', light:'שמש מלאה', waterSummer:6, crit:'לא אוהבת עודף מים; להקפיד על ניקוז.' } },
    { name:'דיכונדרה', profile:'ground', wiki:'Dichondra', q:'dichondra groundcover', overrides:{ lbl:'כיסוי קרקע', e:'🍃', light:'חצי שמש', waterSummer:9 } },
    { name:'לפופית הבטטה', profile:'ground', wiki:'Ipomoea batatas', q:'sweet potato vine ornamental', overrides:{ lbl:'כיסוי קרקע/נשפך', e:'🍠', light:'שמש מלאה', waterSummer:12, prune:'קיטום שלוחות לפי צורך', pm:[3,5,7,9] } },
    { name:'מנדווילה', profile:'vine', wiki:'Mandevilla', q:'mandevilla vine flower', overrides:{ lbl:'מטפס פורח', e:'🌺', waterSummer:16, crit:'רגישה לקור; בחורף קר להגן או להעביר למקום מוגן.' } },
    { name:'ויסטריה', profile:'vine', wiki:'Wisteria', q:'wisteria vine flowers', overrides:{ lbl:'מטפס נשיר', e:'💜', pm:[1,2,7], climate:['עמיד לקור'], crit:'מטפס חזק מאוד; דורש תמיכה יציבה וגיזום קבוע.' } },
    { name:'יערה', profile:'vine', wiki:'Honeysuckle', q:'honeysuckle vine flower', overrides:{ lbl:'מטפס ריחני', e:'🌼', light:'שמש מלאה', lightAlt:'חצי שמש', waterSummer:14 } },
    { name:'טקומית הכף', profile:'shrub', wiki:'Tecoma capensis', q:'cape honeysuckle tecoma capensis', overrides:{ lbl:'שיח/מטפס פורח', e:'🧡', type:'bush', bg:'bush', waterSummer:16, prune:'גיזום אחרי גלי פריחה לשמירת צורה' } },
    { name:'דורנטה', profile:'shrub', wiki:'Duranta erecta', q:'duranta erecta shrub', overrides:{ lbl:'שיח פורח', e:'🟣', crit:'הפירות אינם למאכל; להרחיק מילדים וחיות מחמד.' } },
    { name:'מורן החורש', profile:'shrub', wiki:'Viburnum tinus', q:'viburnum tinus shrub', overrides:{ lbl:'שיח ירוק־עד', e:'🌳', light:'חצי שמש', climate:['עמיד לקור'] } },
    { name:'ננדינה', profile:'shrub', wiki:'Nandina domestica', q:'nandina domestica shrub', overrides:{ lbl:'שיח נוי', e:'🍂', light:'חצי שמש', waterSummer:12 } },
    { name:'בן עוזרר הודי', profile:'shrub', wiki:'Rhaphiolepis indica', q:'rhaphiolepis indica shrub', overrides:{ lbl:'שיח ירוק־עד', e:'🌸', waterSummer:12, climate:['עמיד לשרב'] } },
    { name:'אפטניה', profile:'ground', wiki:'Aptenia cordifolia', q:'aptenia cordifolia groundcover', overrides:{ lbl:'סוקולנט כיסוי קרקע', e:'🌸', waterSummer:4, waterWinter:1, rules:'חסכונית במים לאחר קליטה; מתאימה לשמש וניקוז טוב.' } },
    { name:'מונסטרה', profile:'indoor', wiki:'Monstera deliciosa', q:'monstera deliciosa plant', overrides:{ lbl:'מונסטרה', e:'🪴', waterSummer:4, light:'חצי שמש', lightAlt:'צל', crit:'לא שמש ישירה חזקה; להשקות רק לאחר התייבשות חלקית.' } },
    { name:'פוטוס', profile:'indoor', wiki:'Epipremnum aureum', q:'pothos plant', overrides:{ lbl:'פוטוס', e:'🪴', waterSummer:3, light:'צל', lightAlt:'חצי שמש', rules:'מתאים מאוד לבית; אפשר לגדל כמטפס או נשפך.' } },
    { name:'פילודנדרון', profile:'indoor', wiki:'Philodendron', q:'philodendron houseplant', overrides:{ lbl:'פילודנדרון', e:'🪴', light:'חצי שמש', lightAlt:'צל' } },
    { name:'קלתאה', profile:'indoor', wiki:'Calathea', q:'calathea plant', overrides:{ lbl:'קלתאה', e:'🪴', light:'צל', waterSummer:4, crit:'רגישה למים קשים, יובש ושמש ישירה; אוהבת לחות גבוהה.' } },
    { name:'דיפנבכיה', profile:'indoor', wiki:'Dieffenbachia', q:'dieffenbachia plant', overrides:{ lbl:'דיפנבכיה', e:'🪴', crit:'רעילה בבליעה ומגרה עור; להרחיק מילדים וחיות מחמד.' } },
    { name:'פיקוס גומי', profile:'indoor', wiki:'Ficus elastica', q:'rubber plant ficus elastica', overrides:{ lbl:'פיקוס גומי', e:'🪴', light:'חצי שמש', waterSummer:4, sizes:{ small:'עציץ צעיר', medium:'צמח בית בגובה 60-120 ס״מ', large:'צמח בית גדול / עץ קטן' } } },
    { name:'אלוקסיה', profile:'indoor', wiki:'Alocasia', q:'alocasia plant', overrides:{ lbl:'אלוקסיה', e:'🪴', light:'חצי שמש', waterSummer:4, crit:'אוהבת לחות וניקוז; רגישה לקור ולעודף מים.' } },
    { name:'בגוניה עלים', profile:'indoor', wiki:'Begonia rex', q:'rex begonia foliage', overrides:{ lbl:'בגוניה עלים', e:'🪴', light:'חצי שמש', lightAlt:'צל', waterSummer:3, crit:'לא להרטיב עלים באופן קבוע; לשמור על אוורור וניקוז.' } }
  ];

  const extraPlants = defs.map((def, idx) => {
    const base = { ...profiles[def.profile] };
    const overrides = def.overrides || {};
    const plant = { ...base, ...overrides };
    plant.id = 9000 + idx;
    plant.name = def.name;
    plant.type = overrides.type || base.type;
    plant.bg = overrides.bg || base.bg || plant.type;
    plant.lbl = overrides.lbl || base.lbl;
    plant.e = overrides.e || base.e;
    plant.floor = overrides.floor || base.floor;
    plant.pm = [...(plant.pm || [])];
    plant.fm = [...(plant.fm || [])];
    plant.sm = [...(plant.sm || [])];
    plant.climate = [...(plant.climate || [])];
    plant.harvestMonths = [...(plant.harvestMonths || [])];
    plant.sizes = { ...(plant.sizes || {}) };
    plant.custom = false;
    return plant;
  });

  const byName = new Map(extraPlants.map(p => [normalizeName(p.name), p]));
  const wikiMap = Object.fromEntries(defs.map(def => [def.name, def.wiki]));
  const queryMap = Object.fromEntries(defs.map(def => [def.name, def.q || def.wiki || def.name]));

  const existingCatalogNames = new Set(CATALOG_ALL.map(p => p.name));
  extraPlants.forEach(plant => {
    if (!existingCatalogNames.has(plant.name)) CATALOG_ALL.push(clonePlant(plant));
  });

  const existingDbNames = new Set(PLANT_DB.map(p => p.name));
  extraPlants.forEach(plant => {
    if (!existingDbNames.has(plant.name)) {
      PLANT_DB.push({ name: plant.name, alt: wikiMap[plant.name] || plant.name, e: plant.e, type: plant.type, floor: plant.floor, lbl: plant.lbl });
    }
  });

  if (typeof WIKI_PAGES !== 'undefined') {
    Object.entries(wikiMap).forEach(([name, page]) => {
      WIKI_PAGES[name] = { page, small: `${page} young plant`, large: `${page} mature plant` };
    });
  }

  installExtraImageFallbacks(extraPlants, queryMap);
  patchAddPlantFlow(byName);

  if (typeof render === 'function') {
    try { render(); } catch (e) { console.error('render after extra catalog:', e); }
  }
}

function normalizeName(value) {
  return String(value || '').replace(/["'׳״]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function clonePlant(value) {
  return JSON.parse(JSON.stringify(value));
}

function installExtraImageFallbacks(extraPlants, queryMap) {
  if (document.getElementById('gan-extra-catalog-style')) return;
  const style = document.createElement('style');
  style.id = 'gan-extra-catalog-style';
  style.textContent = extraPlants.map(plant => {
    const query = String(queryMap[plant.name] || plant.name).replace(/\s+/g, ',');
    const safeName = plant.name.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `img[alt="${safeName}"] + .img-bg{background-image:url("https://loremflickr.com/900/650/${encodeURIComponent(query)}")!important}`;
  }).join('\n');
  document.head.appendChild(style);
}

function patchAddPlantFlow(byName) {
  if (window.__GAN_EXTRA_ADD_FLOW_PATCHED) return;
  window.__GAN_EXTRA_ADD_FLOW_PATCHED = true;

  function findExtra(input) {
    const key = normalizeName(typeof input === 'string' ? input : input?.name);
    if (!key) return null;
    if (byName.has(key)) return byName.get(key);
    return Array.from(byName.values()).find(p => normalizeName(p.name).includes(key) || key.includes(normalizeName(p.name))) || null;
  }

  function nextPlantId() {
    const ids = Array.isArray(P) ? P.map(p => Number(p.id) || 0) : [];
    return Math.max(0, ...ids, Date.now() % 100000) + 1;
  }

  function buildPendingPlant(extra) {
    const plant = clonePlant(extra);
    plant.id = nextPlantId();
    plant.custom = true;
    return plant;
  }

  async function showExtraResult(extra) {
    AP_pending = buildPendingPlant(extra);
    if (typeof showAPResult === 'function') showAPResult(AP_pending);
    const result = document.getElementById('ap-result');
    if (result) result.style.display = 'block';
    if (typeof showToast === 'function') showToast('מילאנו פרטי טיפול מלאים מהמאגר הישראלי.');
  }

  const originalQuickAddFromTemplate = window.quickAddFromTemplate;
  if (typeof originalQuickAddFromTemplate === 'function') {
    window.quickAddFromTemplate = async function patchedQuickAddFromTemplate(template) {
      const extra = findExtra(template);
      if (extra) return showExtraResult(extra);
      return originalQuickAddFromTemplate.apply(this, arguments);
    };
  }

  const originalQuickAddFromDB = window.quickAddFromDB;
  if (typeof originalQuickAddFromDB === 'function') {
    window.quickAddFromDB = async function patchedQuickAddFromDB(template) {
      const extra = findExtra(template);
      if (extra) return showExtraResult(extra);
      return originalQuickAddFromDB.apply(this, arguments);
    };
  }

  const originalSelectACItem = window.selectACItem;
  if (typeof originalSelectACItem === 'function') {
    window.selectACItem = function patchedSelectACItem(idx) {
      const item = (typeof AC_results !== 'undefined' && AC_results && AC_results[idx]) ? AC_results[idx] : null;
      const extra = findExtra(item);
      if (extra) return showExtraResult(extra);
      return originalSelectACItem.apply(this, arguments);
    };
  }

  const originalClassifyPlant = window.classifyPlant;
  if (typeof originalClassifyPlant === 'function') {
    window.classifyPlant = async function patchedClassifyPlant() {
      const input = document.getElementById('ap-name-input');
      const extra = findExtra(input?.value);
      if (extra) return showExtraResult(extra);
      return originalClassifyPlant.apply(this, arguments);
    };
  }
}
