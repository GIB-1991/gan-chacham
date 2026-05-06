(function () {
  const APP_VERSION = 'image-main-fix-20260506';
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
  const DEFAULT_PLANT_CANDIDATES = [
    ['מנגו'],
    ['תאנה'],
    ['שמיר'],
    ['שסק'],
    ['ערבה בוכייה', 'ערבה בוכיה']
  ];
  const PLANT_IMAGE_PAGES = {
    'ערבה בוכיה': 'Weeping willow',
    'ערבה בוכייה': 'Weeping willow',
    'תפוז טבורי': 'Navel orange',
    'לימון ננסי': 'Lemon',
    'פפאיה': 'Papaya',
    'שזיף פיסרדי': 'Prunus cerasifera',
    'אבוקדו': 'Avocado',
    'מנגו': 'Mangifera indica',
    'פקאן': 'Pecan',
    'צפצפה': 'Populus',
    'נקטרינה': 'Nectarine',
    'תות עץ': 'Morus nigra',
    'תפוח פינק ליידי': 'Pink Lady apple',
    'אלה סינית': 'Pistacia chinensis',
    'פומלה': 'Pomelo',
    'שקד': 'Almond',
    'גודגדן': 'Prunus avium',
    'פטל': 'Raspberry',
    'אוכמניות': 'Blueberry',
    'דשא יפני': 'Zoysia japonica',
    'דשא קוקויה': 'Kikuyu grass',
    'רימון': 'Pomegranate',
    'תאנה': 'Ficus carica',
    'זית': 'Olive',
    'ענב': 'Grape',
    'אפרסק': 'Peach',
    'אגס': 'Pear',
    'שסק': 'Loquat',
    'מנדרינה': 'Mandarin orange',
    'אשכולית': 'Grapefruit',
    'בננה': 'Banana',
    'תמר': 'Date palm',
    'פיג׳ואה': 'Feijoa',
    'סברס': 'Opuntia ficus-indica',
    'קיווי': 'Kiwifruit',
    'דובדבן': 'Cherry',
    'תות שדה': 'Strawberry',
    'נענע': 'Mentha',
    'רוזמרין': 'Rosemary',
    'לבנדר': 'Lavender',
    'מרווה': 'Salvia officinalis',
    'בזיליקום': 'Basil',
    'הדס': 'Myrtle',
    'ברוש': 'Italian cypress',
    'בוגנוויליה': 'Bougainvillea',
    'הורדה': 'Rose',
    'ורד': 'Rose',
    'יסמין': 'Jasmine',
    'פיקוס בנג׳מין': 'Ficus benjamina',
    'דרסנה': 'Dracaena marginata',
    'סנסוויריה': 'Dracaena trifasciata',
    'זמיוקולקס': 'Zamioculcas',
    'פלמריה': 'Plumeria',
    'פלומריה': 'Plumeria',
    'חרוב': 'Carob',
    'שיזף': 'Jujube',
    'פשיפלורה': 'Passion fruit',
    'עגבנייה': 'Tomato',
    'מלפפון': 'Cucumber',
    'פלפל': 'Bell pepper',
    'אבטיח': 'Watermelon',
    'חציל': 'Eggplant',
    'אורן ירושלים': 'Aleppo pine',
    'אקליפטוס': 'Eucalyptus',
    'דולב': 'Platanus orientalis',
    'אורן אלפי': 'Swiss pine',
    'שיטה': 'Acacia',
    'אלת המסטיק': 'Pistacia lentiscus',
    'קסיה': 'Cassia fistula',
    'טבק נאה': 'Nicotiana glauca',
    'אדמונית': 'Cyclamen persicum',
    'נרקיס': 'Narcissus',
    'צבעוני': 'Tulip',
    'קלנדולה': 'Calendula officinalis',
    'פטוניה': 'Petunia',
    'ציפורן': 'Dianthus caryophyllus',
    'פורטולקה': 'Portulaca grandiflora',
    'אגפנטוס': 'Agapanthus',
    'גזניה': 'Gazania',
    'בריגמיה': 'Brighamia insignis',
    'אלוורה': 'Aloe vera',
    'אגבה': 'Agave',
    'קוקוס': 'Coconut',
    'ג׳ינג׳ר': 'Ginger',
    'כורכום': 'Turmeric',
    'למון גראס': 'Cymbopogon citratus',
    'סטביה': 'Stevia rebaudiana',
    'אורגנו': 'Oregano',
    'טימין': 'Thyme',
    'פטרוזיליה': 'Parsley',
    'שמיר': 'Dill',
    'כוסברה': 'Coriander',
    'עירית': 'Chives',
    'ליים': 'Key lime',
    'קומקוואט': 'Kumquat',
    'פפינו': 'Pepino',
    'לוקומה': 'Pouteria lucuma',
    'ג׳קפרוט': 'Jackfruit',
    'ארמורסיה': 'Horseradish',
    'לבנה': 'Styrax officinalis',
    'כליסטמון': 'Callistemon',
    'ג׳קרנדה': 'Jacaranda mimosifolia',
    'מיקוניה': 'Miconia',
    'לנטנה': 'Lantana camara',
    'אולינדר / נרייה': 'Nerium oleander',
    'אגוז': 'Walnut',
    'ערמון': 'Sweet chestnut',
    'לוטוס': 'Nelumbo nucifera',
    'פפירוס': 'Cyperus papyrus',
    'במבוק': 'Bamboo',
    'פאלם ארקה': 'Dypsis lutescens',
    'קורדילינה': 'Cordyline australis',
    'יוקה': 'Yucca',
    'פייקוס לירטה': 'Ficus lyrata',
    'שפיפון': 'Ophiopogon japonicus',
    'פיטוספורום': 'Pittosporum tobira',
    'ליגוסטרום': 'Ligustrum',
    'דוקן': 'Podocarpus',
    'קורן': 'Cornus',
    'טרחלה': 'Teucrium fruticans',
    'ספיריאה': 'Spiraea',
    'פורסיתיה': 'Forsythia',
    'מגנוליה': 'Magnolia',
    'דפנה': 'Laurus nobilis',
    'גרניום': 'Pelargonium',
    'אמריליס': 'Amaryllis',
    'היביסקוס': 'Hibiscus rosa-sinensis',
    'גרוויליאה': 'Grevillea',
    'אשל': 'Tamarix',
    'חמנייה': 'Helianthus annuus',
    'כלנית': 'Anemone coronaria',
    'חלמית': 'Malva',
    'ורד ים': 'Armeria maritima',
    'מלוח': 'Atriplex',
    'דגניה': 'Ixia',
    'גלדיולה': 'Gladiolus',
    'דהליה': 'Dahlia',
    'ציניה': 'Zinnia',
    'סלוויה': 'Salvia',
    'כוסמת': 'Buckwheat',
    'אנמון': 'Anemone',
    'מוסקרי': 'Muscari',
    'צ׳יה': 'Chia',
    'ספנות': 'Satureja',
    'תרד': 'Spinach',
    'חסה': 'Lettuce',
    'גזר': 'Carrot',
    'סלק': 'Beetroot',
    'ברוקולי': 'Broccoli',
    'כרובית': 'Cauliflower',
    'שעועית': 'Common bean',
    'כרישה': 'Leek'
  };

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

  function readLocalPlants() {
    const plants = loadJson(LOCAL_PLANTS_KEY, []);
    return Array.isArray(plants) ? plants : [];
  }

  function readLocalDates() {
    const dates = loadJson(LOCAL_DATES_KEY, {});
    return dates && typeof dates === 'object' ? dates : {};
  }

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
    const catalog = getAllCatalogPlants();
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
      try { currentUser = currentUser || (await _db.auth.getUser()).data.user; }
      catch (e) { console.error('getUser:', e); }
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

  function installImageStyles() {
    if (document.getElementById('gan-image-main-style')) return;
    const style = document.createElement('style');
    style.id = 'gan-image-main-style';
    style.textContent = `
      .card .size-tabs{display:none!important}
      .card-img{background:#dfeee2}
      .real-photo,.m-slot-real{filter:saturate(1.04) contrast(1.02)}
      .photo-loading.show,.m-slot-loading.show{background:rgba(15,42,26,.18)}
    `;
    document.head.appendChild(style);
  }

  function getPlantForImage(idOrName) {
    if (typeof idOrName === 'number') return P.find(p => p.id === idOrName) || null;
    return P.find(p => p.name === idOrName) || (typeof CATALOG_ALL !== 'undefined' ? CATALOG_ALL.find(p => p.name === idOrName) : null) || { name: idOrName };
  }

  function imageCacheKey(plant, size) {
    return `${plant.name}__${size || 'medium'}`;
  }

  function imageTargetsForPlant(plant) {
    const targets = [];
    const add = (type, value) => {
      if (!value) return;
      const key = `${type}:${value}`;
      if (!targets.some(t => t.key === key)) targets.push({ key, type, value });
    };

    const alias = PLANT_IMAGE_PAGES[plant.name];
    if (alias) add('wiki-en', alias);

    try {
      const wikiInfo = typeof WIKI_PAGES !== 'undefined' ? WIKI_PAGES[plant.name] : null;
      if (wikiInfo?.page) add('wiki-en', wikiInfo.page);
    } catch (e) {}

    add('wiki-he', plant.name);
    add('wikidata', alias || plant.name);
    add('commons', alias || plant.name);

    if (plant.name.includes('/')) {
      plant.name.split('/').map(s => s.trim()).filter(Boolean).forEach(part => {
        add('wiki-he', part);
        add('wikidata', part);
        add('commons', part);
      });
    }

    if (plant.lbl) add('commons', `${alias || plant.name} ${plant.lbl}`);
    return targets;
  }

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

  async function fetchWikidataImage(query) {
    const cacheKey = `wikidata_img_${query}`;
    if (imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
    try {
      const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=he&uselang=he&type=item&limit=1&format=json&origin=*`;
      const searchResp = await fetch(searchUrl, { cache: 'force-cache' });
      const searchData = await searchResp.json();
      const entityId = searchData.search?.[0]?.id;
      if (!entityId) {
        imgCache[cacheKey] = null;
        return null;
      }

      const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json&origin=*`;
      const entityResp = await fetch(entityUrl, { cache: 'force-cache' });
      const entityData = await entityResp.json();
      const fileName = entityData.entities?.[entityId]?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      const url = fileName ? `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=1000` : null;
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

    const mediumKey = imageCacheKey(plant, 'medium');
    if (size !== 'medium' && imgCache[mediumKey]) {
      imgCache[directKey] = imgCache[mediumKey];
      return imgCache[directKey];
    }

    let url = null;
    for (const target of imageTargetsForPlant(plant)) {
      if (target.type === 'wiki-en') url = await fetchWikiThumb('en', target.value);
      else if (target.type === 'wiki-he') url = await fetchWikiThumb('he', target.value);
      else if (target.type === 'wikidata') url = await fetchWikidataImage(target.value);
      else if (target.type === 'commons' && typeof fetchCommonsImage === 'function') url = await fetchCommonsImage(`${target.value} plant`);
      if (url) break;
    }

    imgCache[directKey] = url || null;
    if (size !== 'medium' && url) imgCache[mediumKey] = imgCache[mediumKey] || url;
    return imgCache[directKey];
  }

  window.fetchWikiImg = async function patchedFetchWikiImg(plantName, size) {
    return resolveMainPlantImage(getPlantForImage(plantName), size || 'medium');
  };

  window.tryLoadImg = function patchedTryLoadImg(id, size, onSuccess, onFail) {
    const plant = getPlantForImage(id);
    if (!plant) {
      if (onFail) onFail();
      return;
    }

    resolveMainPlantImage(plant, size || 'medium').then(url => {
      if (url) {
        if (onSuccess) onSuccess(url);
      } else if (onFail) onFail();
    }).catch(e => {
      console.error('tryLoadImg:', e);
      if (onFail) onFail();
    });
  };

  installImageStyles();

  setTimeout(async function startAuthRecovery() {
    if ((hasLocalSession() || (localPlantsExist() && !hasLocalLogout())) && !hasOAuthReturn()) {
      enterLocalMode('הגינה נטענה מהדפדפן');
      return;
    }
    if (_db && !(await supabaseReachable())) {
      enterLocalMode('Supabase לא זמין כרגע, לכן פתחנו את האתר במצב מקומי.');
      return;
    }
    await resumeOAuthSession();
  }, 0);

  setTimeout(async function refreshCareLogAfterPatch() {
    if (typeof currentUser === 'undefined' || !currentUser) return;
    await dbLoadCareLog();
    if (typeof TF !== 'undefined' && TF === 'alerts') renderChecklist(document.getElementById('pa'));
  }, 0);
}
