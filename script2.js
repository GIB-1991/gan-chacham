(function () {
  const APP_VERSION = 'local-save-fix-20260506';
  const hostScript = document.currentScript;
  const mainScript = document.createElement('script');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');

  window.__GAN_PATCH_VERSION = APP_VERSION;
  window.onAuthSubmit = showAppLoadingError;
  window.loginWithGoogle = showAppLoadingError;

  if (authSubmitBtn) authSubmitBtn.disabled = true;
  if (googleBtn) googleBtn.disabled = true;

  mainScript.src = `script.js?v=${APP_VERSION}`;
  mainScript.onload = installRuntimeFixes;
  mainScript.onerror = function () {
    console.error('Failed to load script.js');
    showAppLoadingError('לא ניתן לטעון את האפליקציה. נסה לרענן את הדף.');
    if (authSubmitBtn) authSubmitBtn.disabled = false;
    if (googleBtn) googleBtn.disabled = false;
  };

  if (hostScript && hostScript.parentNode) {
    hostScript.parentNode.insertBefore(mainScript, hostScript.nextSibling);
  } else {
    document.body.appendChild(mainScript);
  }
})();

function showAppLoadingError(msg = 'האפליקציה עדיין נטענת. נסה שוב בעוד רגע.') {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.color = '#dc2626';
  el.style.display = 'block';
}

