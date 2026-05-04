(function () {
  const hostScript = document.currentScript;
  const mainScript = document.createElement('script');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');

  window.onAuthSubmit = showAppLoadingError;
  window.loginWithGoogle = showAppLoadingError;
  if (authSubmitBtn) authSubmitBtn.disabled = true;
  if (googleBtn) googleBtn.disabled = true;

  mainScript.src = 'script.js?v=google-auth-fix-20260504';
  mainScript.onload = installCareLogFix;
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

function installCareLogFix() {
  const originalShowAuthError = window.showAuthError;
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const googleBtn = document.querySelector('.auth-btn-google');
  let enteringApp = false;

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

  window.loginWithGoogle = async function patchedLoginWithGoogle() {
    if (!_db) {
      showAuthError('החיבור ל-Supabase עדיין לא מוכן. נסה שוב בעוד רגע.');
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
    if (!_db) return;

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
      showAuthError('לא הצלחנו להשלים התחברות. נסה שוב בעוד רגע.');
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
        if (dbPlants.length > 0) {
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
    if (!_db) return;

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
      showAuthError('לא הצלחנו לחזור מהתחברות Google. נסה שוב.');
    }
  }

  setTimeout(resumeOAuthSession, 0);

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

    if (!_db || !currentUser) return;

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

    if (!_db || !currentUser) return;

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
