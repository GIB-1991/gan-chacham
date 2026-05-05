(function () {
  const hostScript = document.currentScript;
  const mainScript = document.createElement('script');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');

  window.onAuthSubmit = showAppLoadingError;
  window.loginWithGoogle = showAppLoadingError;
  if (authSubmitBtn) authSubmitBtn.disabled = true;
  if (googleBtn) googleBtn.disabled = true;

  mainScript.src = 'script.js?v=local-save-fix-20260505';
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

  function persistLocalImages() {
    try {
      const customImages = {};
      Object.keys(imgCache || {}).forEach(key => {
        if (key.startsWith('custom_') && imgCache[key]) customImages[key] = imgCache[key];
      });
      localStorage.setItem(LOCAL_IMAGES_KEY, JSON.stringify(customImages));
    } catch (e) {
      console.error('persistLocalImages:', e);
    }
  }

  function loadLocalImages() {
    const customImages = loadJson(LOCAL_IMAGES_KEY, {});
    Object.keys(customImages).forEach(key => { imgCache[key] = customImages[key]; });
  }

  function persistLocalGarden() {
    try {
      localStorage.setItem(LOCAL_PLANTS_KEY, JSON.stringify(P));
      localStorage.setItem(LOCAL_DATES_KEY, JSON.stringify(plantingDates));
      persistLocalImages();
    } catch (e) {
      console.error('persistLocalGarden:', e);
      showToast('לא הצלחנו לשמור בדפדפן. ייתכן שהאחסון המקומי מלא.');
    }
  }

  function loadLocalGarden() {
    const storedPlants = loadJson(LOCAL_PLANTS_KEY, null);
    const storedDates = loadJson(LOCAL_DATES_KEY, {});

    if (Array.isArray(storedPlants)) {
      P.length = 0;
      storedPlants.forEach(p => P.push(p));
    }

    Object.keys(plantingDates).forEach(key => delete plantingDates[key]);
    if (storedDates && typeof storedDates === 'object') Object.assign(plantingDates, storedDates);
    loadLocalImages();
  }

  function localPlantsExist() {
    return localStorage.getItem(LOCAL_PLANTS_KEY) !== null;
  }

  window.dbSavePlant = async function patchedDbSavePlant(plant) {
    const idx = P.findIndex(p => p.id === plant.id);
    if (idx >= 0) P[idx] = { ...P[idx], ...plant };
    else P.push(plant);
    persistLocalGarden();

    if (!_db || !currentUser || localMode) return;
    try { await cloud.dbSavePlant(plant); } catch (e) { console.error('dbSavePlant cloud:', e); }
  };

  window.dbDeletePlant = async function patchedDbDeletePlant(id) {
    persistLocalGarden();
    if (!_db || !currentUser || localMode) return;
    try { await cloud.dbDeletePlant(id); } catch (e) { console.error('dbDeletePlant cloud:', e); }
  };

  window.dbLoadPlants = async function patchedDbLoadPlants() {
    if (localMode || !_db || !currentUser) {
      if (!localPlantsExist()) return null;
      return clone(loadJson(LOCAL_PLANTS_KEY, []));
    }

    try { return await cloud.dbLoadPlants(); } catch (e) {
      console.error('dbLoadPlants cloud:', e);
      if (!localPlantsExist()) return null;
      return clone(loadJson(LOCAL_PLANTS_KEY, []));
    }
  };

  window.dbSavePlantingDate = async function patchedDbSavePlantingDate(plantId, dateStr) {
    plantingDates[plantId] = dateStr;
    persistLocalGarden();
    if (!_db || !currentUser || localMode) return;
    try { await cloud.dbSavePlantingDate(plantId, dateStr); } catch (e) { console.error('dbSavePlantingDate cloud:', e); }
  };

  window.dbDeletePlantingDate = async function patchedDbDeletePlantingDate(plantId) {
    delete plantingDates[plantId];
    persistLocalGarden();
    if (!_db || !currentUser || localMode) return;
    try { await cloud.dbDeletePlantingDate(plantId); } catch (e) { console.error('dbDeletePlantingDate cloud:', e); }
  };

  window.dbLoadPlantingDates = async function patchedDbLoadPlantingDates() {
    if (localMode || !_db || !currentUser) return clone(loadJson(LOCAL_DATES_KEY, {}));

    try { return await cloud.dbLoadPlantingDates(); } catch (e) {
      console.error('dbLoadPlantingDates cloud:', e);
      return clone(loadJson(LOCAL_DATES_KEY, {}));
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

  async function supabaseReachable(timeoutMs = 3500) {
    if (typeof SUPABASE_URL === 'undefined') return false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal
      });
      return true;
    } catch (e) {
      console.error('supabaseReachable:', e);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  function enterLocalMode(reason) {
    localMode = true;
    try { _db = null; } catch (e) {}
    try { currentUser = { id: 'local-offline', email: 'מצב מקומי' }; } catch (e) {}
    loadLocalGarden();

    hideAuthScreen();
    renderUserHeader(currentUser);
    document.getElementById('monthPill').textContent = `📅 ${MHE[CUR - 1]} ${NOW.getFullYear()}`;
    document.getElementById('msel').value = 0;
    updCounts();
    renderAlerts();
    render();
    showToast(reason || 'האפליקציה נפתחה במצב מקומי');
  }

  window.loginWithGoogle = async function patchedLoginWithGoogle() {
    if (!_db) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }

    const reachable = await supabaseReachable();
    if (!reachable) {
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
      showAuthError('לא הצלחנו לפתוח התחברות עם Google. נסה שוב בעוד רגע.');
    }
  };

  window.loginWithEmail = async function patchedLoginWithEmail(email, password) {
    if (!_db) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }

    try {
      setAuthLoading(true);
      const { data, error } = await _db.auth.signInWithPassword({ email, password });
      setAuthLoading(false);

      if (error) {
        showAuthError(error.message);
        return;
      }

      currentUser = data.user;
      await onUserLoggedIn();
    } catch (e) {
      setAuthLoading(false);
      console.error('loginWithEmail:', e);
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
    }
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
          const defaultNames = ['לימון ננסי', 'תפוז טבורי', 'אורן ירושליים', 'נענע'];
          const seeds = defaultNames.map(n => CATALOG.find(p => p.name === n)).filter(Boolean);
          for (const p of seeds) {
            P.push(p);
            await dbSavePlant(p);
          }
        }
      }

      if (dbDates) Object.assign(plantingDates, dbDates);
      loadLocalImages();

      document.getElementById('monthPill').textContent = `📅 ${MHE[CUR - 1]} ${NOW.getFullYear()}`;
      document.getElementById('msel').value = 0;
      updCounts();
      renderAlerts();
      render();
      showToast('הגינה נטענה בהצלחה!');
    } finally {
      enteringApp = false;
    }
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

  setTimeout(async function startAuthRecovery() {
    if (_db && !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    await resumeOAuthSession();
  }, 0);

  function careStorageKey(key) {
    return currentUser ? `care_${currentUser.id}_${key}` : `care_${key}`;
  }

  function legacyCareStorageKey(key) {
    return `care_${key}`;
  }

  window.dbSaveCareLog = async function dbSaveCareLog(key, val) {
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

  window.dbLoadCareLog = async function dbLoadCareLog() {
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

  window.clToggle = function clToggle(pid, type) {
    const k = clKey(pid, type);
    const next = !CL_DONE[k];

    if (next) CL_DONE[k] = true;
    else delete CL_DONE[k];

    dbSaveCareLog(k, next);
    renderChecklist(document.getElementById('pa'));
    updCounts();
  };

  window.clReset = function clReset() {
    const keysToDelete = Object.keys(CL_DONE).filter(k => k.endsWith('_' + CUR));
    keysToDelete.forEach(k => {
      delete CL_DONE[k];
      dbSaveCareLog(k, false);
    });
    renderChecklist(document.getElementById('pa'));
  };

  setTimeout(async function refreshCareLogAfterPatch() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    await dbLoadCareLog();
    if (typeof TF !== 'undefined' && TF === 'alerts') {
      renderChecklist(document.getElementById('pa'));
    }
  }, 0);
}