function installRuntimeFixes() {
  const originalShowAuthError = window.showAuthError;
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');
  const cloud = {
    dbSavePlant: window.dbSavePlant,
    dbDeletePlant: window.dbDeletePlant,
    dbLoadPlants: window.dbLoadPlants,
    dbSavePlantingDate: window.dbSavePlantingDate,
    dbDeletePlantingDate: window.dbDeletePlantingDate,
    dbLoadPlantingDates: window.dbLoadPlantingDates,
    dbSaveCareLog: window.dbSaveCareLog,
    dbLoadCareLog: window.dbLoadCareLog,
    loginWithEmail: window.loginWithEmail,
    registerWithEmail: window.registerWithEmail,
    logout: window.logout,
    saveAge: window.saveAge,
    clearAge: window.clearAge,
    savePhotoEdit: window.savePhotoEdit,
    confirmResetPlant: window.confirmResetPlant
  };

  const LOCAL_PLANTS_KEY = 'gan_chacham_local_plants_v2';
  const LOCAL_DATES_KEY = 'gan_chacham_local_planting_dates_v2';
  const LOCAL_IMAGES_KEY = 'gan_chacham_local_images_v2';
  let enteringApp = false;
  let localMode = false;

  if (authSubmitBtn) authSubmitBtn.disabled = false;
  if (googleBtn) googleBtn.disabled = false;

  window.showAuthError = function patchedShowAuthError(msg, isError = true) {
    if (typeof originalShowAuthError === 'function') {
      originalShowAuthError(msg, isError);
      return;
    }

    const el = document.getElementById('auth-error');
    if (!el) return;
    el.textContent = msg;
    el.style.color = isError ? '#dc2626' : '#166534';
    el.style.display = 'block';
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.error('loadJson:', key, e);
      return fallback;
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function localPlantsExist() {
    return localStorage.getItem(LOCAL_PLANTS_KEY) !== null;
  }

  function localDatesExist() {
    return localStorage.getItem(LOCAL_DATES_KEY) !== null;
  }

  function readLocalPlants() {
    const plants = loadJson(LOCAL_PLANTS_KEY, []);
    return Array.isArray(plants) ? plants : [];
  }

  function readLocalDates() {
    const dates = loadJson(LOCAL_DATES_KEY, {});
    return dates && typeof dates === 'object' ? dates : {};
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
      if (typeof showToast === 'function') {
        showToast('לא הצלחנו לשמור בדפדפן. ייתכן שהאחסון המקומי מלא.');
      }
    }
  }

  function loadLocalGarden() {
    const storedPlants = readLocalPlants();
    const storedDates = readLocalDates();

    if (localPlantsExist()) {
      P.length = 0;
      storedPlants.forEach(p => P.push(p));
    }

    Object.keys(plantingDates).forEach(key => delete plantingDates[key]);
    Object.assign(plantingDates, storedDates);
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
    try { _db = null; } catch (e) {}
    try { currentUser = { id: 'local-offline', email: 'מצב מקומי', user_metadata: { full_name: 'מצב מקומי' } }; } catch (e) {}
    loadLocalGarden();
    renderCurrentGarden(reason || 'האפליקציה נפתחה במצב מקומי');
  }

  async function supabaseReachable(timeoutMs = 3500) {
    if (typeof SUPABASE_URL === 'undefined') return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal
      });
      return !!res;
    } catch (e) {
      console.error('supabaseReachable:', e);
      return false;
    } finally {
      clearTimeout(timer);
    }
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
    if (localMode || !_db || !currentUser || typeof cloud.dbLoadPlants !== 'function') {
      return localPlantsExist() ? clone(readLocalPlants()) : null;
    }

    try {
      const remotePlants = await cloud.dbLoadPlants();
      if (Array.isArray(remotePlants)) {
        if (remotePlants.length > 0) {
          saveJson(LOCAL_PLANTS_KEY, remotePlants);
          return clone(remotePlants);
        }
        if (localPlantsExist()) return clone(readLocalPlants());
        saveJson(LOCAL_PLANTS_KEY, []);
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
    if (localMode || !_db || !currentUser || typeof cloud.dbLoadPlantingDates !== 'function') {
      return clone(readLocalDates());
    }

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
        options: {
          redirectTo: returnUrl.toString(),
          queryParams: { prompt: 'select_account' }
        }
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

    try {
      await cloud.loginWithEmail(email, password);
    } catch (e) {
      console.error('loginWithEmail:', e);
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
    }
  };

  window.registerWithEmail = async function patchedRegisterWithEmail(email, password) {
    if (!_db || !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }

    try {
      await cloud.registerWithEmail(email, password);
    } catch (e) {
      console.error('registerWithEmail:', e);
      showAuthError('לא הצלחנו להשלים הרשמה כרגע. אפשר להמשיך במצב מקומי.');
    }
  };

  window.logout = async function patchedLogout() {
    if (localMode || !_db || typeof cloud.logout !== 'function') {
      currentUser = null;
      localMode = false;
      showAuthScreen();
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
      try {
        currentUser = currentUser || (await _db.auth.getUser()).data.user;
      } catch (e) {
        console.error('getUser:', e);
      }

      if (!currentUser) {
        showAuthScreen();
        return;
      }

      renderUserHeader(currentUser);
      hideAuthScreen();
      showToast('טוען את הגינה שלך...');

      let dbPlants = null;
      let dbDates = {};

      try {
        [dbPlants, dbDates] = await Promise.all([dbLoadPlants(), dbLoadPlantingDates()]);
      } catch (e) {
        console.error('load garden data:', e);
        showToast('חלק מהנתונים לא נטענו, אבל אפשר להמשיך לעבוד.');
      }

      try {
        await dbLoadCareLog();
      } catch (e) {
        console.error('load care log:', e);
      }

      if (dbPlants !== null) {
        P.length = 0;
        if (dbPlants.length > 0 || localPlantsExist()) {
          dbPlants.forEach(p => P.push(p));
        } else {
          const CATALOG = getAllCatalogPlants();
          const defaultNames = ['לימון ננסי', 'תפוז טבורי', 'אורן ירושלים', 'נענע'];
          const seeds = defaultNames.map(n => CATALOG.find(p => p.name === n)).filter(Boolean);
          for (const p of seeds) {
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
    if (window.history && window.history.replaceState) {
      window.history.replaceState({}, document.title, clean);
    }
  }

  function readAuthError() {
    const sources = [
      new URLSearchParams(window.location.search),
      new URLSearchParams(window.location.hash.replace(/^#/, ''))
    ];

    for (const params of sources) {
      const msg = params.get('error_description') || params.get('error');
      if (msg) return decodeURIComponent(msg.replace(/\+/g, ' '));
    }

    return '';
  }

  async function resumeOAuthSession() {
    if (!_db || localMode) return;

    const authError = readAuthError();
    if (authError) {
      showAuthError('Google החזיר שגיאה: ' + authError);
      cleanAuthUrl();
      return;
    }

    try {
      const code = new URLSearchParams(window.location.search).get('code');
      if (code && typeof _db.auth.exchangeCodeForSession === 'function') {
        const { error } = await _db.auth.exchangeCodeForSession(code);
        if (error) {
          showAuthError('לא הצלחנו להשלים התחברות עם Google: ' + error.message);
          return;
        }
        cleanAuthUrl();
      }

      const { data, error } = await _db.auth.getSession();
      if (error) {
        console.error('getSession:', error.message);
        return;
      }

      if (data?.session?.user) {
        currentUser = data.session.user;
        await onUserLoggedIn();
      }
    } catch (e) {
      console.error('resumeOAuthSession:', e);
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
    }
  }

  function careStorageKey(key) {
    return currentUser ? `care_${currentUser.id}_${key}` : `care_${key}`;
  }

  function legacyCareStorageKey(key) {
    return `care_${key}`;
  }

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
      const { error: deleteError } = await _db.from('care_log').delete()
        .eq('key', key)
        .eq('user_id', currentUser.id);

      if (deleteError) {
        console.error('dbSaveCareLog delete:', deleteError.message);
        return;
      }

      if (val) {
        const { error: insertError } = await _db.from('care_log')
          .insert({ key, user_id: currentUser.id, done: true });
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

      if (k.startsWith(userPrefix)) {
        CL_DONE[k.slice(userPrefix.length)] = true;
      } else if (currentUser && legacyPattern.test(k)) {
        const legacyKey = k.replace('care_', '');
        CL_DONE[legacyKey] = true;
        localStorage.setItem(careStorageKey(legacyKey), 'true');
        localStorage.removeItem(k);
      }
    }

    if (!_db || !currentUser || localMode) return;

    try {
      const { data, error } = await _db.from('care_log').select('key')
        .eq('user_id', currentUser.id)
        .eq('done', true);

      if (error) {
        console.error('dbLoadCareLog:', error.message);
        return;
      }

      if (data) {
        data.forEach(r => {
          CL_DONE[r.key] = true;
          localStorage.setItem(careStorageKey(r.key), 'true');
        });
      }
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

  setTimeout(async function startAuthRecovery() {
    if (_db && !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    await resumeOAuthSession();
  }, 0);

  setTimeout(async function refreshCareLogAfterPatch() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    await dbLoadCareLog();
    if (typeof TF !== 'undefined' && TF === 'alerts') {
      renderChecklist(document.getElementById('pa'));
    }
  }, 0);
}
