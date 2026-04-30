// ⚙️  SUPABASE CONFIG — הכנס את הפרטים שלך כאן
// ============================================================
const SUPABASE_URL = 'https://bfnkssykvxwruvygoqwj.supabase.co';    // https://xxxx._db.co
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmbmtzc3lrdnh3cnV2eWdvcXdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2MzgxNDcsImV4cCI6MjA4ODIxNDE0N30.XOl0evOQoCiGqAPnPgFR80B8aV3HD-vhWTrnVNf7MyM';

// ============================================================
// AUTH + USER STATE
// ============================================================
let _db = null;
let currentUser = null;   // Supabase auth user object

function initSupabase() {
  if (!window.supabase || SUPABASE_URL === 'YOUR_SUPABASE_URL') return false;
  _db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  return true;
}

/** התחבר עם Google */
async function loginWithGoogle() {
  if (!_db) return;
  const { error } = await _db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href }
  });
  if (error) showToast('❌ שגיאת התחברות: ' + error.message);
}

/** התחבר עם אימייל + סיסמה */
async function loginWithEmail(email, password) {
  if (!_db) return;
  setAuthLoading(true);
  const { data, error } = await _db.auth.signInWithPassword({ email, password });
  setAuthLoading(false);
  if (error) { showAuthError(error.message); return; }
  currentUser = data.user;
  onUserLoggedIn();
}

/** הרשמה עם אימייל + סיסמה */
async function registerWithEmail(email, password) {
  if (!_db) return;
  setAuthLoading(true);
  const { data, error } = await _db.auth.signUp({ email, password });
  setAuthLoading(false);
  if (error) { showAuthError(error.message); return; }
  if (data.user?.identities?.length === 0) {
    showAuthError('אימייל זה כבר רשום. נסה להתחבר.');
    return;
  }
  showAuthError('✅ נשלח אימייל אימות — בדוק את תיבת הדואר ולחץ על הקישור.', false);
}

/** התנתק */
async function logout() {
  if (!_db) return;
  await _db.auth.signOut();
  currentUser = null;
  showAuthScreen();
}

// ============================================================
// DB HELPERS — כל שאילתה מסוננת ע"פ user_id
// ============================================================

async function dbSavePlant(plant) {
  if (!_db || !currentUser) return;
  const row = { ...plantToRow(plant), user_id: currentUser.id };
  const { error } = await _db.from('plants').upsert(row, { onConflict: 'id,user_id' });
  if (error) console.error('dbSavePlant:', error.message);
}

async function dbDeletePlant(id) {
  if (!_db || !currentUser) return;
  const { error } = await _db.from('plants').delete()
    .eq('id', id).eq('user_id', currentUser.id);
  if (error) console.error('dbDeletePlant:', error.message);
}

async function dbLoadPlants() {
  if (!_db || !currentUser) return null;
  const { data, error } = await _db.from('plants').select('*')
    .eq('user_id', currentUser.id).order('id');
  if (error) { console.error('dbLoadPlants:', error.message); return null; }
  return data.map(rowToPlant);
}

async function dbSavePlantingDate(plantId, dateStr) {
  if (!_db || !currentUser) return;
  const { error } = await _db.from('planting_dates')
    .upsert({ plant_id: plantId, user_id: currentUser.id, date: dateStr },
            { onConflict: 'plant_id,user_id' });
  if (error) console.error('dbSavePlantingDate:', error.message);
}

async function dbDeletePlantingDate(plantId) {
  if (!_db || !currentUser) return;
  const { error } = await _db.from('planting_dates').delete()
    .eq('plant_id', plantId).eq('user_id', currentUser.id);
  if (error) console.error('dbDeletePlantingDate:', error.message);
}

async function dbLoadPlantingDates() {
  if (!_db || !currentUser) return {};
  const { data, error } = await _db.from('planting_dates').select('*')
    .eq('user_id', currentUser.id);
  if (error) { console.error('dbLoadPlantingDates:', error.message); return {}; }
  const result = {};
  data.forEach(r => { result[r.plant_id] = r.date; });
  return result;
}

// Returns full plant catalog (for seeding new users)
function getAllCatalogPlants() {
  return CATALOG_ALL || [];
}

// ============================================================
// SERIALIZATION
// ============================================================

function plantToRow(p) {
  return {
    id:             p.id,
    name:           p.name,
    type:           p.type,
    bg:             p.bg,
    lbl:            p.lbl,
    e:              p.e,
    floor:          p.floor,
    prune:          p.prune          || null,
    pm:             JSON.stringify(p.pm    || []),
    pi:             p.pi             || null,
    pmth:           p.pmth           || null,
    fert:           p.fert           || null,
    fm:             JSON.stringify(p.fm    || []),
    supp:           p.supp           || null,
    sm:             JSON.stringify(p.sm    || []),
    rules:          p.rules          || null,
    crit:           p.crit           || null,
    water_summer:   p.waterSummer    ?? null,
    water_winter:   p.waterWinter    ?? null,
    water_type:     p.waterType      || null,
    light:          p.light          || null,
    light_alt:      p.lightAlt       || null,
    climate:        JSON.stringify(p.climate       || []),
    indoor:         p.indoor         ?? false,
    geo:            p.geo            || null,
    harvest_months: JSON.stringify(p.harvestMonths || []),
    winter:         p.winter         || null,
    summer:         p.summer         || null,
    sizes:          JSON.stringify(p.sizes || {}),
    custom:         p.custom         ?? true,
  };
}

function rowToPlant(r) {
  return {
    id:            r.id,
    name:          r.name,
    type:          r.type,
    bg:            r.bg,
    lbl:           r.lbl,
    e:             r.e,
    floor:         r.floor,
    prune:         r.prune,
    pm:            JSON.parse(r.pm    || '[]'),
    pi:            r.pi,
    pmth:          r.pmth,
    fert:          r.fert,
    fm:            JSON.parse(r.fm    || '[]'),
    supp:          r.supp,
    sm:            JSON.parse(r.sm    || '[]'),
    rules:         r.rules,
    crit:          r.crit,
    waterSummer:   r.water_summer,
    waterWinter:   r.water_winter,
    waterType:     r.water_type,
    light:         r.light,
    lightAlt:      r.light_alt,
    climate:       JSON.parse(r.climate || '[]'),
    indoor:        r.indoor,
    geo:           r.geo,
    harvestMonths: JSON.parse(r.harvest_months || '[]'),
    winter:        r.winter,
    summer:        r.summer,
    sizes:         JSON.parse(r.sizes || '{}'),
    custom:        r.custom,
  };
}

// ============================================================
// AUTH SCREEN LOGIC
// ============================================================

function showAuthScreen() {
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display  = 'none';
}

function hideAuthScreen() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display   = 'block';
}

function setAuthLoading(on) {
  const btn = document.getElementById('auth-submit-btn');
  if (btn) btn.disabled = on;
  const spin = document.getElementById('auth-spinner');
  if (spin) spin.style.display = on ? 'inline-block' : 'none';
}

function showAuthError(msg, isError = true) {
  const el = document.getElementById('auth-error');
  if (!el) return;
  el.textContent = msg;
  el.style.color = isError ? '#dc2626' : '#166534';
  el.style.display = 'block';
}

let authMode = 'login'; // 'login' | 'register'

function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const btn   = document.getElementById('auth-submit-btn');
  const title = document.getElementById('auth-title');
  const toggle = document.getElementById('auth-toggle');
  const err = document.getElementById('auth-error');
  if (err) err.style.display = 'none';
  if (authMode === 'login') {
    title.textContent  = '🌿 ברוך הבא לגן חכם';
    btn.textContent    = 'כניסה';
    toggle.innerHTML   = 'אין חשבון? <a href="#" onclick="toggleAuthMode();return false">הירשם כאן</a>';
  } else {
    title.textContent  = '🌱 הצטרף לגן חכם';
    btn.textContent    = 'הרשמה';
    toggle.innerHTML   = 'יש לך חשבון? <a href="#" onclick="toggleAuthMode();return false">התחבר כאן</a>';
  }
}

function onAuthSubmit() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  if (!email || !password) { showAuthError('יש להזין אימייל וסיסמה'); return; }
  if (authMode === 'login') loginWithEmail(email, password);
  else registerWithEmail(email, password);
}

// ============================================================
// USER HEADER
// ============================================================

function renderUserHeader(user) {
  const avatar = user.user_metadata?.avatar_url;
  const name   = user.user_metadata?.full_name || user.email || 'משתמש';
  const el = document.getElementById('user-header-info');
  if (!el) return;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      ${avatar ? `<img src="${avatar}" style="width:32px;height:32px;border-radius:50%;border:2px solid rgba(255,255,255,0.4)">`
               : `<div style="width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff">${name[0]}</div>`}
      <span style="color:rgba(255,255,255,0.85);font-size:0.85rem;font-weight:600;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
      <button onclick="logout()" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#fff;border-radius:100px;padding:4px 12px;font-size:0.75rem;font-weight:700;cursor:pointer">יציאה</button>
    </div>`;
}

// ============================================================
// BOOT — called after DOM ready
// ============================================================

async function onUserLoggedIn() {
  currentUser = currentUser || (await _db.auth.getUser()).data.user;
  if (!currentUser) { showAuthScreen(); return; }
  renderUserHeader(currentUser);
  hideAuthScreen();

  // Load user's data from DB
  showToast('⏳ טוען את הגינה שלך...');
  const [dbPlants, dbDates] = await Promise.all([dbLoadPlants(), dbLoadPlantingDates()]);
  await dbLoadCareLog();
  if (dbPlants !== null) {
    P.length = 0;
    if (dbPlants.length > 0) {
      dbPlants.forEach(p => P.push(p));
    } else {
      // First login — seed with 4 familiar plants from catalog
      const CATALOG = getAllCatalogPlants();
      const defaultNames = ['לימון ננסי','תפוז טבורי','אורן ירושלים','נענע'];
      const seeds = defaultNames.map(n => CATALOG.find(p => p.name === n)).filter(Boolean);
      for (const p of seeds) {
        P.push(p);
        await dbSavePlant(p);
      }
    }
  }
  if (dbDates) Object.assign(plantingDates, dbDates);
  showToast('✅ הגינה נטענה בהצלחה!');

  document.getElementById('monthPill').textContent = `📅 ${MHE[CUR-1]} ${NOW.getFullYear()}`;
  document.getElementById('msel').value = 0;
  updCounts(); renderAlerts(); render();
}

async function boot() {
  const ready = initSupabase();
  if (!ready) {
    // No Supabase configured — run locally
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-shell').style.display   = 'block';
    document.getElementById('monthPill').textContent = `📅 ${MHE[CUR-1]} ${NOW.getFullYear()}`;
    document.getElementById('msel').value = 0;
    updCounts(); renderAlerts(); render();
    return;
  }

  // Listen for auth state changes (handles OAuth redirect & session restore)
  _db.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      currentUser = session.user;
      await onUserLoggedIn();
    } else {
      currentUser = null;
      showAuthScreen();
    }
  });
}

// ============================================================
// PATCHED CRUD — מסנכרן ל-Supabase עם user_id
// ============================================================

async function confirmAddPlant() {
  if (!AP_pending) return;
  P.push(AP_pending);
  updCounts(); renderAlerts(); render();

  const newPlant = AP_pending;
  setTimeout(async () => {
    const engName = WIKI_PAGES[newPlant.name]?.page;
    let url = engName ? await fetchWikipediaMainImage(engName) : null;
    if (!url) url = await fetchImgForNewPlant(newPlant.name);
    if (url) {
      imgCache[`${newPlant.name}__medium`] = url;
      imgCache[`${newPlant.name}__small`]  = url;
      imgCache[`${newPlant.name}__large`]  = url;
      const cardImg = document.getElementById(`cimg-${newPlant.id}`);
      if (cardImg) { cardImg.src = url; cardImg.classList.add('show'); }
    }
  }, 500);

  await dbSavePlant({ ...AP_pending, custom: true });
  closeAddPlant();
  showToast(`🌱 ${AP_pending.name} נוסף לגינה!`);
  AP_pending = null;
  document.getElementById('ap-name-input').value = '';
}

async function deletePlant(id) {
  const p   = P.find(x => x.id === id);
  const idx = P.findIndex(x => x.id === id);
  if (idx < 0) return;
  P.splice(idx, 1);
  updCounts(); renderAlerts(); render();
  await dbDeletePlant(id);
  await dbDeletePlantingDate(id);
  showToast(`🗑️ ${p?.name || 'הצמח'} נמחק`);
}

async function saveEditedPlant() {
  if (!AP) return;
  AP.name        = document.getElementById('ef-name').value.trim()      || AP.name;
  AP.lbl         = document.getElementById('ef-lbl').value.trim();
  AP.e           = document.getElementById('ef-e').value.trim()         || AP.e;
  AP.floor       = document.getElementById('ef-floor').value;
  AP.prune       = document.getElementById('ef-prune').value.trim();
  AP.pi          = document.getElementById('ef-pi').value;
  AP.pmth        = document.getElementById('ef-pmth').value.trim();
  AP.fert        = document.getElementById('ef-fert').value.trim();
  AP.supp        = document.getElementById('ef-supp').value.trim()      || null;
  AP.rules       = document.getElementById('ef-rules').value.trim()     || null;
  AP.crit        = document.getElementById('ef-crit').value.trim()      || null;
  AP.waterSummer = parseFloat(document.getElementById('ef-waterSummer').value) || null;
  AP.waterWinter = parseFloat(document.getElementById('ef-waterWinter').value) || null;
  AP.waterType   = document.getElementById('ef-waterType').value        || null;
  AP.winter      = document.getElementById('ef-winter').value.trim();
  AP.summer      = document.getElementById('ef-summer').value.trim();
  if (!AP.sizes) AP.sizes = {};
  AP.sizes.small  = document.getElementById('ef-sz-small').value.trim();
  AP.sizes.medium = document.getElementById('ef-sz-medium').value.trim();
  AP.sizes.large  = document.getElementById('ef-sz-large').value.trim();
  AP.light    = document.getElementById('ef-light').value    || null;
  AP.lightAlt = document.getElementById('ef-lightAlt').value || null;
  const cold = document.getElementById('ef-cold').checked;
  const heat = document.getElementById('ef-heat').checked;
  AP.climate = [cold ? 'עמיד לקור' : null, heat ? 'עמיד לשרב' : null].filter(Boolean);
  AP.indoor  = document.getElementById('ef-indoor').value === 'true';
  AP.geo     = document.getElementById('ef-geo').value.trim() || null;

  const idx = P.findIndex(x => x.id === AP.id);
  if (idx >= 0) P[idx] = AP;

  EDIT_MODE = false;
  updCounts(); renderAlerts(); render();

  document.getElementById('mt').textContent = AP.name;
  document.getElementById('ms').textContent = AP.lbl + ' · ' + AP.floor;
  document.getElementById('mseasons').innerHTML = `
    <div class="mseason w"><h4>❄️ חורף</h4>${AP.winter || 'אין מידע.'}</div>
    <div class="mseason s"><h4>☀️ קיץ</h4>${AP.summer || 'אין מידע.'}</div>`;
  const editBtn = document.getElementById('modal-edit-btn');
  if (editBtn) { editBtn.textContent = '✏️ ערוך פרטים'; editBtn.classList.remove('active'); }
  buildModalBody();

  await dbSavePlant(AP);
  showToast('💾 השינויים נשמרו!');
}

async function saveAge(pid) {
  const inp = document.getElementById(`age-inp-${pid}`);
  if (!inp) return;
  const val = inp.value;
  if (val) {
    plantingDates[pid] = val;
    await dbSavePlantingDate(pid, val);
  } else {
    delete plantingDates[pid];
    await dbDeletePlantingDate(pid);
  }
  renderOrlaBlock(pid);
  updCounts(); renderAlerts(); render();
  const p = P.find(x => x.id === pid);
  if (p) openM(p.id);
  showToast('📅 תאריך שתילה נשמר!');
}

// ============================================================
// KICK OFF
// ============================================================


const MHE=['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

// ===================================================
// WIKIPEDIA IMAGE SYSTEM
// שואב תמונה ראשית מדף ויקיפדיה לכל צמח
// ===================================================
const imgCache = {};

// מיפוי שמות צמחים לשמות דפי ויקיפדיה באנגלית
const WIKI_PAGES = {
  'מנגו':             {page:'Mangifera indica',         small:'Mangifera indica seedling',      large:'Mango tree fruit orchard'},
  'תפוז טבורי':      {page:'Navel orange',              small:'Citrus sinensis seedling pot',   large:'Orange tree fruit grove'},
  'לימון ננסי':      {page:'Lemon',                     small:'Citrus limon young plant pot',   large:'Lemon tree fruits yellow'},
  'פפאיה':           {page:'Carica papaya',              small:'Carica papaya seedling young',   large:'Papaya tree trunk fruit mature'},
  'שזיף פיסרדי':    {page:'Prunus cerasifera',          small:'Prunus cerasifera sapling',      large:'Prunus cerasifera pissardii tree'},
  'אבוקדו':          {page:'Avocado',                    small:'Persea americana seedling',      large:'Avocado tree fruit mature'},
  'פקאן':            {page:'Pecan',                      small:'Carya illinoinensis sapling',    large:'Pecan tree orchard nuts'},
  'נקטרינה':         {page:'Nectarine',                  small:'Prunus persica nectarine young', large:'Nectarine tree fruit red'},
  'תות עץ':          {page:'Morus nigra',                small:'Morus mulberry sapling',         large:'Morus nigra black mulberry tree'},
  'תפוח פינק ליידי': {page:'Pink Lady apple',            small:'Apple tree young sapling',       large:'Apple orchard fruit harvest'},
  'פומלה':           {page:'Pomelo',                     small:'Citrus maxima young tree',       large:'Pomelo tree fruit large green'},
  'שקד':             {page:'Almond',                     small:'Prunus dulcis sapling young',    large:'Almond tree blossom orchard'},
  'רימון':           {page:'Pomegranate',                small:'Punica granatum sapling young',  large:'Pomegranate tree fruit red'},
  'תאנה':            {page:'Ficus carica',               small:'Ficus carica young tree',        large:'Fig tree fruit mature summer'},
  'זית':             {page:'Olive',                      small:'Olea europaea sapling young',    large:'Olive tree ancient orchard'},
  'ענב':             {page:'Grape',                      small:'Vitis vinifera young vine',      large:'Grape vine vineyard fruit cluster'},
  'אפרסק':           {page:'Peach',                      small:'Prunus persica sapling young',   large:'Peach tree fruit yellow orange'},
  'אגס':             {page:'Pear',                       small:'Pyrus communis sapling',         large:'Pear tree fruit yellow green'},
  'שסק':             {page:'Loquat',                     small:'Eriobotrya japonica young',      large:'Loquat tree fruit orange cluster'},
  'מנדרינה':         {page:'Mandarin orange',            small:'Citrus reticulata seedling',     large:'Mandarin orange tree fruit ripe'},
  'אשכולית':         {page:'Grapefruit',                 small:'Citrus paradisi young tree',     large:'Grapefruit tree fruit yellow'},
  'בננה':            {page:'Banana',                     small:'Musa seedling young plant',      large:'Banana tree fruit bunch tropical'},
  'תמר':             {page:'Date palm',                  small:'Phoenix dactylifera young palm', large:'Date palm tree fruit cluster'},
  'פיג׳ואה':         {page:'Feijoa',                     small:'Acca sellowiana sapling',        large:'Feijoa tree fruit green flower'},
  'סברס':            {page:'Opuntia ficus-indica',       small:'Opuntia young cactus pad',       large:'Opuntia cactus fruit prickly pear'},
  'קיווי':           {page:'Kiwifruit',                  small:'Actinidia deliciosa vine young', large:'Kiwi vine fruit green harvest'},
  'דובדבן':          {page:'Cherry',                     small:'Prunus avium sapling young',     large:'Cherry tree fruit red blossom'},
  'תות שדה':         {page:'Strawberry',                 small:'Fragaria plant young',           large:'Strawberry plant fruit red ripe'},
  'שיזף':            {page:'Jujube',                     small:'Ziziphus jujuba sapling',        large:'Jujube tree fruit red ripe'},
  'אגוז':            {page:'Walnut',                     small:'Juglans regia sapling young',    large:'Walnut tree mature orchard autumn'},
  'ערמון':           {page:'Sweet chestnut',             small:'Castanea sativa sapling',        large:'Chestnut tree fruit autumn spiny'},
  'פשיפלורה':        {page:'Passion fruit',              small:'Passiflora vine young plant',    large:'Passion fruit vine flower purple'},
  'ליים':            {page:'Key lime',                   small:'Citrus aurantiifolia young',     large:'Lime tree fruit green branch'},
  'קומקוואט':        {page:'Kumquat',                    small:'Fortunella japonica young pot',  large:'Kumquat tree fruit orange small'},
  'פפינו':           {page:'Pepino',                     small:'Solanum muricatum young plant',  large:'Pepino plant fruit yellow purple'},
  'עגבנייה':         {page:'Tomato',                     small:'Solanum lycopersicum seedling',  large:'Tomato plant fruit red ripe'},
  'מלפפון':          {page:'Cucumber',                   small:'Cucumis sativus seedling',       large:'Cucumber plant vine fruit green'},
  'פלפל':            {page:'Bell pepper',                small:'Capsicum annuum seedling young', large:'Bell pepper plant fruit colorful'},
  'חציל':            {page:'Eggplant',                   small:'Solanum melongena seedling',     large:'Eggplant plant fruit purple mature'},
  'אבטיח':           {page:'Watermelon',                 small:'Citrullus lanatus seedling',     large:'Watermelon fruit field ripe'},
  'תרד':             {page:'Spinach',                    small:'Spinacia oleracea seedling',     large:'Spinach plant leaves green'},
  'חסה':             {page:'Lettuce',                    small:'Lactuca sativa seedling young',  large:'Lettuce head green fresh'},
  'גזר':             {page:'Carrot',                     small:'Daucus carota seedling young',   large:'Carrot plants garden orange'},
  'ברוקולי':         {page:'Broccoli',                   small:'Brassica oleracea seedling',     large:'Broccoli plant head green'},
  'נענע':            {page:'Mentha',                     small:'Mentha young plant pot herb',    large:'Mint plant herb leaves green'},
  'רוזמרין':         {page:'Rosemary',                   small:'Rosmarinus officinalis young',   large:'Rosemary herb bush garden flower'},
  'לבנדר':           {page:'Lavender',                   small:'Lavandula angustifolia young',   large:'Lavender field purple bloom provence'},
  'מרווה':           {page:'Salvia officinalis',         small:'Salvia officinalis young',       large:'Sage herb garden purple flower'},
  'בזיליקום':        {page:'Basil',                      small:'Ocimum basilicum seedling pot',  large:'Basil herb plant leaves green pot'},
  'אורגנו':          {page:'Oregano',                    small:'Origanum vulgare young plant',   large:'Oregano herb garden plant flower'},
  'טימין':           {page:'Thyme',                      small:'Thymus vulgaris young plant',    large:'Thyme herb garden small flower'},
  'פטרוזיליה':       {page:'Parsley',                    small:'Petroselinum crispum seedling',  large:'Parsley herb plant green fresh'},
  'שמיר':            {page:'Dill',                       small:'Anethum graveolens seedling',    large:'Dill herb plant yellow flower umbel'},
  'כוסברה':          {page:'Coriander',                  small:'Coriandrum sativum seedling',    large:'Coriander herb plant flower white'},
  'ג׳ינג׳ר':         {page:'Ginger',                     small:'Zingiber officinale young plant',large:'Ginger plant tropical rhizome root'},
  'כורכום':          {page:'Turmeric',                   small:'Curcuma longa young plant',      large:'Turmeric plant tropical flower yellow'},
  'למון גראס':       {page:'Cymbopogon citratus',        small:'Lemongrass young clump plant',   large:'Lemongrass grass clump large'},
  'ערבה בוכיה':      {page:'Weeping willow',             small:'Salix babylonica young sapling', large:'Weeping willow large tree water river'},
  'ברוש':            {page:'Italian cypress',            small:'Cupressus sempervirens young',   large:'Italian cypress tall row avenue'},
  'אורן ירושלים':    {page:'Aleppo pine',                small:'Pinus halepensis young tree',    large:'Aleppo pine forest tree Israel'},
  'אקליפטוס':        {page:'Eucalyptus',                 small:'Eucalyptus sapling young',       large:'Eucalyptus tree tall forest blue gum'},
  'שיטה':            {page:'Acacia',                     small:'Acacia sapling young plant',     large:'Acacia tree yellow flower bloom'},
  'בוגנוויליה':      {page:'Bougainvillea',              small:'Bougainvillea young plant',      large:'Bougainvillea tree flower pink purple wall'},
  'הורדה':           {page:'Rose',                       small:'Rosa young shrub plant',         large:'Rose garden flowers colorful bloom'},
  'יסמין':           {page:'Jasmine',                    small:'Jasminum young plant vine',      large:'Jasmine flower white fragrant garden'},
  'הדס':             {page:'Myrtle',                     small:'Myrtus communis young plant',    large:'Myrtle shrub white flower Mediterranean'},
  'פלמריה':          {page:'Plumeria',                   small:'Plumeria sapling young trunk',   large:'Plumeria tree flower pink white tropical'},
  'ג׳קרנדה':         {page:'Jacaranda mimosifolia',      small:'Jacaranda sapling young tree',   large:'Jacaranda tree purple flower bloom street'},
  'כליסטמון':        {page:'Callistemon',                small:'Callistemon young plant shrub',  large:'Callistemon bottlebrush red flower'},
  'לנטנה':           {page:'Lantana camara',             small:'Lantana camara young plant',     large:'Lantana camara flower colorful orange yellow'},
  'היביסקוס':        {page:'Hibiscus rosa-sinensis',     small:'Hibiscus rosa-sinensis young',   large:'Hibiscus flower large red tropical'},
  'דולב':            {page:'Platanus orientalis',        small:'Platanus sapling young tree',    large:'Plane tree large autumn leaves'},
  'חרוב':            {page:'Carob',                      small:'Ceratonia siliqua young tree',   large:'Carob tree mature pods Mediterranean'},
  'אלת המסטיק':      {page:'Pistacia lentiscus',         small:'Pistacia lentiscus young shrub', large:'Pistacia lentiscus shrub Mediterranean'},
  'פיקוס בנג׳מין':   {page:'Ficus benjamina',            small:'Ficus benjamina young potted',   large:'Ficus benjamina tree large weeping'},
  'דרסנה':           {page:'Dracaena marginata',         small:'Dracaena marginata young pot',   large:'Dracaena plant indoor tropical tall'},
  'סנסוויריה':       {page:'Sansevieria trifasciata',    small:'Sansevieria young pot small',    large:'Sansevieria snake plant large indoor'},
  'זמיוקולקס':       {page:'Zamioculcas zamiifolia',     small:'Zamioculcas young plant pot',    large:'ZZ plant zamioculcas indoor large'},
  'אגבה':            {page:'Agave',                      small:'Agave young plant succulent',    large:'Agave plant large succulent landscape'},
  'אלוורה':          {page:'Aloe vera',                  small:'Aloe vera young pot small',      large:'Aloe vera plant large succulent outdoor'},
  'יוקה':            {page:'Yucca',                      small:'Yucca young plant pot',          large:'Yucca plant flower spike garden'},
  'במבוק':           {page:'Bamboo',                     small:'Bamboo shoot young culm',        large:'Bamboo grove green tall forest'},
  'פפירוס':          {page:'Cyperus papyrus',            small:'Cyperus papyrus young plant',    large:'Papyrus plant water tall reed'},
  'לוטוס':           {page:'Nelumbo nucifera',           small:'Lotus seedling water young',     large:'Lotus flower pink water pond'},
  'אגפנטוס':         {page:'Agapanthus',                 small:'Agapanthus young plant clump',   large:'Agapanthus flower blue purple garden'},
  'קורדילינה':       {page:'Cordyline australis',        small:'Cordyline young plant',          large:'Cordyline plant red leaves garden'},
  'גרניום':          {page:'Pelargonium',                small:'Pelargonium young plant pot',    large:'Geranium flower pink red garden window'},
  'פטוניה':          {page:'Petunia',                    small:'Petunia young seedling pot',     large:'Petunia flower colorful garden hanging'},
  'כלנית':           {page:'Anemone coronaria',          small:'Anemone coronaria young plant',  large:'Anemone coronaria flower red Israel field'},
  'אדמונית':         {page:'Cyclamen persicum',          small:'Cyclamen young plant pot',       large:'Cyclamen flower red pink garden'},
  'נרקיס':           {page:'Narcissus',                  small:'Narcissus bulb young sprout',    large:'Narcissus flower yellow daffodil field'},
  'צבעוני':          {page:'Tulip',                      small:'Tulip bulb young sprout green',  large:'Tulip flower red colorful field Holland'},
  'חמנייה':          {page:'Helianthus annuus',          small:'Helianthus annuus seedling',     large:'Sunflower field bloom yellow large'},
  'קלנדולה':         {page:'Calendula officinalis',      small:'Calendula seedling young plant', large:'Calendula flower orange yellow garden'},
  'ציניה':           {page:'Zinnia',                     small:'Zinnia seedling young plant',    large:'Zinnia flower colorful garden bloom'},
  'דשא יפני':        {page:'Zoysia japonica',            small:'Zoysia japonica young patch',    large:'Zoysia japonica lawn full green'},
  'דשא קוקויה':      {page:'Kikuyu grass',               small:'Pennisetum clandestinum patch',  large:'Kikuyu grass lawn dense green'},
  'קוקוס':           {page:'Coconut',                    small:'Cocos nucifera seedling young',  large:'Coconut palm tree tropical beach'},
  'ג׳קפרוט':         {page:'Jackfruit',                  small:'Artocarpus heterophyllus young', large:'Jackfruit tree large fruit trunk'},
  'פאלם ארקה':       {page:'Dypsis lutescens',           small:'Dypsis lutescens young plant',   large:'Areca palm tree tropical indoor'},
  'הדר תאית':        {page:'Pistacia chinensis',         small:'Pistacia chinensis young tree',  large:'Pistacia chinensis autumn color red'},
};

// שאיבת תמונה ראשית מדף ויקיפדיה

async function fetchWikipediaMainImage(pageName) {
  const cacheKey = `wp__${pageName}`;
  if (imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageName)}&prop=pageimages&pithumbsize=800&format=json&origin=*`;
    const resp = await fetch(url);
    const data = await resp.json();
    const pages = data.query?.pages;
    if (!pages) { imgCache[cacheKey] = null; return null; }
    const page = Object.values(pages)[0];
    const imgUrl = page?.thumbnail?.source || null;
    imgCache[cacheKey] = imgUrl;
    return imgUrl;
  } catch(e) {
    imgCache[cacheKey] = null;
    return null;
  }
}

// שאיבת תמונה מ-Wikimedia Commons לפי שאילתת חיפוש (לשלבי גדילה קטן/גדול)
async function fetchCommonsImage(query) {
  const cacheKey = `wc__${query}`;
  if (imgCache[cacheKey] !== undefined) return imgCache[cacheKey];
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=8&format=json&origin=*`;
    const searchResp = await fetch(searchUrl);
    const searchData = await searchResp.json();
    const results = searchData.query?.search;
    if (!results?.length) { imgCache[cacheKey] = null; return null; }
    const imageFile = results.find(r => /\.(jpg|jpeg|png|webp)/i.test(r.title));
    if (!imageFile) { imgCache[cacheKey] = null; return null; }
    const fileName = imageFile.title.replace('File:', '');
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(fileName)}&prop=imageinfo&iiprop=url&iiurlwidth=700&format=json&origin=*`;
    const infoResp = await fetch(infoUrl);
    const infoData = await infoResp.json();
    const pages = infoData.query?.pages;
    const page = pages ? Object.values(pages)[0] : null;
    const url = page?.imageinfo?.[0]?.thumburl || null;
    imgCache[cacheKey] = url;
    return imgCache[cacheKey];
  } catch(e) {
    imgCache[cacheKey] = null;
    return null;
  }
}

// פונקציה מרכזית - מחזירה URL תמונה לצמח ולשלב
async function fetchWikiImg(plantName, size) {
  const key = `${plantName}__${size}`;
  if (imgCache[key] !== undefined) return imgCache[key];

  const wikiInfo = WIKI_PAGES[plantName];

  let url = null;

  if (size === 'medium') {
    // לשלב הבינוני — תמונת ויקיפדיה ראשית
    if (wikiInfo?.page) {
      url = await fetchWikipediaMainImage(wikiInfo.page);
    }
  } else if (size === 'small') {
    // לשתיל — חיפוש ב-Commons
    const query = wikiInfo?.small || (plantName + ' seedling young');
    url = await fetchCommonsImage(query);
    // fallback לתמונת ויקיפדיה ראשית
    if (!url && wikiInfo?.page) url = await fetchWikipediaMainImage(wikiInfo.page);
  } else if (size === 'large') {
    // לבוגר — חיפוש ב-Commons
    const query = wikiInfo?.large || (plantName + ' mature tree');
    url = await fetchCommonsImage(query);
    // fallback לתמונת ויקיפדיה ראשית
    if (!url && wikiInfo?.page) url = await fetchWikipediaMainImage(wikiInfo.page);
  }

  // אם עדיין אין — נסה Commons עם שם ויקיפדיה
  if (!url && wikiInfo?.page) {
    url = await fetchCommonsImage(wikiInfo.page);
  }

  imgCache[key] = url;
  return url;
}

// פונקציה לצמחים חדשים שנוספים — מחפשת תמונת ויקיפדיה לפי שם הצמח
async function fetchImgForNewPlant(plantName) {
  // נסה ישירות עם שם הצמח
  let url = await fetchWikipediaMainImage(plantName);
  if (!url) url = await fetchCommonsImage(plantName + ' tree plant');
  return url;
}

// ===================================================
// PLANTS DATA
// ===================================================
const P=[
  {id:1,name:'ערבה בוכיה',type:'ornamental',bg:'ornamental',lbl:'נוי נשיר',e:'🌿',floor:'קומה עליונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול פנימי. לא לחתוך יותר מ-30%.',
   fert:'דשן 737 – פעם בחודש. לא לדשן ינואר-פברואר.',fm:[3,4,5,6,7,8,9,10],supp:null,sm:[],
   rules:'לחטא כלי עבודה. לא לגזום יותר מ-30%.',crit:null,
   waterSummer:40,waterWinter:10,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדל היטב בשפלה, מרכז וצפון. פחות מתאים לנגב ולערבה.',
   winter:'עץ ערום – בתרדמה. זמן גיזום אידיאלי.',summer:'ענפים ארוכים נופלים. צורת בכי מרשימה.',
   sizes:{small:'עד 1.5 מ׳ – שיח צעיר, ענפים נופלים עדינים',medium:'2-5 מ׳ – כיפת עלים מלאה, ענפים נופלים ארוכים',large:'5+ מ׳ – עץ בוגר נאצל עם צניחת ענפים מרשימה'}},
  {id:2,name:'תפוז טבורי',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍊',floor:'קומה עליונה',
   prune:'מרץ (אחרי הקטיף)',pm:[3],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול פנימי, הסרת "ינקים".',
   fert:'דשן ייעודי לעצי הדר – אפריל + אוגוסט.',fm:[4,8],supp:'קונפידור',sm:[4,9],
   rules:null,crit:null,
   waterSummer:30,waterWinter:12,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'שפלה, חוף, מרכז ודרום. לא מתאים לאזורי הר קרים.',
   harvestMonths:[11,12,1,2],
   winter:'ירוק עד עם פירות בשלים – עונת הקטיף.',summer:'פריחה לבנה ריחנית. פירות מתפתחים.',
   sizes:{small:'1-2 מ׳ – שתיל בגינה, כמות פרי קטנה',medium:'2-4 מ׳ – עץ צעיר מניב עם פירות',large:'4+ מ׳ – עץ בוגר, יבול גדול'}},
  {id:3,name:'לימון ננסי',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍋',floor:'קומה עליונה',
   prune:'מרץ (אחרי הקטיף)',pm:[3],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול פנימי, עיצוב.',
   fert:'דשן ייעודי לעצי הדר – אפריל + אוגוסט.',fm:[4,8],supp:'קונפידור',sm:[4,9],
   rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – ננסי מתאים לעציץ גם בדירות. מוגן מכפור חמור.',
   harvestMonths:[1,2,3,4,5,6,7,8,9,10,11,12],
   winter:'ירוק עד. פירות בשלים.',summer:'פריחה ריחנית. לימונים לאורך השנה.',
   sizes:{small:'0.5-1 מ׳ – שתיל בעציץ או אדנית',medium:'1-2 מ׳ – עץ ננסי מניב',large:'2-3 מ׳ – גובה מקסימלי לזן ננסי'}},
  {id:4,name:'פפאיה',type:'tropical',bg:'tropical',lbl:'עשבוני',e:'🌴',floor:'קומה עליונה',
   prune:'כל הזמן',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים מצהיבים בתחתית.',
   fert:'NPK 10-10-10 – מרץ + מאי-יוני.',fm:[3,5,6],supp:'קונפידור (רק אם כנימות)',sm:[],
   rules:'לשים לב לריקבון שורשים.',crit:'לבדוק ריקבון שורשים! רגיש להרטבת יתר.',
   waterSummer:20,waterWinter:8,waterType:'רדודה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'אזורים חמים בלבד: עמק הירדן, ים המלח, ערבה, בקעה, חוף. לא מתאים להר.',
   winter:'טרופי – חשש מכפור. לחמם.',summer:'גדילה מהירה. פירות גדולים על הגזע.',
   sizes:{small:'0.5-1 מ׳ – שתיל צעיר',medium:'1.5-3 מ׳ – מתחיל לניב, פירות ראשונים',large:'3-5 מ׳ – עץ מלא עם פירות על הגזע'}},
  {id:5,name:'שזיף פיסרדי',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍑',floor:'קומה עליונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה',pmth:'הסרת ענפים מתים, דילול.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור (רק אם כנימות)',sm:[],
   rules:null,crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – שפלה, מרכז, צפון והר. עמיד ועם יפי עלווה סגולה.',
   harvestMonths:[5,6,7],
   winter:'עץ ערום בתרדמה.',summer:'פרי שזיף סגול יפה. עלים סגולים-כהים.',
   sizes:{small:'1-2 מ׳ – שתיל עם ענפים דקים',medium:'2-4 מ׳ – עץ סגול עם פרי',large:'4+ מ׳ – עץ בוגר נוי ופרי'}},
  {id:6,name:'אבוקדו',type:'fruit',bg:'tropical',lbl:'ירוק עד עם פרי',e:'🥑',floor:'קומה תחתונה',
   prune:'ספטמבר-אוקטובר',pm:[9,10],pi:'קשה',pmth:'הסרת ענפים מתים, דילול, הסרת "ינקים", הנמכה.',
   fert:'5-10-10 – מרץ + מאי-יוני.',fm:[3,5,6],supp:'כילאט ברזל',sm:[9,10],
   rules:null,crit:null,
   waterSummer:35,waterWinter:12,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. רגיש לכפור – לא לאזורי הר. מצוין לגליל מערבי.',
   harvestMonths:[10,11,12,1,2],
   winter:'ירוק עד. פירות בשלים.',summer:'צמיחה פעילה. פירות מתפתחים.',
   sizes:{small:'1-2 מ׳ – שתיל צעיר, אסור לגזום!',medium:'2-4 מ׳ – מתחיל לניב, מאי-יוני הראשון',large:'4+ מ׳ – עץ מניב בשלות, יבול גדול'}},
  {id:7,name:'מנגו',type:'tropical',bg:'tropical',lbl:'טרופי',e:'🥭',floor:'קומה עליונה',
   prune:'אוגוסט (מיד אחרי הקטיף)',pm:[8],pi:'קשה',pmth:'הסרת ענפים מתים, דילול, הנמכה.',
   fert:'NPK 10-10-10 – מרץ + מאי-יוני.',fm:[3,5,6],supp:'כילאט ברזל',sm:[9,10],
   rules:'כשצעיר: לחתוך ל-1.5 מ׳ לעידוד ענפוב.',crit:null,
   waterSummer:30,waterWinter:10,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'אזורים חמים בלבד: עמק הירדן, ים המלח, ערבה, חוף. לא מתאים לכפור.',
   harvestMonths:[6,7,8,9],
   winter:'ירוק עד. פריחה בסוף חורף.',summer:'מנגו מתפתח. שיא הבשלה יוני-אוגוסט.',
   sizes:{small:'שתיל 0.5-1.5 מ׳ – ענף יחיד, בעציץ',medium:'2-4 מ׳ – עץ צעיר עם כמה ענפים',large:'4+ מ׳ – עץ בוגר עם מנגואים'}},
  {id:8,name:'פקאן',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🌰',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קל',pmth:'גיזום קל – ענפים יבשים, דילול פנימי.',
   fert:'דשן עשיר בחנקן 20-10-10 – אביב.',fm:[3,4],supp:'קונפידור',sm:[4,9],
   rules:'כשצעיר: שמור גזע מרכזי אחד.',crit:null,
   waterSummer:45,waterWinter:15,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'שפלה, עמקים, נגב צפוני. דורש גבהים נמוכים. לא להר גבוה.',
   harvestMonths:[10,11],
   winter:'עץ ערום.',summer:'אגוזים מתפתחים בקליפה ירוקה.',
   sizes:{small:'1-3 מ׳ – שמור גזע מרכזי חזק',medium:'3-6 מ׳ – מתחיל לניב אגוזים',large:'6+ מ׳ – עץ גדול, יבול גדול מדי שנה'}},
  {id:9,name:'צפצפה',type:'ornamental',bg:'ornamental',lbl:'נשיר ערבתיים',e:'🌳',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול, הנמכה.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:null,sm:[],
   rules:'לא לגזום את ראש העץ!',crit:'אסור לגזום ראש העץ!',
   waterSummer:50,waterWinter:15,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדל בכל אזור. שימושי כגדר רוח בנגב ובשדות.',
   winter:'ערום. ענפי הסתעפות גלויים.',summer:'עלים עגולים רוטטים. צל נעים.',
   sizes:{small:'2-5 מ׳ – עמוד צעיר צר ומוארך',medium:'5-10 מ׳ – עמוד ירוק גבוה',large:'10+ מ׳ – ענק ירוק שורה'}},
  {id:10,name:'נקטרינה',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍑',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה מאוד',pmth:'הסרת ענפים מתים, דילול, הסרת ענפי פרי, הנמכה.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור',sm:[9,10],
   rules:null,crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'שפלה, מרכז, עמקים, צפון. דורש קור חורפי לשינה. מצוין לגליל ולהר.',
   harvestMonths:[7,8],
   winter:'עץ ערום. גיזום חמור.',summer:'פרי אדום-צהוב. קטיף יולי-אוגוסט.',
   sizes:{small:'1-2 מ׳ – שתיל מורכב בגינה',medium:'2-4 מ׳ – מניב נקטרינות',large:'4+ מ׳ – עץ מלא, יבול גדול'}},
  {id:11,name:'תות עץ',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍓',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה מאוד',pmth:'הסרת ענפים מתים, דילול, הנמכה.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור (רק אם כנימות)',sm:[],
   rules:'לגזום מפעם לפעם לאורך העונה.',crit:null,
   waterSummer:30,waterWinter:10,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מותאם לשפלה, מרכז, צפון והר. עמיד ומצוין.',
   harvestMonths:[5,6],
   winter:'עץ ערום. גיזום חמור.',summer:'פרי שחור/לבן. קטיף מאי-יוני.',
   sizes:{small:'1-2 מ׳ – שתיל עם ענפים דקים',medium:'2-5 מ׳ – מניב תות שחור/לבן',large:'5+ מ׳ – עץ גדול עם יבול עצום'}},
  {id:12,name:'תפוח פינק ליידי',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍎',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה מאוד',pmth:'הסרת ענפים מתים, דילול, הנמכה, קיצור.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור (רק אם כנימות)',sm:[],
   rules:'דילול פירות: השאר פרי אחד כל 15-20 ס"מ.',crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר, צפון, גליל – דורש שעות צינה חורפיות רבות. לא לשפלה החמה.',
   harvestMonths:[11,12],
   winter:'ערום. תרדמה עמוקה.',summer:'תפוחים ורודים. קטיף נובמבר-דצמבר.',
   sizes:{small:'1-2 מ׳ – שתיל, פריחה ורודה ראשונה',medium:'2-4 מ׳ – מניב תפוחים ורודים',large:'4+ מ׳ – עץ מלא, יבול גדול'}},
  {id:13,name:'אלה סינית',type:'ornamental',bg:'ornamental',lbl:'נוי נשיר',e:'🌸',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קל מאוד',pmth:'הסרת ענפים מתים, עיצוב קל.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:null,sm:[],
   rules:'ההסתעפויות הפרטניות הן היופי. רק ענפים נמוכים.',crit:null,
   waterSummer:20,waterWinter:6,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד. מתאים לנגב, הר, שפלה וחוף.',
   winter:'ערום. ענפי הסתעפות אדומים יפים.',summer:'עלים ירוקים. צל נעים.',
   sizes:{small:'1-3 מ׳ – עץ צעיר, ענפוב מוקדם',medium:'3-6 מ׳ – כיפה ירוקה יפה',large:'6+ מ׳ – עץ נוי גדול ומרשים'}},
  {id:14,name:'פומלה',type:'fruit',bg:'citrus',lbl:'פרי הדר ירוק עד',e:'🍈',floor:'קומה תחתונה',
   prune:'פברואר (אחרי הקטיף)',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול, הסרת "ינקים", הנמכה.',
   fert:'דשן ייעודי לעצי הדר – אפריל + אוגוסט.',fm:[4,8],supp:'קונפידור',sm:[4,9],
   rules:null,crit:null,
   waterSummer:35,waterWinter:12,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. אינו עמיד לכפור – לא להר.',
   harvestMonths:[1,2,3,4],
   winter:'ירוק עד. פירות ענקיים.',summer:'פריחה לבנה. פרי צעיר מתפתח.',
   sizes:{small:'1-2 מ׳ – שתיל הדר',medium:'2-5 מ׳ – עץ מניב עם פומלות ענקיות',large:'5+ מ׳ – עץ בוגר, יבול גדול'}},
  {id:15,name:'שקד',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🌸',floor:'קומה תחתונה',
   prune:'דצמבר (אחרי הקטיף)',pm:[12],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול ועיצוב.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור',sm:[9],
   rules:'נקטף יולי-אוגוסט.',crit:null,
   waterSummer:20,waterWinter:6,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לנגב, שפלה, הר ועמקים. עמיד מאוד לתנאי ישראל.',
   harvestMonths:[7,8],
   winter:'ערום. פריחה לבנה-ורודה ינואר-פברואר!',summer:'שקדים מבשילים יולי-אוגוסט.',
   sizes:{small:'1-3 מ׳ – שתיל, פריחה עדינה',medium:'3-5 מ׳ – עץ צעיר מניב שקדים',large:'5+ מ׳ – עץ בוגר, יבול שנתי גדול'}},
  {id:16,name:'גודגדן',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍒',floor:'קומה תחתונה',
   prune:'פברואר-מרץ (עץ ערום)',pm:[2,3],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול, הנמכה, קיצור.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'⚠️ רגיש לקונפידור!',sm:[],
   rules:'מחלת הנקודה השחורה: לאסוף עלים ולשרוף.',
   crit:'רגיש לקונפידור! שימוש אסור ללא התייעצות.',
   waterSummer:20,waterWinter:8,waterType:'עמוקה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'הר, צפון, גליל, כרמל. דורש צינה חורפית. לא לאזורי חוף חמים.',
   harvestMonths:[5,6],
   winter:'עץ ערום. תרדמה.',summer:'פרי כהה. קטיף מאי-יוני.',
   sizes:{small:'0.5-1 מ׳ – שיח קטן צעיר',medium:'1-2 מ׳ – שיח מניב עם פרי',large:'2+ מ׳ – שיח בוגר מלא'}},
  {id:17,name:'פטל',type:'bush',bg:'bush',lbl:'שיח',e:'🍇',floor:'נספחים',
   prune:'חורף',pm:[12,1,2],pi:'קשה',pmth:'גזור ענפים שנתנו פרי ל-40-60 ס"מ.',
   fert:'NPK 10-10-10 – אפריל + יולי.',fm:[4,7],supp:null,sm:[],
   rules:'לחתוך כמעט כל השיח ל-40-60 ס"מ.',crit:null,
   waterSummer:15,waterWinter:5,waterType:'רדודה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'הר, צפון, גליל, כרמל. מצוין לאזורים קרירים. לא לאזורים חמים מאוד.',
   winter:'גיזום חמור ל-40-60 ס"מ.',summer:'פרי פטל אדום. קטיף יוני-אוגוסט.',
   sizes:{small:'0.5-1 מ׳ – עקרה חדשה, ענפים ראשונים',medium:'1-1.5 מ׳ – שיח מניב עם פטלים',large:'1.5+ מ׳ – שיח מלא, יבול גדול'}},
  {id:18,name:'אוכמניות',type:'bush',bg:'bush',lbl:'שיח',e:'🫐',floor:'נספחים',
   prune:'אוגוסט (אחרי הקטיף)',pm:[8],pi:'בינוני',pmth:'דילול, הסרת ענפים פנימיים וענפים יבשים.',
   fert:'דשן אוכמניות – מרץ + יולי.',fm:[3,7],supp:'גופרית',sm:[3,6,9],
   rules:'יוני-ספטמבר: בדיקה שבועית לזבוב לבן! 2 כפיות שמן קנולה + ליטר מים.',
   crit:'בדיקה שבועית לזבוב לבן יוני-ספטמבר!',
   waterSummer:12,waterWinter:5,waterType:'רדודה',
   light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לקור'],indoor:true,
   geo:'הר, צפון, גליל. דורש קרקע חומצית ואוויר קריר. לא לדרום ולערבה.',
   winter:'שיח ירוק. קרקע חומצית.',summer:'אוכמניות כחולות. חובה לבדוק זבוב!',
   sizes:{small:'0.5-1 מ׳ – שתיל חמוץ בעציץ',medium:'1-1.5 מ׳ – שיח מניב אוכמניות',large:'1.5+ מ׳ – שיח בוגר מלא'}},
  {id:19,name:'דשא יפני',type:'lawn',bg:'lawn',lbl:'דשא',e:'🌾',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'מקסגארד – אפריל + אוקטובר.',fm:[4,10],supp:null,sm:[],
   rules:'חובה להשקות לפני ואחרי דישון!',crit:'חובה להשקות לפני ואחרי דישון.',
   waterSummer:25,waterWinter:8,waterType:'רדודה',
   light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:false,
   geo:'שפלה, חוף, מרכז ונגב. עמיד לחום. פחות מתאים לאזורי הר קרים.',
   winter:'ירוק מתון בחורף.',summer:'גדילה מהירה. מדשאה עבה.',
   sizes:{small:'שטח עד 20 מ"ר – דשא חדש, ספרגה דלילה',medium:'20-100 מ"ר – מדשאה מבוססת, צפיפות טובה',large:'100+ מ"ר – מדשאה גדולה עשירה'}},
  {id:20,name:'דשא קוקויה',type:'lawn',bg:'lawn',lbl:'דשא',e:'🌿',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'מקסגארד – אפריל + אוקטובר.',fm:[4,10],supp:null,sm:[],
   rules:'חובה להשקות לפני ואחרי דישון!',crit:'חובה להשקות לפני ואחרי דישון.',
   waterSummer:30,waterWinter:10,waterType:'רדודה',
   light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לשפלה, חוף, עמקים ונגב. עמיד מאוד לחום ולבצורת.',
   winter:'יכול להצהיב – נורמלי. ייתאושש באביב.',summer:'גדילה אגרסיבית. עמיד לחום ועמ.',
   sizes:{small:'שטח קטן – שתילה חדשה',medium:'שטח בינוני – מדשאה מבוססת',large:'מדשאה גדולה – מכסה מלא'}},
{id:21,name:'רימון',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍎',floor:'קומה עליונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קל',pmth:'הסרת ענפים מתים, דילול, הסרת יניקות.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:null,sm:[],rules:'מסיר יניקות מהבסיס כל עונה.',crit:null,
   waterSummer:15,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד לחום וצינה.',harvestMonths:[9,10,11],
   winter:'עץ ערום. תרדמה.',summer:'פריחה אדומה. פרי מתפתח.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:22,name:'תאנה',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🫐',floor:'קומה עליונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול, הנמכה.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:null,sm:[],rules:'קטיף כשהפרי רך למגע.',crit:null,
   waterSummer:20,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עץ ים תיכוני קלאסי.',harvestMonths:[7,8,9],
   winter:'עץ ערום.',summer:'תאנים מבשילות.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:23,name:'זית',type:'fruit',bg:'fruit',lbl:'ירוק עד',e:'🫒',floor:'קומה עליונה',
   prune:'לאחר הקטיף (נובמבר-דצמבר)',pm:[11,12],pi:'בינוני',pmth:'דילול, הסרת ענפים מתים, הנמכה.',
   fert:'דשן לעצי פרי – פברואר.',fm:[2],supp:null,sm:[],rules:'לא לגזום יותר מ-20% בשנה.',crit:null,
   waterSummer:10,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עץ ישראלי מובהק. עמיד מאוד לבצורת.',harvestMonths:[10,11,12],
   winter:'ירוק עד. קטיף זיתים.',summer:'גדילה איטית. עמיד לחום.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:24,name:'ענב',type:'fruit',bg:'fruit',lbl:'גפן',e:'🍇',floor:'קומה עליונה',
   prune:'ינואר-פברואר (גיזום חמור)',pm:[1,2],pi:'קשה מאוד',pmth:'גיזום חמור – השאר רק 2-3 עיניים על כל זרד.',
   fert:'NPK + מגנזיום – מרץ.',fm:[3],supp:'גופרית',sm:[3,5,7],rules:'גיזום חמור הכרחי לפרי איכותי.',crit:'ללא גיזום חמור – אין פרי!',
   waterSummer:20,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לשפלה, הר ועמקים.',harvestMonths:[7,8,9],
   winter:'ערום לגמרי. זמן גיזום.',summer:'אשכולות ענבים מבשילים.',sizes:{small:'שתיל חדש',medium:'גפן מבוססת',large:'גפן ותיקה'}},
  {id:25,name:'אפרסק',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍑',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה מאוד',pmth:'גיזום חמור – הסרת ענפי פרי ישנים, דילול.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור',sm:[9,10],rules:'דילול פירות: השאר פרי אחד כל 15 ס"מ.',crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'שפלה, מרכז, עמקים, גליל. דורש שעות צינה.',harvestMonths:[6,7],
   winter:'עץ ערום.',summer:'אפרסקים כתומים.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:26,name:'אגס',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍐',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קשה',pmth:'הסרת ענפים מתים, דילול, הנמכה.',
   fert:'NPK 10-10-10 – פברואר/מרץ.',fm:[2,3],supp:'קונפידור',sm:[9,10],rules:'דורש מאביק – שתול שני עץ קרוב.',crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, כרמל. דורש צינה חורפית רבה.',harvestMonths:[8,9],
   winter:'עץ ערום.',summer:'אגסים ירוקים/צהובים.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:27,name:'שסק',type:'fruit',bg:'fruit',lbl:'ירוק עד',e:'🟡',floor:'קומה עליונה',
   prune:'לאחר הקטיף (מאי-יוני)',pm:[5,6],pi:'קל',pmth:'דילול קל, הסרת ענפים מתים.',
   fert:'דשן הדרים – אפריל + אוגוסט.',fm:[4,8],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. לא עמיד לכפור.',harvestMonths:[3,4,5],
   winter:'ירוק עד. פריחה לבנה.',summer:'פרי צהוב-כתום.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:28,name:'מנדרינה',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍊',floor:'קומה עליונה',
   prune:'מרץ-אפריל',pm:[3,4],pi:'קל',pmth:'הסרת ענפים מתים, דילול, הסרת ינקות.',
   fert:'דשן הדרים – אפריל + אוגוסט.',fm:[4,8],supp:'קונפידור',sm:[4,9],rules:null,crit:null,
   waterSummer:25,waterWinter:10,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. לא להר קר.',harvestMonths:[11,12,1,2],
   winter:'ירוק עד. פירות בשלים.',summer:'פריחה ריחנית.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:29,name:'אשכולית',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍋',floor:'קומה עליונה',
   prune:'מרץ-אפריל',pm:[3,4],pi:'קל',pmth:'הסרת ענפים מתים, דילול.',
   fert:'דשן הדרים – אפריל + אוגוסט.',fm:[4,8],supp:'קונפידור',sm:[4,9],rules:null,crit:null,
   waterSummer:30,waterWinter:12,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה. דורש חום. לא להר.',harvestMonths:[12,1,2,3],
   winter:'ירוק עד. פירות בשלים.',summer:'פריחה.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:30,name:'בננה',type:'tropical',bg:'tropical',lbl:'טרופי',e:'🍌',floor:'קומה עליונה',
   prune:'לאחר הקטיף – חתוך גזע עד הקרקע',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'חתוך גזע ישן לאחר קטיף. השאר יורשים.',
   fert:'NPK עשיר + אשלגן – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'השאר 1-2 יורשים לגזע.',crit:'רגישה מאוד לכפור!',
   waterSummer:35,waterWinter:15,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'עמק הירדן, ים המלח, ערבה, חוף. לא להר.',harvestMonths:[6,7,8,9,10],
   winter:'רגישה לכפור – לחמם.',summer:'אשכולות מתפתחים.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:31,name:'תמר',type:'fruit',bg:'tropical',lbl:'דקל',e:'🌴',floor:'קומה עליונה',
   prune:'הסרת עלים יבשים – כל עת',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל',pmth:'הסרת כפות יבשות בלבד.',
   fert:'NPK + מגנזיום – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'לאביק ידנית.',crit:'דורש אבקה ידנית לפרי!',
   waterSummer:25,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'נגב, ערבה, עמק הירדן. דורש חום רב.',harvestMonths:[9,10,11],
   winter:'ירוק עד.',summer:'תמרים מבשילים.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:32,name:'פיג׳ואה',type:'fruit',bg:'fruit',lbl:'ירוק עד',e:'🟢',floor:'קומה עליונה',
   prune:'לאחר הקטיף (מאי-יוני)',pm:[5,6],pi:'קל',pmth:'עיצוב, דילול קל.',
   fert:'NPK – פברואר + יוני.',fm:[2,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד.',harvestMonths:[3,4,5],
   winter:'ירוק עד.',summer:'פריחה אדומה יפהפייה.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:33,name:'סברס',type:'fruit',bg:'tropical',lbl:'צבר',e:'🌵',floor:'קומה עליונה',
   prune:'הסרת אונות מיותרות',pm:[3,4],pi:'קל מאוד',pmth:'הסרת אונות עודפות בכפפות עבות.',
   fert:'דשן קקטוסים – אביב.',fm:[3,4],supp:null,sm:[],rules:'זהירות מקוצים!',crit:'קוצים חדים מאוד – כפפות חובה!',
   waterSummer:5,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדל בכל מקום.',harvestMonths:[7,8,9],
   winter:'ירוק עד.',summer:'פרי כתום-אדום.',sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:34,name:'קיווי',type:'fruit',bg:'fruit',lbl:'גפן פרי',e:'🥝',floor:'קומה עליונה',
   prune:'ינואר-פברואר',pm:[1,2],pi:'קשה',pmth:'גיזום חמור – השאר ענפי פרי חדשים.',
   fert:'NPK עשיר חנקן – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'דורש זכר ונקבה.',crit:'חייב זכר ונקבה לפריה!',
   waterSummer:30,waterWinter:10,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, כרמל, צפון. דורש צינה.',harvestMonths:[10,11],
   winter:'ערום. גיזום.',summer:'פרי ירוק מתפתח.',sizes:{small:'שתיל',medium:'גפן מבוססת',large:'גפן גדולה מניבה'}},
  {id:35,name:'דובדבן',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🍒',floor:'קומה תחתונה',
   prune:'לאחר הקטיף (יוני-יולי)',pm:[6,7],pi:'בינוני',pmth:'דילול, הסרת ענפים מתים.',
   fert:'NPK 10-10-10 – פברואר.',fm:[2],supp:null,sm:[],rules:'דורש מאביק – שתול שני זן.',crit:null,
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר גבוה, גולן, הרמון. דורש צינה רבה מאוד.',harvestMonths:[5,6],
   winter:'עץ ערום.',summer:'דובדבנים אדומים.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:36,name:'תות שדה',type:'bush',bg:'bush',lbl:'שיח',e:'🍓',floor:'נספחים',
   prune:'לאחר הקטיף – קיצוץ עלים ישנים',pm:[4,5],pi:'קל',pmth:'הסרת עלים ישנים לאחר הקטיף.',
   fert:'דשן תותים – ספטמבר + פברואר.',fm:[9,2],supp:null,sm:[],rules:'שתול ספטמבר-אוקטובר.',crit:null,
   waterSummer:12,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – מצוין לעציץ ולגינה.',harvestMonths:[2,3,4,5],
   winter:'פעיל. קטיף מתחיל פברואר.',summer:'תרדמה חלקית.',sizes:{small:'שתיל',medium:'שיח מניב',large:'שיח מבוסס'}},
  {id:37,name:'נענע',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף = גיזום',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים עליונים בקביעות.',
   fert:'דשן כללי – פעם בחודש.',fm:[3,4,5,6,7,8,9],supp:null,sm:[],rules:'קטיף תכוף מעודד גדילה.',crit:'פולשני מאוד – שתול בעציץ!',
   waterSummer:15,waterWinter:8,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – חייב להיות בעציץ!',
   winter:'פעיל.',summer:'גדילה מהירה.',sizes:{small:'שתיל',medium:'שיח עבות',large:'שיח גדול'}},
  {id:38,name:'רוזמרין',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'לאחר פריחה – קיצוץ קל',pm:[4,5],pi:'קל מאוד',pmth:'קיצוץ שליש מהצמח לאחר פריחה.',
   fert:'דשן כללי – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – ים תיכוני מובהק. עמיד לבצורת.',
   winter:'ירוק עד. פריחה כחולה.',summer:'עמיד לחום.',sizes:{small:'20-40 ס"מ',medium:'40-80 ס"מ',large:'1+ מ׳'}},
  {id:39,name:'לבנדר',type:'bush',bg:'bush',lbl:'שיח',e:'💜',floor:'נספחים',
   prune:'לאחר פריחה – קיצוץ שליש',pm:[7,8],pi:'קל',pmth:'קיצוץ שליש עליון לאחר פריחה.',
   fert:'דשן כללי – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:6,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – עמיד לחום ולצינה.',
   winter:'ירוק עד. עמיד.',summer:'פריחה סגולה ריחנית.',sizes:{small:'20-30 ס"מ',medium:'30-60 ס"מ',large:'60+ ס"מ'}},
  {id:40,name:'מרווה',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'לאחר פריחה',pm:[4,5],pi:'קל מאוד',pmth:'קיצוץ שליש.',
   fert:'דשן כללי – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:6,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – ים תיכוני. עמיד מאוד.',
   winter:'ירוק עד.',summer:'עמיד לחום.',sizes:{small:'20-30 ס"מ',medium:'30-60 ס"מ',large:'60+ ס"מ'}},
  {id:41,name:'בזיליקום',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קיצוץ כפתורי פרח לפני פריחה',pm:[4,5,6,7,8,9],pi:'קל',pmth:'הסרת כפתורי פרח בקביעות.',
   fert:'דשן כללי – כל שבועיים.',fm:[4,5,6,7,8,9],supp:null,sm:[],rules:'הסר פרחים כדי שלא יזריע.',crit:'אם יפרח ויזריע — יגווע!',
   waterSummer:15,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – שנתי קיץ. גם בעציץ.',
   winter:null,summer:'גדילה מהירה. ריח עז.',sizes:{small:'שתיל',medium:'שיח 30 ס"מ',large:'שיח 50+ ס"מ'}},
  {id:42,name:'הדס',type:'ornamental',bg:'ornamental',lbl:'נוי ירוק עד',e:'🌿',floor:'קומה תחתונה',
   prune:'לאחר הסוכות – גיזום עיצובי',pm:[10],pi:'קל מאוד',pmth:'גיזום עיצובי.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'עמוקה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני. עמיד מאוד.',
   winter:'ירוק עד.',summer:'עמיד לחום.',sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:43,name:'ברוש',type:'ornamental',bg:'ornamental',lbl:'נוי ירוק עד',e:'🌲',floor:'קומה עליונה',
   prune:'לא לגזום!',pm:[],pi:null,pmth:'ברוש לא מתגזם — צמיחה טבעית בלבד.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:'לא לגזום בשום אופן!',crit:'אסור לגזום ברוש!',
   waterSummer:10,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד. ים תיכוני קלאסי.',
   winter:'ירוק עד.',summer:'עמיד לחום.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:44,name:'בוגנוויליה',type:'ornamental',bg:'ornamental',lbl:'שיח מטפס',e:'🌺',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[9,10],pi:'בינוני',pmth:'קיצוץ חמור לאחר פריחה לעידוד פריחה חדשה.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'ככל שמגזמים יותר — פורחת יותר.',crit:null,
   waterSummer:10,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז, נגב. עמיד לחום.',
   winter:'ירוק עד. פריחה חורפית.',summer:'פריחה עזה.',sizes:{small:'שתיל',medium:'2-3 מ׳',large:'5+ מ׳'}},
  {id:45,name:'הורדה',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🌹',floor:'נספחים',
   prune:'פברואר (גיזום חמור)',pm:[2],pi:'קשה',pmth:'גיזום חמור ל-30 ס"מ מהקרקע.',
   fert:'דשן ורדים – מרץ + מאי + אוגוסט.',fm:[3,5,8],supp:'גופרית',sm:[3,6,9],rules:'חתוך פרחים קמלים בקביעות.',crit:null,
   waterSummer:20,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – מצוין לשפלה, מרכז והר.',
   winter:'גיזום חמור. תרדמה.',summer:'פריחה עשירה.',sizes:{small:'20-40 ס"מ',medium:'40-80 ס"מ',large:'80+ ס"מ'}},
  {id:46,name:'יסמין',type:'ornamental',bg:'ornamental',lbl:'שיח מטפס',e:'🌸',floor:'נספחים',
   prune:'לאחר פריחה',pm:[7,8],pi:'קל',pmth:'קיצוץ שליש לאחר פריחה.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה, מרכז. רגיש לקור חמור.',
   winter:'ירוק עד.',summer:'פריחה לבנה ריחנית עזה.',sizes:{small:'שתיל',medium:'1-2 מ׳',large:'3+ מ׳'}},
  {id:47,name:'פיקוס בנג׳מין',type:'ornamental',bg:'ornamental',lbl:'נוי ירוק עד',e:'🌿',floor:'קומה תחתונה',
   prune:'אפריל-מאי',pm:[4,5],pi:'קל',pmth:'עיצוב, הסרת ענפים מתים.',
   fert:'דשן כללי – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'רגיש לשינויי מיקום – לא להזיז.',crit:'שינוי מיקום גורם לנשירת עלים!',
   waterSummer:15,waterWinter:8,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה, מרכז. רגיש לכפור.',
   winter:'ירוק עד בבית.',summer:'גדילה פעילה.',sizes:{small:'0.5-1 מ׳',medium:'1-3 מ׳',large:'3+ מ׳'}},
  {id:48,name:'דרסנה',type:'ornamental',bg:'ornamental',lbl:'נוי טרופי',e:'🌿',floor:'קומה תחתונה',
   prune:'קיצוץ עלים צהובים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים צהובים ויבשים.',
   fert:'דשן כללי – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:5,waterType:'רדודה',light:'חצי שמש',lightAlt:'צל',climate:['עמיד לשרב'],indoor:true,
   geo:'בכל הארץ – מצוין לבית ולמשרד.',
   winter:'ירוק עד.',summer:'גדילה מתונה.',sizes:{small:'20-50 ס"מ',medium:'50 ס"מ – 1 מ׳',large:'1-2 מ׳'}},
  {id:49,name:'סנסוויריה',type:'ornamental',bg:'ornamental',lbl:'נוי עמיד',e:'🌿',floor:'קומה תחתונה',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'דשן כללי – פעם בחצי שנה.',fm:[3,9],supp:null,sm:[],rules:'השקה מועטה מאוד.',crit:'השקת יתר הורגת אותה!',
   waterSummer:5,waterWinter:2,waterType:'רדודה',light:'חצי שמש',lightAlt:'צל',climate:['עמיד לשרב'],indoor:true,
   geo:'בית ומשרד בכל הארץ.',
   winter:'פעיל.',summer:'פעיל.',sizes:{small:'20-30 ס"מ',medium:'30-60 ס"מ',large:'60+ ס"מ'}},
  {id:50,name:'זמיוקולקס',type:'ornamental',bg:'ornamental',lbl:'נוי עמיד',e:'🌿',floor:'קומה תחתונה',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'דשן כללי – פעם בחצי שנה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:4,waterWinter:2,waterType:'רדודה',light:'צל',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'בית ומשרד – עמיד לצל עמוק.',
   winter:'פעיל.',summer:'פעיל.',sizes:{small:'20-40 ס"מ',medium:'40-80 ס"מ',large:'80+ ס"מ'}},
  {id:51,name:'פלמריה',type:'ornamental',bg:'ornamental',lbl:'עץ טרופי',e:'🌸',floor:'קומה עליונה',
   prune:'פברואר',pm:[2],pi:'קל מאוד',pmth:'עיצוב קל.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:15,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה. רגיש לכפור — לא להר.',
   winter:'נושר. מנוחה.',summer:'פריחה ורודה/לבנה ריחנית.',sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:52,name:'חרוב',type:'ornamental',bg:'ornamental',lbl:'ירוק עד',e:'🌳',floor:'קומה תחתונה',
   prune:'לא לגזום',pm:[],pi:null,pmth:null,
   fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד לבצורת.',
   winter:'ירוק עד.',summer:'עמיד לחום.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:53,name:'שיזף',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🟤',floor:'קומה עליונה',
   prune:'פברואר',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:4,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד. מצוין לנגב.',harvestMonths:[8,9,10],
   winter:'ערום.',summer:'פרי קטן מתוק.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:54,name:'פשיפלורה',type:'fruit',bg:'fruit',lbl:'גפן פרי',e:'🌸',floor:'קומה עליונה',
   prune:'פברואר',pm:[2],pi:'בינוני',pmth:'קיצוץ ענפים ישנים, השאר ענפים חדשים.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. רגיש לכפור.',harvestMonths:[6,7,8,9],
   winter:'ירוק עד.',summer:'פרי סגול ריחני.',sizes:{small:'שתיל',medium:'גפן 2-3 מ׳',large:'גפן 5+ מ׳'}},
  {id:55,name:'עגבנייה',type:'fruit',bg:'fruit',lbl:'ירק פרי',e:'🍅',floor:'נספחים',
   prune:'קיצוץ ירי לפחות פעם בשבוע',pm:[3,4,5,6,7,8,9],pi:'בינוני',pmth:'הסרת ירי (shoots) מסדק בין גזע לענף.',
   fert:'NPK + סידן + אשלגן – כל שבועיים.',fm:[3,4,5,6,7,8,9],supp:null,sm:[],rules:'קשור לתמיכה. הסר ירי שבועי.',crit:null,
   waterSummer:20,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – שנתי. גדל גם בעציץ גדול.',harvestMonths:[5,6,7,8,9,10],
   winter:null,summer:'עגבניות אדומות לאורך הקיץ.',sizes:{small:'שתיל',medium:'צמח 1 מ׳',large:'צמח 2+ מ׳'}},
  {id:56,name:'מלפפון',type:'fruit',bg:'fruit',lbl:'ירק פרי',e:'🥒',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'NPK – כל שבועיים.',fm:[3,4,5,6,7,8],supp:null,sm:[],rules:'קשור לתמיכה אנכית.',crit:null,
   waterSummer:15,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – שנתי קיץ. מתאים לעציץ.',harvestMonths:[5,6,7,8,9],
   winter:null,summer:'מלפפונים לאורך הקיץ.',sizes:{small:'שתיל',medium:'גפן',large:'גפן מלאה'}},
  {id:57,name:'פלפל',type:'fruit',bg:'fruit',lbl:'ירק פרי',e:'🫑',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'NPK + סידן – כל שבועיים.',fm:[3,4,5,6,7,8],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – שנתי. גם בעציץ.',harvestMonths:[6,7,8,9,10],
   winter:null,summer:'פלפלים צבעוניים.',sizes:{small:'שתיל',medium:'שיח 60 ס"מ',large:'שיח 1 מ׳'}},
  {id:58,name:'אבטיח',type:'fruit',bg:'fruit',lbl:'ירק פרי',e:'🍉',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'NPK + סידן – שתילה + 3 שבועות.',fm:[4,5],supp:null,sm:[],rules:'שתול אפריל-מאי.',crit:null,
   waterSummer:30,waterWinter:null,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – שנתי קיץ.',harvestMonths:[7,8],
   winter:null,summer:'קטיף יולי-אוגוסט.',sizes:{small:'שתיל',medium:'גפן מתפשטת',large:'גפן עם פירות'}},
  {id:59,name:'חציל',type:'fruit',bg:'fruit',lbl:'ירק פרי',e:'🍆',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,
   fert:'NPK – כל שבועיים.',fm:[4,5,6,7],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – שנתי קיץ.',harvestMonths:[6,7,8,9,10],
   winter:null,summer:'חצילים סגולים.',sizes:{small:'שתיל',medium:'שיח 70 ס"מ',large:'שיח 1+ מ׳'}},
  {id:60,name:'אורן ירושלים',type:'ornamental',bg:'ornamental',lbl:'עץ יער',e:'🌲',floor:'קומה עליונה',
   prune:'לא לגזום!',pm:[],pi:null,pmth:'גיזום רק ענפים מתים.',
   fert:'לא דורש דישון.',fm:[],supp:null,sm:[],rules:'עץ יער — לא לדשן ולא לגזום.',crit:null,
   waterSummer:8,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'הר, שפלה, מרכז. ים תיכוני מובהק.',
   winter:'ירוק עד.',summer:'עמיד מאוד לחום ובצורת.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}}

,
  {id:61,name:'אקליפטוס',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'🌿',floor:'קומה תחתונה',
   prune:'פברואר – גיזום חמור לגובה',pm:[2],pi:'קל',pmth:'גיזום גזע לגובה הרצוי בלבד.',
   fert:'לא דורש.',fm:[],supp:null,sm:[],rules:'גדל מאוד מהר — לגזום לגובה הרצוי.',crit:null,
   waterSummer:20,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדל בכל מקום. טוב כגדר רוח.',winter:'ירוק עד.',summer:'גדילה מהירה.',
   sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:62,name:'דולב',type:'ornamental',bg:'ornamental',lbl:'עץ נשיר',e:'🌳',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קל',pmth:'הסרת ענפים מתים, דילול.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:30,waterWinter:10,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לצל ולנוי.',winter:'ערום. קליפה מנומרת יפה.',summer:'עלים גדולים. צל מצוין.',
   sizes:{small:'2-5 מ׳',medium:'5-10 מ׳',large:'10+ מ׳'}},
  {id:63,name:'אורן אלפי',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'🌲',floor:'קומה עליונה',
   prune:'לא לגזום',pm:[],pi:null,pmth:null,fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, גולן. דורש קור חורפי.',winter:'ירוק עד.',summer:'עמיד.',
   sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:64,name:'שיטה',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'🌼',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[3,4],pi:'קל',pmth:'קיצוץ עיצובי לאחר פריחה.',
   fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני. פורחת ינואר-פברואר.',winter:'פריחה צהובה מרהיבה.',summer:'ירוק-אפור. עמיד לחום.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:65,name:'אלת המסטיק',type:'ornamental',bg:'ornamental',lbl:'ירוק עד',e:'🌳',floor:'קומה תחתונה',
   prune:'ספטמבר-אוקטובר',pm:[9,10],pi:'קל מאוד',pmth:'עיצוב קל בלבד.',
   fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עץ מקומי ישראלי. עמיד מאוד.',winter:'ירוק עד.',summer:'עמיד לחום ובצורת.',
   sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:66,name:'קסיה',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'🌼',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[8,9],pi:'קל',pmth:'קיצוץ עיצובי.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:15,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. פורח צהוב בסוף הקיץ.',winter:'ירוק עד.',summer:'פריחה צהובה מרהיבה.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:67,name:'טבק נאה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'נספחים',
   prune:'לאחר פריחה',pm:[9,10],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – פורח אדום-ורוד כל הקיץ.',winter:'ירוק עד.',summer:'פריחה עשירה. עמיד לחום.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:68,name:'אדמונית',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌺',floor:'נספחים',
   prune:'לאחר נבילת הפרח',pm:[3,4,5],pi:'קל',pmth:'הסרת עלים יבשים לאחר נבילה.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול בצלים ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – פורחת פברואר-מרץ.',winter:'פריחה אדומה מרהיבה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח גדול'}},
  {id:69,name:'נרקיס',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌼',floor:'נספחים',
   prune:'לאחר נבילה',pm:[3,4],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול בצלים ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – פורח ינואר-מרץ.',winter:'פריחה צהובה ריחנית.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח גדול'}},
  {id:70,name:'צבעוני',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌷',floor:'נספחים',
   prune:'לאחר נבילה',pm:[3,4],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול בצלים ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – פורח פברואר-אפריל.',winter:'פריחה צבעונית.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח גדול'}},
  {id:71,name:'קלנדולה',type:'ornamental',bg:'ornamental',lbl:'חד-שנתי',e:'🌼',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[11,12,1,2,3,4,5],pi:'קל מאוד',pmth:'הסרת פרחים קמלים לעידוד פריחה.',
   fert:'דשן פורחים – חודשי.',fm:[11,12,1,2,3,4,5],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – חורפי. פורח אוקטובר-מאי.',winter:'פריחה כתומה-צהובה.',summer:'תמות מהחום.',
   sizes:{small:'שתיל',medium:'שיח קטן',large:'שטח גדול'}},
  {id:72,name:'פטוניה',type:'ornamental',bg:'ornamental',lbl:'חד-שנתי',e:'🌸',floor:'נספחים',
   prune:'קיצוץ חמור כל חודשיים',pm:[3,4,5,6,7,8,9],pi:'קל',pmth:'קיצוץ חמור לחצי הצמח לעידוד ענפים חדשים.',
   fert:'דשן פורחים – כל שבועיים.',fm:[3,4,5,6,7,8,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – קיצי. פורח כל הקיץ.',winter:'מתה מהקור.',summer:'פריחה צבעונית עשירה.',
   sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:73,name:'ציפורן',type:'ornamental',bg:'ornamental',lbl:'פורח',e:'🌸',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[3,4,5,6,7,8,9,10,11],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'דשן פורחים – חודשי.',fm:[3,4,5,6,7,8],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – פורח כמעט כל השנה.',winter:'פורח.',summer:'פורח.',
   sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:74,name:'פורטולקה',type:'ornamental',bg:'ornamental',lbl:'כיסוי קרקע',e:'🌸',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'דשן פורחים – אפריל.',fm:[4],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – שנתי קיץ. מצוין לאזורים חמים.',winter:null,summer:'פריחה צבעונית. עמיד לחום.',
   sizes:{small:'שתיל',medium:'כיסוי קרקע',large:'שטח גדול'}},
  {id:75,name:'אגפנטוס',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'💜',floor:'נספחים',
   prune:'הסרת תפרחות יבשות',pm:[8,9],pi:'קל מאוד',pmth:'הסרת גבעולי פרח יבשים.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד. פורח יוני-יולי.',winter:'ירוק עד.',summer:'פריחה כחולה-סגולה.',
   sizes:{small:'שתיל',medium:'אשכול',large:'שטח גדול'}},
  {id:76,name:'גזניה',type:'ornamental',bg:'ornamental',lbl:'כיסוי קרקע',e:'🌼',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[3,4,5,6,7,8,9],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'דשן פורחים – חודשי.',fm:[3,4,5,6,7,8],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד לחום ולבצורת.',winter:'פורח.',summer:'פריחה צבעונית.',
   sizes:{small:'שתיל',medium:'כיסוי קרקע',large:'שטח גדול'}},
  {id:77,name:'בריגמיה',type:'ornamental',bg:'ornamental',lbl:'סוקולנט',e:'🌵',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'דשן קקטוסים – פעם בעונה.',fm:[3,9],supp:null,sm:[],
   rules:null,crit:'השקת יתר הורגת!',
   waterSummer:5,waterWinter:2,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – מצוין לגינה ולבית.',winter:'פעיל.',summer:'פעיל.',
   sizes:{small:'10-20 ס"מ',medium:'20-40 ס"מ',large:'40+ ס"מ'}},
  {id:78,name:'אלוורה',type:'ornamental',bg:'ornamental',lbl:'סוקולנט',e:'🌵',floor:'נספחים',
   prune:'הסרת עלים קמלים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים חיצוניים קמלים.',
   fert:'דשן קקטוסים – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:'השקת יתר הורגת!',
   waterSummer:6,waterWinter:2,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – מצוין לגינה ולבית. רפואי.',winter:'פעיל.',summer:'פעיל.',
   sizes:{small:'10-20 ס"מ',medium:'20-50 ס"מ',large:'50+ ס"מ'}},
  {id:79,name:'אגבה',type:'ornamental',bg:'ornamental',lbl:'סוקולנט',e:'🌵',floor:'קומה עליונה',
   prune:'הסרת עלים יבשים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים יבשים בכפפות.',
   fert:'לא דורש.',fm:[],supp:null,sm:[],rules:'זהירות מקוצים!',crit:null,
   waterSummer:4,waterWinter:1,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד. מצוין כגדר.',winter:'ירוק עד.',summer:'עמיד לחום.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:80,name:'קוקוס',type:'tropical',bg:'tropical',lbl:'דקל',e:'🥥',floor:'קומה עליונה',
   prune:'הסרת כפות יבשות',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל',pmth:'הסרת כפות יבשות בלבד.',
   fert:'NPK + מגנזיום – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:30,waterWinter:10,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף ים בלבד. לא עמיד לקור.',harvestMonths:[8,9,10,11,12],
   winter:'ירוק עד.',summer:'גדילה פעילה.',sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:81,name:'ג׳ינג׳ר',type:'tropical',bg:'tropical',lbl:'עשב תיבול',e:'🫚',floor:'נספחים',
   prune:'קציר השורש בחורף',pm:[11,12,1],pi:'קל',pmth:'חפור שורשים בחורף לאחר נבילת הצמח.',
   fert:'NPK – אפריל + יוני.',fm:[4,6],supp:null,sm:[],rules:'שתול ריזום מרץ.',crit:null,
   waterSummer:20,waterWinter:5,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה, מרכז. אוהב לחות.',harvestMonths:[11,12,1],
   winter:'תרדמה. קציר שורשים.',summer:'גדילה עלים.',sizes:{small:'שתיל',medium:'אשכול',large:'שטח גדול'}},
  {id:82,name:'כורכום',type:'tropical',bg:'tropical',lbl:'עשב תיבול',e:'🟡',floor:'נספחים',
   prune:'קציר בחורף',pm:[11,12,1],pi:'קל',pmth:'חפור ריזום בחורף.',
   fert:'NPK – אפריל.',fm:[4],supp:null,sm:[],rules:'שתול ריזום אפריל.',crit:null,
   waterSummer:20,waterWinter:5,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה. אוהב חום ולחות.',harvestMonths:[11,12],
   winter:'תרדמה.',summer:'גדילה.',sizes:{small:'שתיל',medium:'אשכול',large:'שטח גדול'}},
  {id:83,name:'למון גראס',type:'tropical',bg:'tropical',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קיצוץ לגובה 10 ס"מ – אחת לשנה',pm:[2,3],pi:'קל מאוד',pmth:'קיצוץ כל הצמח ל-10 ס"מ מהאדמה פברואר.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – עמיד לחום. גדל גם בעציץ.',winter:'ירוק עד.',summer:'גדילה מהירה.',
   sizes:{small:'שתיל',medium:'אשכול',large:'שטח גדול'}},
  {id:84,name:'סטביה',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קיצוץ לפני פריחה',pm:[7,8],pi:'קל',pmth:'קיצוץ חצי הצמח לפני פריחה.',
   fert:'דשן כללי – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – ממתיק טבעי. גם בעציץ.',winter:'ירוק עד.',summer:'גדילה פעילה.',
   sizes:{small:'שתיל',medium:'שיח 40 ס"מ',large:'שיח 80 ס"מ'}},
  {id:85,name:'אורגנו',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'לאחר פריחה',pm:[6,7],pi:'קל מאוד',pmth:'קיצוץ שליש.',
   fert:'דשן כללי – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – ים תיכוני מובהק.',winter:'ירוק עד.',summer:'פריחה.',
   sizes:{small:'20-30 ס"מ',medium:'30-50 ס"מ',large:'50+ ס"מ'}},
  {id:86,name:'טימין',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'לאחר פריחה',pm:[5,6],pi:'קל מאוד',pmth:'קיצוץ קל.',
   fert:'דשן כללי – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:5,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – עמיד מאוד.',winter:'ירוק עד.',summer:'פריחה ורודה.',
   sizes:{small:'10-20 ס"מ',medium:'20-40 ס"מ',large:'40+ ס"מ'}},
  {id:87,name:'פטרוזיליה',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים חיצוניים.',
   fert:'דשן חנקן – חודשי.',fm:[1,2,3,4,5,6,7,8,9,10,11,12],supp:null,sm:[],rules:null,crit:'לאחר הזרעה — יגווע!',
   waterSummer:15,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – גדל כל השנה.',winter:'פעיל.',summer:'פעיל.',
   sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:88,name:'שמיר',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים.',
   fert:'דשן כללי – חודשי.',fm:[1,2,3,4,5,6,7,8,9,10,11,12],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ.',winter:'פעיל.',summer:'פעיל.',sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:89,name:'כוסברה',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים.',
   fert:'דשן כללי – חודשי.',fm:[1,2,3,4,5,6,7,8,9,10,11,12],supp:null,sm:[],rules:null,crit:'מזריע מהר בחום!',
   waterSummer:12,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – גדל בחורף ואביב.',winter:'פעיל.',summer:'מזריע ומת בחום.',
   sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:90,name:'עירית',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים בגזרה.',
   fert:'דשן חנקן – חודשי.',fm:[1,2,3,4,5,6,7,8,9,10,11,12],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ.',winter:'פעיל.',summer:'פעיל.',sizes:{small:'שתיל',medium:'אשכול',large:'שטח גדול'}},
  {id:91,name:'ליים',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍋',floor:'קומה עליונה',
   prune:'מרץ',pm:[3],pi:'קל',pmth:'עיצוב, הסרת ענפים מתים.',
   fert:'דשן הדרים – אפריל + אוגוסט.',fm:[4,8],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה. לא עמיד לקור.',harvestMonths:[1,2,3,4,5,6,7,8,9,10,11,12],
   winter:'ירוק עד.',summer:'פירות לאורך השנה.',sizes:{small:'0.5-1 מ׳',medium:'1-3 מ׳',large:'3+ מ׳'}},
  {id:92,name:'קומקוואט',type:'fruit',bg:'citrus',lbl:'פרי הדר',e:'🍊',floor:'קומה תחתונה',
   prune:'מרץ',pm:[3],pi:'קל מאוד',pmth:'עיצוב קל.',
   fert:'דשן הדרים – אפריל + אוגוסט.',fm:[4,8],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – עמיד יחסית לקור. מצוין לעציץ.',harvestMonths:[11,12,1,2],
   winter:'ירוק עד. פירות.',summer:'פריחה.',sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:93,name:'פפינו',type:'tropical',bg:'tropical',lbl:'טרופי',e:'🍈',floor:'קומה תחתונה',
   prune:'קיצוץ לאחר קטיף',pm:[7,8],pi:'קל',pmth:'קיצוץ ענפים ישנים.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה. אזורים חמים.',harvestMonths:[5,6,7,8],
   winter:'ירוק עד.',summer:'פרי צהוב-סגול.',sizes:{small:'שתיל',medium:'שיח 1 מ׳',large:'שיח 2 מ׳'}},
  {id:94,name:'לוקומה',type:'tropical',bg:'tropical',lbl:'טרופי',e:'🟤',floor:'קומה עליונה',
   prune:'לאחר הקטיף',pm:[8,9],pi:'קל מאוד',pmth:'דילול קל.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:20,waterWinter:6,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה. אזורים חמים.',harvestMonths:[7,8,9],
   winter:'ירוק עד.',summer:'פרי חום מתוק.',sizes:{small:'1-2 מ׳',medium:'2-5 מ׳',large:'5+ מ׳'}},
  {id:95,name:'ג׳קפרוט',type:'tropical',bg:'tropical',lbl:'טרופי',e:'🟡',floor:'קומה עליונה',
   prune:'לאחר הקטיף',pm:[7,8],pi:'קל מאוד',pmth:'הסרת ענפים מתים.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:30,waterWinter:12,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'אזורים חמים מאוד. עמק הירדן, ערבה.',harvestMonths:[6,7,8],
   winter:'ירוק עד.',summer:'פרי ענק.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:96,name:'ארמורסיה',type:'bush',bg:'bush',lbl:'ירק שורש',e:'🌿',floor:'נספחים',
   prune:'קציר שורש בחורף',pm:[11,12,1],pi:'קל',pmth:'חפור שורשים בחורף.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:'פולשנית מאוד – שתול בעציץ.',crit:null,
   waterSummer:20,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – גדל בכל מקום.',winter:'תרדמה. קציר.',summer:'עלים גדולים.',
   sizes:{small:'שתיל',medium:'שיח',large:'שטח גדול'}},
  {id:97,name:'לבנה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌿',floor:'קומה תחתונה',
   prune:'לאחר פריחה',pm:[5,6],pi:'קל מאוד',pmth:'גיזום עיצובי.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:4,waterType:'עמוקה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני מקומי. עמיד מאוד.',winter:'ירוק עד.',summer:'עמיד לחום.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:98,name:'כליסטמון',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🔴',floor:'קומה תחתונה',
   prune:'לאחר פריחה',pm:[8,9],pi:'קל',pmth:'קיצוץ עיצובי לאחר פריחה.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:4,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – פורח אדום. עמיד מאוד.',winter:'ירוק עד.',summer:'פריחה אדומה מרהיבה.',
   sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:99,name:'פלומריה',type:'ornamental',bg:'ornamental',lbl:'עץ טרופי',e:'🌸',floor:'קומה עליונה',
   prune:'פברואר',pm:[2],pi:'קל מאוד',pmth:'עיצוב קל.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:15,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה. לא להר.',winter:'נושר.',summer:'פריחה ריחנית.',
   sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:100,name:'ג׳קרנדה',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'💜',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[7,8],pi:'קל',pmth:'קיצוץ עיצובי.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:'רגיש לכפור!',
   waterSummer:20,waterWinter:6,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'חוף, שפלה, מרכז. פורח סגול מרהיב.',winter:'נושר חלקי.',summer:'פריחה סגולה.',
   sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:101,name:'מיקוניה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'קומה תחתונה',
   prune:'לאחר פריחה',pm:[9,10],pi:'קל מאוד',pmth:'גיזום עיצובי.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה. לא עמיד לקור.',winter:'ירוק עד.',summer:'פריחה ורודה.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:102,name:'לנטנה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'נספחים',
   prune:'פברואר – גיזום חמור',pm:[2],pi:'קל',pmth:'גיזום חמור לעידוד צמיחה.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – פורח כל הקיץ. עמיד לחום.',winter:'נושר חלקי.',summer:'פריחה צבעונית עשירה.',
   sizes:{small:'שתיל',medium:'שיח 1 מ׳',large:'שיח 2+ מ׳'}},
  {id:103,name:'אולינדר / נרייה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[9,10],pi:'קל',pmth:'קיצוץ חמור לאחר פריחה.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:'רעיל מאוד! לא לאכול.',
   waterSummer:10,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד.',winter:'ירוק עד.',summer:'פריחה ורודה/לבנה.',
   sizes:{small:'שתיל',medium:'שיח 2 מ׳',large:'שיח 4+ מ׳'}},
  {id:104,name:'אגוז',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🥜',floor:'קומה תחתונה',
   prune:'פברואר',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים, דילול.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, כרמל. דורש צינה.',harvestMonths:[9,10],
   winter:'עץ ערום.',summer:'אגוזים מתפתחים.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:105,name:'ערמון',type:'fruit',bg:'fruit',lbl:'פרי נשיר',e:'🌰',floor:'קומה תחתונה',
   prune:'פברואר',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:25,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר גבוה, גולן, הרמון.',harvestMonths:[10,11],
   winter:'עץ ערום.',summer:'קוצנים ירוקים.',sizes:{small:'1-3 מ׳',medium:'3-8 מ׳',large:'8+ מ׳'}},
  {id:106,name:'לוטוס',type:'ornamental',bg:'ornamental',lbl:'צמח מים',e:'🪷',floor:'נספחים',
   prune:'הסרת עלים ופרחים קמלים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים ופרחים קמלים.',
   fert:'דשן מים – מרץ.',fm:[3],supp:null,sm:[],rules:'גדל במים עומדים.',crit:'חייב מים עומדים!',
   waterSummer:null,waterWinter:null,waterType:'מים עומדים',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – בבריכה או אגן מים.',winter:'תרדמה.',summer:'פריחה ורודה מרהיבה.',
   sizes:{small:'בקוביית מים',medium:'בריכה קטנה',large:'בריכה גדולה'}},
  {id:107,name:'פפירוס',type:'ornamental',bg:'ornamental',lbl:'צמח מים',e:'🌾',floor:'קומה עליונה',
   prune:'הסרת גבעולים יבשים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת גבעולים יבשים.',
   fert:'דשן מים – מרץ.',fm:[3],supp:null,sm:[],rules:'גדל בקרבת מים.',crit:null,
   waterSummer:null,waterWinter:null,waterType:'מים עומדים',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – בבריכה או בעציץ רטוב.',winter:'פעיל.',summer:'גדילה מהירה.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:108,name:'במבוק',type:'ornamental',bg:'ornamental',lbl:'דקלון',e:'🎋',floor:'קומה עליונה',
   prune:'הסרת גבעולים ישנים',pm:[2,3],pi:'קל',pmth:'הסרת גבעולים ישנים וחלשים.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'פולשני מאוד – שתול עם מחסום!',crit:'מתפשט בקרקע – מחסום חובה!',
   waterSummer:25,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדל מהר. מצוין כגדר.',winter:'ירוק עד.',summer:'גדילה מהירה מאוד.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:109,name:'פאלם ארקה',type:'ornamental',bg:'ornamental',lbl:'דקל נוי',e:'🌴',floor:'קומה עליונה',
   prune:'הסרת כפות יבשות',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל',pmth:'הסרת כפות יבשות.',
   fert:'דשן דקלים – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לשרב'],indoor:true,
   geo:'חוף, שפלה, מרכז. גם בתוך הבית.',winter:'ירוק עד.',summer:'גדילה פעילה.',
   sizes:{small:'0.5-1 מ׳',medium:'1-3 מ׳',large:'3+ מ׳'}},
  {id:110,name:'קורדילינה',type:'ornamental',bg:'ornamental',lbl:'נוי צבעוני',e:'🌿',floor:'קומה תחתונה',
   prune:'הסרת עלים יבשים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן כללי – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'חצי שמש',lightAlt:'שמש מלאה',climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ – מצוין לגינה ולבית.',winter:'ירוק עד.',summer:'עלים אדומים/סגולים.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:111,name:'יוקה',type:'ornamental',bg:'ornamental',lbl:'נוי מדברי',e:'🌵',floor:'קומה עליונה',
   prune:'הסרת עלים יבשים',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן קקטוסים – פעם בעונה.',fm:[3,9],supp:null,sm:[],rules:'זהירות מקוצים!',crit:null,
   waterSummer:5,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד לחום ולבצורת.',winter:'ירוק עד.',summer:'עמיד לחום.',
   sizes:{small:'0.5-1 מ׳',medium:'1-3 מ׳',large:'3+ מ׳'}},
  {id:112,name:'פייקוס לירטה',type:'ornamental',bg:'ornamental',lbl:'נוי ירוק',e:'🌿',floor:'קומה תחתונה',
   prune:'עיצוב קל',pm:[4,5],pi:'קל מאוד',pmth:'עיצוב קל.',
   fert:'דשן כללי – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:'לא להזיז!',crit:'שינוי מיקום = נשירת עלים!',
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'חצי שמש',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'בית ומשרד.',winter:'ירוק עד.',summer:'גדילה.',sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2-3 מ׳'}},
  {id:113,name:'שפיפון',type:'ornamental',bg:'ornamental',lbl:'כיסוי קרקע',e:'🌿',floor:'נספחים',
   prune:'גיזום עיצובי',pm:[3,4],pi:'קל מאוד',pmth:'גיזום לגובה הרצוי.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:4,waterType:'רדודה',light:'חצי שמש',lightAlt:'צל',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לכיסוי קרקע בצל.',winter:'ירוק עד.',summer:'ירוק עד.',
   sizes:{small:'שתיל',medium:'כיסוי קרקע',large:'שטח גדול'}},
  {id:114,name:'פיטוספורום',type:'ornamental',bg:'ornamental',lbl:'שיח גדר',e:'🌿',floor:'קומה תחתונה',
   prune:'גיזום עיצובי',pm:[3,4,9,10],pi:'קל',pmth:'גיזום לצורת הגדר הרצויה.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – מצוין לגדרות. עמיד מאוד.',winter:'ירוק עד.',summer:'עמיד לחום.',
   sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:115,name:'ליגוסטרום',type:'ornamental',bg:'ornamental',lbl:'שיח גדר',e:'🌿',floor:'קומה תחתונה',
   prune:'גיזום תכוף לצורה',pm:[3,4,5,6,7,8,9],pi:'קל',pmth:'גיזום לצורה הרצויה.',
   fert:'NPK – פברואר + יוני.',fm:[2,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – גדר מצוינת. גדל מהר.',winter:'ירוק עד.',summer:'גדילה מהירה.',
   sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:116,name:'דוקן',type:'ornamental',bg:'ornamental',lbl:'ירוק עד',e:'🌳',floor:'קומה תחתונה',
   prune:'לא לגזום',pm:[],pi:null,pmth:null,fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:2,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני מקומי. עמיד מאוד.',winter:'ירוק עד.',summer:'עמיד.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:117,name:'קורן',type:'ornamental',bg:'ornamental',lbl:'עץ נוי',e:'🍂',floor:'קומה תחתונה',
   prune:'פברואר (עץ ערום)',pm:[2],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:6,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ.',winter:'עץ ערום.',summer:'ירוק. פירות אדומים.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:118,name:'טרחלה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'נספחים',
   prune:'לאחר פריחה',pm:[6,7],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ.',winter:'ירוק עד.',summer:'פריחה.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:119,name:'ספיריאה',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🌸',floor:'נספחים',
   prune:'לאחר פריחה',pm:[4,5],pi:'קל',pmth:'גיזום עיצובי.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – פורח לבן/ורוד.',winter:'נושר.',summer:'ירוק.',sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:120,name:'פורסיתיה',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🌼',floor:'נספחים',
   prune:'לאחר פריחה',pm:[3,4],pi:'קל',pmth:'גיזום עיצובי.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, מרכז. דורש קצת קור.',winter:'פריחה צהובה לפני העלים.',summer:'ירוק.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:121,name:'מגנוליה',type:'ornamental',bg:'ornamental',lbl:'עץ פורח',e:'🌸',floor:'קומה עליונה',
   prune:'לאחר פריחה',pm:[4,5],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK + חומציים – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'עמוקה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'הר, גליל, מרכז.',winter:'נושר. פריחה לפני העלים.',summer:'ירוק עם פרחים.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:122,name:'דפנה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌿',floor:'קומה תחתונה',
   prune:'גיזום עיצובי',pm:[3,4],pi:'קל מאוד',pmth:'גיזום עיצובי קל.',
   fert:'NPK – פברואר.',fm:[2],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'עמוקה',light:'חצי שמש',lightAlt:'צל',climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני מקומי.',winter:'ירוק עד.',summer:'עמיד.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:123,name:'גרניום',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🌸',floor:'נספחים',
   prune:'פברואר – גיזום חמור',pm:[2],pi:'קל',pmth:'גיזום חמור ל-10 ס"מ מהאדמה.',
   fert:'דשן פורחים – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – עמיד מאוד. פורח כמעט כל השנה.',winter:'פורח.',summer:'פורח.',
   sizes:{small:'שתיל',medium:'שיח',large:'שיח גדול'}},
  {id:124,name:'אמריליס',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌺',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[3,4,5],pi:'קל מאוד',pmth:'הסרת גבעול פרח קמל.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ. מצוין לעציץ.',winter:'פריחה אדומה/לבנה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'עציץ',large:'שטח'}},
  {id:125,name:'היביסקוס',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'🌺',floor:'קומה תחתונה',
   prune:'פברואר – גיזום חמור',pm:[2],pi:'קל',pmth:'גיזום חמור.',
   fert:'NPK + אשלגן – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – פורח כל הקיץ.',winter:'נושר.',summer:'פרחים גדולים צבעוניים.',
   sizes:{small:'0.5-1 מ׳',medium:'1-3 מ׳',large:'3+ מ׳'}},
  {id:126,name:'גרוויליאה',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'קומה תחתונה',
   prune:'לאחר פריחה',pm:[8,9],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:4,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד.',winter:'ירוק עד.',summer:'פריחה כתומה-אדומה.',
   sizes:{small:'1-2 מ׳',medium:'2-4 מ׳',large:'4+ מ׳'}},
  {id:127,name:'אשל',type:'ornamental',bg:'ornamental',lbl:'עץ מדברי',e:'🌳',floor:'קומה עליונה',
   prune:'לא לגזום',pm:[],pi:null,pmth:null,fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:5,waterWinter:1,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'נגב, ערבה, מדבר יהודה. עמיד מאוד לבצורת.',winter:'ירוק-אפור.',summer:'עמיד לחום.',
   sizes:{small:'1-3 מ׳',medium:'3-6 מ׳',large:'6+ מ׳'}},
  {id:128,name:'חמנייה',type:'ornamental',bg:'ornamental',lbl:'חד-שנתי',e:'🌻',floor:'נספחים',
   prune:'הסרת ראשי פרח קמלים',pm:[6,7,8,9],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'NPK – שתילה + חודש.',fm:[4,5],supp:null,sm:[],rules:null,crit:null,
   waterSummer:20,waterWinter:null,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – שנתי קיץ.',winter:null,summer:'פריחה צהובה מרהיבה.',
   sizes:{small:'שתיל',medium:'50 ס"מ',large:'1-3 מ׳'}},
  {id:129,name:'כלנית',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌺',floor:'נספחים',
   prune:'לאחר נבילה',pm:[3,4],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול בצלים ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – פרח ישראלי קלאסי.',winter:'פריחה אדומה/סגולה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח גדול'}},
  {id:130,name:'חלמית',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌸',floor:'נספחים',
   prune:'לאחר נבילה',pm:[4,5],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול בצלים ספטמבר.',crit:null,
   waterSummer:null,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – פרח ישראלי. פורח פברואר-מרץ.',winter:'פריחה ורודה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח גדול'}},
  {id:131,name:'ורד ים',type:'ornamental',bg:'ornamental',lbl:'שיח',e:'🌸',floor:'נספחים',
   prune:'לאחר פריחה',pm:[7,8],pi:'קל מאוד',pmth:'גיזום קל.',
   fert:'NPK – מרץ.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – ים תיכוני מקומי.',winter:'ירוק עד.',summer:'פריחה ורודה.',
   sizes:{small:'0.5-1 מ׳',medium:'1-2 מ׳',large:'2+ מ׳'}},
  {id:132,name:'מלוח',type:'ornamental',bg:'ornamental',lbl:'כיסוי קרקע',e:'🌿',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'לא דורש.',fm:[],supp:null,sm:[],rules:null,crit:null,
   waterSummer:3,waterWinter:1,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:false,
   geo:'כל הארץ – עמיד מאוד לבצורת ולמלח.',winter:'ירוק.',summer:'עמיד לחום.',
   sizes:{small:'שתיל',medium:'כיסוי קרקע',large:'שטח גדול'}},
  {id:133,name:'דגניה',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌼',floor:'נספחים',
   prune:'לאחר נבילה',pm:[4,5],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:8,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ.',winter:'פריחה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'אשכול',large:'שטח'}},
  {id:134,name:'גלדיולה',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌸',floor:'נספחים',
   prune:'לאחר נבילה',pm:[6,7,8],pi:'קל',pmth:'הסרת גבעולים יבשים.',
   fert:'דשן בצלים – שתילה.',fm:[2,3],supp:null,sm:[],rules:'שתול מרץ-אפריל.',crit:null,
   waterSummer:15,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ.',winter:'תרדמה.',summer:'פריחה צבעונית.',
   sizes:{small:'שתיל',medium:'אשכול',large:'שטח'}},
  {id:135,name:'דהליה',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌸',floor:'נספחים',
   prune:'גיזום לאחר פריחה',pm:[9,10],pi:'קל',pmth:'הסרת פרחים קמלים.',
   fert:'דשן פורחים – כל שבועיים.',fm:[4,5,6,7,8,9],supp:null,sm:[],rules:'שתול שורשים אפריל.',crit:null,
   waterSummer:20,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ.',winter:'תרדמה.',summer:'פריחה צבעונית.',
   sizes:{small:'שתיל',medium:'שיח',large:'שיח גדול'}},
  {id:136,name:'ציניה',type:'ornamental',bg:'ornamental',lbl:'חד-שנתי',e:'🌸',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[5,6,7,8,9,10],pi:'קל מאוד',pmth:'הסרת פרחים קמלים.',
   fert:'דשן פורחים – חודשי.',fm:[5,6,7,8,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:12,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – קיצי.',winter:null,summer:'פריחה צבעונית.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:137,name:'סלוויה',type:'ornamental',bg:'ornamental',lbl:'שיח פורח',e:'💜',floor:'נספחים',
   prune:'לאחר פריחה',pm:[5,6,9,10],pi:'קל',pmth:'קיצוץ שליש.',
   fert:'NPK – מרץ + יוני.',fm:[3,6],supp:null,sm:[],rules:null,crit:null,
   waterSummer:8,waterWinter:3,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ – פורח כחול-סגול.',winter:'ירוק עד.',summer:'פריחה.',
   sizes:{small:'שתיל',medium:'שיח',large:'שיח גדול'}},
  {id:138,name:'כוסמת',type:'ornamental',bg:'ornamental',lbl:'חד-שנתי',e:'🌸',floor:'נספחים',
   prune:'הסרת פרחים קמלים',pm:[11,12,1,2,3,4],pi:'קל מאוד',pmth:'הסרת פרחים.',
   fert:'דשן פורחים – חודשי.',fm:[11,12,1,2,3,4],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – חורפי.',winter:'פריחה צבעונית.',summer:'תמות.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:139,name:'אנמון',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'🌺',floor:'נספחים',
   prune:'לאחר נבילה',pm:[3,4],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול ספטמבר-נובמבר.',crit:null,
   waterSummer:null,waterWinter:10,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ.',winter:'פריחה ורודה/סגולה.',summer:'תרדמה.',
   sizes:{small:'שתיל',medium:'כמה בצלים',large:'שטח'}},
  {id:140,name:'מוסקרי',type:'ornamental',bg:'ornamental',lbl:'בצלי',e:'💜',floor:'נספחים',
   prune:'לאחר נבילה',pm:[3,4],pi:'קל מאוד',pmth:'הסרת עלים יבשים.',
   fert:'דשן בצלים – ספטמבר.',fm:[9],supp:null,sm:[],rules:'שתול ספטמבר.',crit:null,
   waterSummer:null,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ.',winter:'פריחה כחולה.',summer:'תרדמה.',sizes:{small:'שתיל',medium:'אשכול',large:'שטח'}},
  {id:141,name:'צ׳יה',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌱',floor:'נספחים',
   prune:'קטיף זרעים',pm:[6,7],pi:'קל מאוד',pmth:'קטיף תפרחות לזרעים.',
   fert:'NPK – שתילה.',fm:[3],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:6,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:true,
   geo:'כל הארץ.',winter:'פעיל.',summer:'פעיל.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:142,name:'ספנות',type:'bush',bg:'bush',lbl:'עשב תיבול',e:'🌿',floor:'נספחים',
   prune:'קטיף תכוף',pm:[1,2,3,4,5,6,7,8,9,10,11,12],pi:'קל מאוד',pmth:'קטיף עלים.',
   fert:'דשן כללי – חודשי.',fm:[3,4,5,6,7,8,9],supp:null,sm:[],rules:null,crit:null,
   waterSummer:10,waterWinter:5,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור','עמיד לשרב'],indoor:true,
   geo:'כל הארץ.',winter:'פעיל.',summer:'פעיל.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:143,name:'תרד',type:'bush',bg:'bush',lbl:'ירק עלים',e:'🥬',floor:'נספחים',
   prune:'קטיף עלים',pm:[10,11,12,1,2,3,4],pi:'קל מאוד',pmth:'קטיף עלים חיצוניים.',
   fert:'דשן חנקן – שתילה + חודש.',fm:[10,11,12,1,2,3,4],supp:null,sm:[],rules:'שתול ספטמבר-נובמבר.',crit:'נובל בחום!',
   waterSummer:null,waterWinter:12,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – חורפי.',winter:'פעיל. קטיף.',summer:'מת מהחום.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:144,name:'חסה',type:'bush',bg:'bush',lbl:'ירק עלים',e:'🥬',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'דשן חנקן – כל שבועיים.',fm:[10,11,12,1,2,3,4],supp:null,sm:[],rules:null,crit:'נובל בחום!',
   waterSummer:null,waterWinter:12,waterType:'רדודה',light:'שמש מלאה',lightAlt:'חצי שמש',climate:['עמיד לקור'],indoor:true,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת מהחום.',sizes:{small:'שתיל',medium:'ראש חסה',large:'שטח'}},
  {id:145,name:'גזר',type:'bush',bg:'bush',lbl:'ירק שורש',e:'🥕',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK דל חנקן – שתילה.',fm:[9,10,11],supp:null,sm:[],rules:'שתול ישר מזרע.',crit:null,
   waterSummer:null,waterWinter:12,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת.',sizes:{small:'מיכל אחד',medium:'ערוגה',large:'שטח גדול'}},
  {id:146,name:'סלק',type:'bush',bg:'bush',lbl:'ירק שורש',e:'🟣',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK – שתילה.',fm:[9,10,11],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:12,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת.',sizes:{small:'מיכל',medium:'ערוגה',large:'שטח'}},
  {id:147,name:'ברוקולי',type:'bush',bg:'bush',lbl:'ירק',e:'🥦',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK – שתילה + חודש.',fm:[9,10],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:15,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת.',sizes:{small:'שתיל',medium:'ראש',large:'שטח'}},
  {id:148,name:'כרובית',type:'bush',bg:'bush',lbl:'ירק',e:'⚪',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK – שתילה + חודש.',fm:[9,10],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:15,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת.',sizes:{small:'שתיל',medium:'ראש',large:'שטח'}},
  {id:149,name:'שעועית',type:'bush',bg:'bush',lbl:'קטניה',e:'🫘',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK דל חנקן – שתילה.',fm:[3,4],supp:null,sm:[],rules:null,crit:null,
   waterSummer:15,waterWinter:null,waterType:'רדודה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לשרב'],indoor:false,
   geo:'כל הארץ – קיצי.',winter:null,summer:'קטיף.',sizes:{small:'שתיל',medium:'שיח',large:'שטח'}},
  {id:150,name:'כרישה',type:'bush',bg:'bush',lbl:'ירק שורש',e:'🌿',floor:'נספחים',
   prune:null,pm:[],pi:null,pmth:null,fert:'NPK – שתילה.',fm:[9,10],supp:null,sm:[],rules:null,crit:null,
   waterSummer:null,waterWinter:12,waterType:'עמוקה',light:'שמש מלאה',lightAlt:null,climate:['עמיד לקור'],indoor:false,
   geo:'כל הארץ – חורפי.',winter:'קטיף.',summer:'מת.',sizes:{small:'שתיל',medium:'אשכול',large:'שטח'}}

];

const CATALOG_ALL = P.map(p=>({...p})); // snapshot of full catalog


function tryLoadImg(id, size, onSuccess, onFail){
  const k = `${id}_${size}`;
  const p = P.find(x=>x.id===id);
  if(!p) { if(onFail) onFail(); return; }
  
  // Already cached
  if(imgCache[`${p.name}__${size}`] !== undefined) {
    const url = imgCache[`${p.name}__${size}`];
    if(url) { if(onSuccess) onSuccess(url); } else { if(onFail) onFail(); }
    return;
  }
  
  // Fetch from Wikimedia
  fetchWikiImg(p.name, size).then(url => {
    if(url) { if(onSuccess) onSuccess(url); }
    else { if(onFail) onFail(); }
  }).catch(()=>{ if(onFail) onFail(); });
}

// ===================================================
// MAIN APP LOGIC
// ===================================================
const NOW=new Date();let CUR=NOW.getMonth()+1;let TF='all';let AP=null;
let SHOW_FLOORS = true;

function toggleFloors(){
  SHOW_FLOORS = !SHOW_FLOORS;
  document.getElementById('floor-toggle-txt').textContent = SHOW_FLOORS ? 'בטל חלוקת קומות' : 'הצג לפי קומות';
  document.getElementById('floor-toggle').classList.toggle('on', !SHOW_FLOORS);
  render();
}

function hasT(p,m){return p.pm.includes(m)||p.fm.includes(m)||p.sm.includes(m);}

function init(){
  document.getElementById('monthPill').textContent=`📅 ${MHE[CUR-1]} ${NOW.getFullYear()}`;
  document.getElementById('msel').value=0;
  updCounts();renderAlerts();render();
}

function updCounts(){
  const m=parseInt(document.getElementById('msel').value)||CUR;
  document.getElementById('c-all').textContent=P.length;
  ['fruit','ornamental','tropical','bush','lawn'].forEach(t=>{
    const cnt=P.filter(p=>p.type===t).length;
    document.getElementById('c-'+t).textContent=cnt;
    // update sidebar badge
    const badge=document.getElementById('sb-'+t);
    if(badge){badge.textContent=cnt;badge.style.display=cnt?'inline-flex':'none';}
  });
  const allBadge=document.getElementById('sb-all');
  if(allBadge){allBadge.textContent=P.length;allBadge.style.display=P.length?'inline-flex':'none';}
  const alertCnt=P.filter(p=>hasT(p,m)).length;
  document.getElementById('c-alerts').textContent=alertCnt;
  const alertBadge=document.getElementById('sb-alerts');
  if(alertBadge){alertBadge.textContent=alertCnt;alertBadge.style.display=alertCnt?'inline-flex':'none';}
  document.getElementById('nb').textContent=P.filter(p=>hasT(p,CUR)).length;
}

function renderAlerts(){
  const m=CUR;let h='';
  const pr=P.filter(p=>p.pm.includes(m));
  const fe=P.filter(p=>p.fm.includes(m));
  const su=P.filter(p=>p.sm.includes(m));
  if(pr.length) h+=`<span class="chip prune">✂️ גיזום: ${pr.map(x=>x.name).join(', ')}</span>`;
  if(fe.length) h+=`<span class="chip fert">🌱 דישון: ${fe.map(x=>x.name).join(', ')}</span>`;
  if(su.length) h+=`<span class="chip supp">💧 תוספים: ${su.map(x=>x.name).join(', ')}</span>`;
  if(!h) h='<span class="no-tasks">אין טיפולים מיוחדים החודש 😊</span>';
  document.getElementById('alertsBar').innerHTML=h;
}

function setT(t,btn){TF=t;document.querySelectorAll('.flt').forEach(b=>b.classList.remove('on'));if(btn)btn.classList.add('on');render();}
function onMC(){updCounts();renderAlerts();render();}

function getFilt(){
  const s=document.getElementById('srch').value.trim().toLowerCase();
  const m=parseInt(document.getElementById('msel').value)||0;
  return P.filter(p=>{
    if(s&&!p.name.includes(s)&&!p.lbl.includes(s)) return false;
    if(TF==='alerts'&&!hasT(p,CUR)) return false;
    if(TF!=='all'&&TF!=='alerts'&&p.type!==TF) return false;
    if(m&&!hasT(p,m)) return false;
    return true;
  });
}

function render(){
  const area=document.getElementById('pa');
  if(TF==='alerts'){renderChecklist(area);return;}
  const filt=getFilt();
  if(!filt.length){area.innerHTML='<div class="empty"><div style="font-size:4rem">🌵</div><strong>לא נמצאו צמחים</strong></div>';return;}
  let h='';
  if(SHOW_FLOORS){
    const floors={};const ord=['קומה עליונה','קומה תחתונה','נספחים'];
    filt.forEach(p=>{if(!floors[p.floor])floors[p.floor]=[];floors[p.floor].push(p);});
    ord.forEach(fl=>{
      if(!floors[fl]) return;
      h+=`<div class="floor-hdr">🌿 ${fl}</div><div class="grid">`;
      floors[fl].forEach(p=>{h+=rCard(p);});
      h+='</div>';
    });
  } else {
    h='<div class="grid">';
    filt.forEach(p=>{h+=rCard(p);});
    h+='</div>';
  }
  area.innerHTML=h;
  area.querySelectorAll('.card').forEach((c,i)=>{c.style.animationDelay=i*25+'ms';c.classList.add('fadein');});
  filt.forEach(p=>{loadCardImg(p.id,'medium');});
}

// Checklist state: key = `${plantId}_${taskType}_${month}`
const CL_DONE = {};
function clKey(pid,type){return `${pid}_${type}_${CUR}`;}

async function dbSaveCareLog(key, val) {
  // גיבוי מקומי בדפדפן
  if (val) {
    localStorage.setItem(`care_${key}`, 'true');
  } else {
    localStorage.removeItem(`care_${key}`);
  }

  // סנכרון מול Supabase
  if (!_db || !currentUser) return;
  try {
    if (val) {
      await _db.from('care_log').upsert({key, user_id: currentUser.id, done: true}, {onConflict:'key,user_id'});
    } else {
      await _db.from('care_log').delete().eq('key', key).eq('user_id', currentUser.id);
    }
  } catch (e) {
    console.error("Supabase Error:", e);
  }
}

async function dbLoadCareLog() {
  // טעינה מהירה מהזיכרון המקומי
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('care_')) {
      CL_DONE[k.replace('care_', '')] = true;
    }
  }

  // משיכה מהענן
  if (!_db || !currentUser) return;
  try {
    const { data, error } = await _db.from('care_log').select('key').eq('user_id', currentUser.id);
    if (!error && data) { 
      data.forEach(r => { 
        CL_DONE[r.key] = true; 
        localStorage.setItem(`care_${r.key}`, 'true'); 
      }); 
    }
  } catch (e) {
    console.error("Load Error:", e);
  }
}

function clToggle(pid,type){
  const k=clKey(pid,type);
  CL_DONE[k]=!CL_DONE[k];
  dbSaveCareLog(k, CL_DONE[k]);
 renderChecklist(document.getElementById('pa'));
  updCounts();
}

function clReset(){
  const keysToDelete = Object.keys(CL_DONE).filter(k=>k.endsWith('_'+CUR));
  keysToDelete.forEach(k=>{delete CL_DONE[k]; dbSaveCareLog(k, false);});
  renderChecklist(document.getElementById('pa'));
}

function renderChecklist(area){
  const m=CUR;
  // Collect all tasks for this month
  const tasks=[];
  P.forEach(p=>{
    if(p.pm.includes(m)) tasks.push({p,type:'prune',icon:'✂️',label:'גיזום',cls:'p',desc:p.pmth||p.prune||''});
    if(p.fm.includes(m)) tasks.push({p,type:'fert', icon:'🌱',label:'דישון',cls:'f',desc:p.fert||''});
    if(p.sm.includes(m)) tasks.push({p,type:'supp', icon:'💧',label:'תוסף', cls:'s',desc:p.supp||''});
    if(p.crit&&(p.pm.includes(m)||p.fm.includes(m)||p.sm.includes(m)))
      tasks.push({p,type:'crit',icon:'⚠️',label:'קריטי',cls:'u',desc:p.crit});
  });
  if(!tasks.length){area.innerHTML='<div class="empty"><div style="font-size:4rem">🎉</div><strong>אין טיפולים החודש!</strong></div>';return;}
  
  const total=tasks.length;
  const done=tasks.filter(t=>CL_DONE[clKey(t.p.id,t.type)]).length;
  const pct=total?Math.round(done/total*100):0;

  // Group by plant
  const byPlant={};
  tasks.forEach(t=>{
    if(!byPlant[t.p.id]) byPlant[t.p.id]={p:t.p,tasks:[]};
    byPlant[t.p.id].tasks.push(t);
  });

  let h=`<div class="cl-progress-box">
    <div class="cl-prog-row">
      <span class="cl-prog-title">✅ טיפולי ${MHE[m-1]}</span>
      <span class="cl-prog-count">${done} / ${total} בוצעו</span>
    </div>
    <div class="cl-bar-bg"><div class="cl-bar-fill" style="width:${pct}%"></div></div>
    ${done>0?`<span class="cl-reset-btn" onclick="clReset()">↺ אפס הכל</span>`:''}
  </div><div class="cl-wrap">`;

  Object.values(byPlant).forEach(({p,tasks})=>{
    h+=`<div class="cl-section-hdr">${p.e} ${p.name}</div>`;
    tasks.forEach(t=>{
      const k=clKey(p.id,t.type);
      const isDone=!!CL_DONE[k];
      h+=`<div class="cl-item ${isDone?'done':''}" onclick="clToggle(${p.id},'${t.type}')">
        <div class="cl-check">${isDone?'✓':''}</div>
        <div class="cl-emoji">${t.icon}</div>
        <div class="cl-body">
          <div class="cl-name">${t.label}</div>
          <div class="cl-desc">${t.desc.substring(0,120)}</div>
          <div class="cl-badges"><span class="cl-badge ${t.cls}">${t.label}</span></div>
        </div>
      </div>`;
    });
  });
  h+='</div>';
  area.innerHTML=h;
}

function rCard(p){
  const m=parseInt(document.getElementById('msel').value)||CUR;
  const al=hasT(p,m);
  const chips=[];
  if(p.pm.includes(m)) chips.push('<span class="cc p">✂️ גיזום</span>');
  if(p.fm.includes(m)) chips.push('<span class="cc f">🌱 דישון</span>');
  if(p.sm.includes(m)) chips.push('<span class="cc s">💧 תוסף</span>');
  if(p.crit) chips.push('<span class="cc u">⚠️ קריטי</span>');

  return `<div class="card ${al?'alert':''}" id="card-${p.id}" onclick="openM(${p.id})">
    <div class="card-img">
      <img class="real-photo" id="cimg-${p.id}" src="" alt="${p.name}" onerror="this.classList.remove('show')">
      <div class="img-bg ${p.bg}">
        <div class="plant-emoji-big">${p.e}</div>
      </div>
      <div class="photo-loading" id="cload-${p.id}"><div class="spin"></div></div>
      ${al?'<div class="alert-dot"></div>':''}
      <button class="card-menu-btn" id="cmb-${p.id}" onclick="event.stopPropagation();toggleCardMenu(${p.id},event)" title="אפשרויות">⋯</button>
      <div class="card-ctx-menu" id="ctx-${p.id}">
        <button class="ctx-item" onclick="event.stopPropagation();moveCardUp(${p.id})"><span class="ctx-item-icon">⬆️</span>הזז למעלה</button>
        <button class="ctx-item" onclick="event.stopPropagation();moveCardDown(${p.id})"><span class="ctx-item-icon">⬇️</span>הזז למטה</button>
        <div class="ctx-divider"></div>
        <button class="ctx-item" onclick="event.stopPropagation();closeCardMenu();openM(${p.id})"><span class="ctx-item-icon">✏️</span>פרטים ועריכה</button>
        <button class="ctx-item" onclick="event.stopPropagation();openPhotoEditor(${p.id},'medium')"><span class="ctx-item-icon">📷</span>ערוך תמונה</button>
        <div class="ctx-divider"></div>
        <button class="ctx-item danger" onclick="event.stopPropagation();confirmDeletePlant(${p.id})"><span class="ctx-item-icon">🗑️</span>מחק צמח</button>
      </div>
      <div class="size-tabs">
        <span class="sz" id="csz-${p.id}-small" onclick="event.stopPropagation();switchCardSize(${p.id},'small',this)">🌱</span>
        <span class="sz active" id="csz-${p.id}-medium" onclick="event.stopPropagation();switchCardSize(${p.id},'medium',this)">🌿</span>
        <span class="sz" id="csz-${p.id}-large" onclick="event.stopPropagation();switchCardSize(${p.id},'large',this)">🌳</span>
      </div>
    </div>
    <div class="card-body">
      <div class="card-name">${p.name}</div>
      <div class="card-type">${p.lbl}</div>
      ${plantingDates[p.id] ? `<div style="font-size:0.74rem;color:var(--g4);font-weight:600;margin-bottom:4px">🌱 גיל: ${formatAge(plantingDates[p.id])}</div>` : ''}
      ${p.prune?`<div class="care-row"><span class="ci">✂️</span><div><strong>גיזום:</strong> ${p.prune}</div></div>`:''}
      ${p.fert?`<div class="care-row"><span class="ci">🌱</span><div><strong>דשן:</strong> ${p.fert.substring(0,55)}</div></div>`:''}
      ${chips.length?`<div class="card-chips">${chips.join('')}</div>`:''}
    </div>
  </div>`;
}

function loadCardImg(id, size){
  const imgEl = document.getElementById(`cimg-${id}`);
  const loadEl = document.getElementById(`cload-${id}`);
  if(!imgEl) return;
  
  // Show spinner
  if(loadEl) loadEl.classList.add('show');
  imgEl.classList.remove('show');
  
  tryLoadImg(id, size, 
    (url)=>{
      if(loadEl) loadEl.classList.remove('show');
      imgEl.src = url;
      imgEl.onload = ()=>imgEl.classList.add('show');
    },
    ()=>{
      if(loadEl) loadEl.classList.remove('show');
    }
  );
}

function switchCardSize(id, size, btn){
  // Update active tab
  ['small','medium','large'].forEach(s=>{
    const el = document.getElementById(`csz-${id}-${s}`);
    if(el) el.classList.toggle('active', s===size);
  });
  loadCardImg(id, size);
}

// ===================================================
// MODAL
// ===================================================
async function openM(id){
  AP=P.find(x=>x.id===id);if(!AP) return;
  EDIT_MODE = false;
  const editBtn = document.getElementById('modal-edit-btn');
  if(editBtn){ editBtn.textContent='✏️ ערוך פרטים'; editBtn.classList.remove('active'); }
  
  document.getElementById('mt').textContent=AP.name;
  document.getElementById('ms').textContent=AP.lbl+' · '+AP.floor;

  // כפתור ויקיפדיה
  const wikiLink = document.getElementById('wiki-link');
  const wikiPage = WIKI_PAGES[AP.name]?.page;
  if (wikiPage) {
    wikiLink.href = `https://en.wikipedia.org/wiki/${encodeURIComponent(wikiPage)}`;
    wikiLink.style.display = 'inline-flex';
  } else {
    // חיפוש בוויקיפדיה לפי שם
    wikiLink.href = `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(AP.name)}`;
    wikiLink.style.display = 'inline-flex';
  }

  // Build 3 photo slots
  const sizes=['small','medium','large'];
  const sizeLabels=['🌱 שתיל קטן','🌿 גדילה בינונית','🌳 עץ בוגר'];
  let ph='';
  sizes.forEach((sz,i)=>{
    ph+=`<div class="m-slot ${sz==='medium'?'active-slot':''}" id="mslot-${sz}" onclick="selectModalSlot('${sz}')">
      <div class="m-slot-bg ${AP.bg}">
        <div class="slot-emoji">${AP.e}</div>
        <div class="slot-lbl">${sizeLabels[i]}</div>
      </div>
      <img class="m-slot-real" id="mimg-${sz}" src="" alt="${sz}" onerror="this.classList.remove('show')">
      <div class="m-slot-loading" id="mload-${sz}"><div class="slot-spin"></div></div>
      <div class="m-slot-lbl">${sizeLabels[i]}<br><small style="font-weight:400;opacity:.85">${AP.sizes?.[sz]||''}</small></div>
      <button class="slot-edit-btn" onclick="event.stopPropagation();openPhotoEditor(${AP.id},'${sz}')" title="ערוך תמונה">✏️</button>
    </div>`;
  });
  document.getElementById('mPhotos').innerHTML=ph;

  // Seasons
  document.getElementById('mseasons').innerHTML=`
    <div class="mseason w"><h4>❄️ חורף</h4>${AP.winter||'אין מידע.'}</div>
    <div class="mseason s"><h4>☀️ קיץ</h4>${AP.summer||'אין מידע.'}</div>`;

  // Body — use shared buildModalBody()
  buildModalBody();
  document.getElementById('overlay').classList.add('open');

  // Load all 3 images
  sizes.forEach(sz=>{
    const imgEl = document.getElementById(`mimg-${sz}`);
    const loadEl = document.getElementById(`mload-${sz}`);
    if(!imgEl) return;
    if(loadEl) loadEl.classList.add('show');
    
    tryLoadImg(AP.id, sz,
      (url)=>{
        if(loadEl) loadEl.classList.remove('show');
        imgEl.src = url;
        imgEl.onload = ()=>imgEl.classList.add('show');
      },
      ()=>{
        if(loadEl) loadEl.classList.remove('show');
      }
    );
  });
}

function selectModalSlot(sz){
  document.querySelectorAll('.m-slot').forEach(s=>s.classList.remove('active-slot'));
  const sl = document.getElementById(`mslot-${sz}`);
  if(sl) sl.classList.add('active-slot');
}

function closeModal(){document.getElementById('overlay').classList.remove('open');AP=null;}
function maybeClose(e){if(e.target===document.getElementById('overlay'))closeModal();}

// NOTIFICATIONS
function openNotif(){buildNotif();document.getElementById('np').classList.add('open');document.getElementById('no').classList.add('open');}
function closeNotif(){document.getElementById('np').classList.remove('open');document.getElementById('no').classList.remove('open');}
function buildNotif(){
  let h='';
  for(let off=0;off<3;off++){
    const mi=(CUR-1+off)%12,m=mi+1;
    const mp=P.filter(p=>hasT(p,m));
    if(!mp.length) continue;
    const lbl=off===0?' – החודש':off===1?' – חודש הבא':'';
    h+=`<div class="np-month">${MHE[mi]}${lbl}</div>`;
    mp.forEach(p=>{
      const ts=[];
      if(p.pm.includes(m)) ts.push({cl:'pr',ic:'✂️',tx:'גיזום – '+p.pi});
      if(p.fm.includes(m)) ts.push({cl:'fe',ic:'🌱',tx:'דישון'});
      if(p.sm.includes(m)) ts.push({cl:'su',ic:'💧',tx:'תוסף – '+(p.supp||'')});
      if(p.crit) ts.push({cl:'cr',ic:'⚠️',tx:p.crit});
      ts.forEach(t=>{
        h+=`<div class="ni ${t.cl}" onclick="closeNotif();openM(${p.id})">
          <div style="font-size:1.2rem">${t.ic}</div>
          <div><div class="ni-plant">${p.name}</div><div class="ni-task">${t.tx}</div><div class="ni-when">${MHE[mi]}${lbl}</div></div>
        </div>`;
      });
    });
  }
  document.getElementById('npb').innerHTML=h;
}
function subPush(){
  if(!('Notification' in window)){alert('הדפדפן לא תומך בהתראות.');return;}
  Notification.requestPermission().then(p=>{
    if(p==='granted'){
      new Notification('🌿 גן חכם',{body:'התראות גינה הופעלו!'});
      setTimeout(()=>{
        const mp=P.filter(x=>hasT(x,CUR));
        if(mp.length) new Notification(`🌿 ${mp.length} צמחים זקוקים לטיפול`,{body:mp.map(x=>x.name).join(', ')});
      },2000);
    }
  });
}

// ===================================================
// PHOTO EDITOR
// ===================================================
let PE_plant=null, PE_size='medium', PE_pendingUrl=null;

function openPhotoEditor(id, size){
  PE_plant=P.find(x=>x.id===id)||AP;
  if(!PE_plant) return;
  PE_size=size||'medium';
  PE_pendingUrl=null;
  document.getElementById('pe-subtitle').textContent=`${PE_plant.name} – ${PE_size==='small'?'שתיל קטן':PE_size==='medium'?'גדילה בינונית':'עץ בוגר'}`;
  
  // Size tabs
  const tabs=['small','medium','large'];
  const tabLabels=['🌱 שתיל','🌿 בינוני','🌳 בוגר'];
  document.getElementById('pe-size-tabs').innerHTML=tabs.map((s,i)=>
    `<div class="pe-sz ${s===PE_size?'active':''}" onclick="switchPESize('${s}')">${tabLabels[i]}</div>`
  ).join('');

  // Show current image
  updatePECurrentImg();
  
  // Reset UI
  document.getElementById('pe-preview-wrap').style.display='none';
  document.getElementById('pe-url-input').value='';
  document.getElementById('pe-paste-zone').classList.remove('drag-over');
  
  document.getElementById('pe-bg').classList.add('open');
  document.getElementById('pe-panel').classList.add('open');

  // Listen for paste globally
  document.addEventListener('paste', handlePasteEvent);
}

function switchPESize(sz){
  PE_size=sz;
  document.querySelectorAll('.pe-sz').forEach((el,i)=>el.classList.toggle('active',['small','medium','large'][i]===sz));
  document.getElementById('pe-subtitle').textContent=`${PE_plant.name} – ${sz==='small'?'שתיל קטן':sz==='medium'?'גדילה בינונית':'עץ בוגר'}`;
  updatePECurrentImg();
  document.getElementById('pe-preview-wrap').style.display='none';
}

function updatePECurrentImg(){
  const emojiEl=document.getElementById('pe-current-emoji');
  const imgEl=document.getElementById('pe-current-img');
  if(emojiEl) emojiEl.textContent=PE_plant?.e||'🌿';
  
  const cached=imgCache[`${PE_plant?.name}__${PE_size}`];
  // Check custom overrides first
  const customKey=`custom_${PE_plant?.id}_${PE_size}`;
  const customUrl=imgCache[customKey]||null;
  
  if(customUrl||cached){
    imgEl.src=customUrl||cached;
    imgEl.style.display='block';
  } else {
    imgEl.style.display='none';
  }
}

function closePhotoEditor(){
  document.getElementById('pe-bg').classList.remove('open');
  document.getElementById('pe-panel').classList.remove('open');
  document.removeEventListener('paste', handlePasteEvent);
  PE_pendingUrl=null;
}

function handleFileUpload(event){
  const file=event.target.files[0];
  if(!file||!file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=e=>showPreview(e.target.result);
  reader.readAsDataURL(file);
  event.target.value='';
}

function handlePasteEvent(e){
  const items=(e.clipboardData||window.clipboardData)?.items;
  if(!items) return;
  for(const item of items){
    if(item.type.startsWith('image/')){
      e.preventDefault();
      const blob=item.getAsFile();
      const reader=new FileReader();
      reader.onload=ev=>showPreview(ev.target.result);
      reader.readAsDataURL(blob);
      return;
    }
  }
}

async function pasteFromClipboard(){
  try{
    const items=await navigator.clipboard.read();
    for(const item of items){
      for(const type of item.types){
        if(type.startsWith('image/')){
          const blob=await item.getType(type);
          const reader=new FileReader();
          reader.onload=e=>showPreview(e.target.result);
          reader.readAsDataURL(blob);
          return;
        }
      }
    }
    alert('לא נמצאה תמונה בלוח. העתק תמונה ואז לחץ שוב.');
  } catch(e){
    alert('לחץ Ctrl+V כאן ב-Chrome, או גרור תמונה לאזור הגרירה.');
  }
}

function handleDrop(event){
  event.preventDefault();
  document.getElementById('pe-paste-zone').classList.remove('drag-over');
  const file=event.dataTransfer.files[0];
  if(file&&file.type.startsWith('image/')){
    const reader=new FileReader();
    reader.onload=e=>showPreview(e.target.result);
    reader.readAsDataURL(file);
  }
}

function previewUrl(url){
  if(url.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)/i)){
    showPreview(url);
  }
}

function showPreview(url){
  PE_pendingUrl=url;
  const prev=document.getElementById('pe-preview');
  prev.src=url;
  document.getElementById('pe-preview-wrap').style.display='block';
  document.getElementById('pe-preview-wrap').scrollIntoView({behavior:'smooth',block:'nearest'});
}

function saveUrlImg(){
  const url=document.getElementById('pe-url-input').value.trim();
  if(!url){alert('נא להזין קישור לתמונה.');return;}
  showPreview(url);
}

function savePhotoEdit(){
  if(!PE_pendingUrl||!PE_plant) return;
  // Save to custom cache
  const customKey=`custom_${PE_plant.id}_${PE_size}`;
  imgCache[customKey]=PE_pendingUrl;
  // Also update the wiki cache so it shows immediately
  imgCache[`${PE_plant.name}__${PE_size}`]=PE_pendingUrl;
  
  // Refresh modal images if open
  if(AP&&AP.id===PE_plant.id){
    const imgEl=document.getElementById(`mimg-${PE_size}`);
    if(imgEl){imgEl.src=PE_pendingUrl;imgEl.classList.add('show');}
  }
  // Refresh card image if visible
  const cardImg=document.getElementById(`cimg-${PE_plant.id}`);
  if(cardImg&&PE_size==='medium'){cardImg.src=PE_pendingUrl;cardImg.classList.add('show');}
  
  closePhotoEditor();
  showToast(`✅ תמונה נשמרה עבור ${PE_plant.name}!`);
}

function cancelPreview(){
  PE_pendingUrl=null;
  document.getElementById('pe-preview-wrap').style.display='none';
}

function showToast(msg){
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;z-index:9999;background:#0f2a1a;color:#fff;padding:12px 22px;border-radius:14px;font-family:Heebo,sans-serif;font-size:0.88rem;font-weight:700;box-shadow:0 8px 30px rgba(0,0,0,0.3);animation:fi .3s ease;';
  t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2800);
}

// ===================================================
// ADD PLANT WITH AUTOCOMPLETE + CLAUDE AI
// ===================================================
let AP_pending = null;
let AC_focusIdx = -1;
let AC_results = [];
let AC_searchTimer = null;

// Large plant database for autocomplete (Hebrew + common names)
const PLANT_DB = [
  // פרי
  {name:'תפוח',alt:'apple Malus',e:'🍎',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'אגס',alt:'pear Pyrus',e:'🍐',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'שזיף',alt:'plum Prunus',e:'🫐',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'דובדבן',alt:'cherry Prunus cerasus',e:'🍒',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'אפרסק',alt:'peach Prunus persica',e:'🍑',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'משמש',alt:'apricot Prunus armeniaca',e:'🍊',type:'fruit',floor:'קומה תחתונה',lbl:'עץ פרי נשיר'},
  {name:'בננה',alt:'banana Musa',e:'🍌',type:'tropical',floor:'קומה עליונה',lbl:'טרופי'},
  {name:'אננס',alt:'pineapple Ananas',e:'🍍',type:'tropical',floor:'קומה עליונה',lbl:'טרופי'},
  {name:'קיווי',alt:'kiwi Actinidia',e:'🥝',type:'fruit',floor:'קומה תחתונה',lbl:'גפן פרי'},
  {name:'ענבים',alt:'grape vine Vitis vinifera',e:'🍇',type:'fruit',floor:'קומה תחתונה',lbl:'גפן'},
  {name:'תאנה',alt:'fig Ficus carica',e:'🍃',type:'fruit',floor:'קומה עליונה',lbl:'עץ פרי ים תיכוני'},
  {name:'זית',alt:'olive Olea europaea',e:'🫒',type:'fruit',floor:'קומה עליונה',lbl:'עץ פרי ירוק עד'},
  {name:'רימון',alt:'pomegranate Punica granatum',e:'🍎',type:'fruit',floor:'קומה עליונה',lbl:'עץ פרי ים תיכוני'},
  {name:'לימון',alt:'lemon Citrus limon',e:'🍋',type:'fruit',floor:'קומה עליונה',lbl:'פרי הדר'},
  {name:'תפוז',alt:'orange Citrus sinensis',e:'🍊',type:'fruit',floor:'קומה עליונה',lbl:'פרי הדר'},
  {name:'גרפרוט',alt:'grapefruit Citrus paradisi',e:'🍋',type:'fruit',floor:'קומה עליונה',lbl:'פרי הדר'},
  {name:'קלמנטינה',alt:'clementine Citrus',e:'🍊',type:'fruit',floor:'קומה עליונה',lbl:'פרי הדר'},
  {name:'קוקוס',alt:'coconut Cocos nucifera',e:'🥥',type:'tropical',floor:'קומה עליונה',lbl:'טרופי'},
  {name:'פרי הדר',alt:'citrus fruit',e:'🍊',type:'fruit',floor:'קומה עליונה',lbl:'פרי הדר'},
  {name:'תמר',alt:'date palm Phoenix dactylifera',e:'🌴',type:'tropical',floor:'קומה עליונה',lbl:'דקל'},
  {name:'שקמה',alt:'sycamore Ficus sycomorus',e:'🌳',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ נוי'},
  {name:'אגוז',alt:'walnut Juglans regia',e:'🌰',type:'fruit',floor:'קומה תחתונה',lbl:'עץ אגוז'},
  {name:'חרוב',alt:'carob Ceratonia siliqua',e:'🌿',type:'fruit',floor:'קומה תחתונה',lbl:'עץ ים תיכוני'},
  // נוי
  {name:'ורד',alt:'rose Rosa',e:'🌹',type:'ornamental',floor:'קומה עליונה',lbl:'שיח נוי'},
  {name:'לבנדר',alt:'lavender Lavandula',e:'💜',type:'ornamental',floor:'קומה עליונה',lbl:'שיח ריחני'},
  {name:'רוזמרין',alt:'rosemary Rosmarinus',e:'🌿',type:'ornamental',floor:'קומה עליונה',lbl:'שיח ריחני'},
  {name:'בוגנוויליה',alt:'bougainvillea',e:'🌺',type:'ornamental',floor:'קומה עליונה',lbl:'מטפס נוי'},
  {name:'אקליפטוס',alt:'eucalyptus',e:'🌳',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ נוי'},
  {name:'ברוש',alt:'cypress Cupressus',e:'🌲',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ מחטני'},
  {name:'אורן',alt:'pine Pinus',e:'🌲',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ מחטני'},
  {name:'ברוש מצוי',alt:'Cupressus sempervirens',e:'🌲',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ מחטני'},
  {name:'אשל',alt:'tamarisk Tamarix',e:'🌿',type:'ornamental',floor:'קומה תחתונה',lbl:'שיח/עץ'},
  {name:'כלנית',alt:'anemone',e:'🌸',type:'ornamental',floor:'קומה עליונה',lbl:'פרח'},
  {name:'נרקיס',alt:'narcissus daffodil',e:'🌼',type:'ornamental',floor:'קומה עליונה',lbl:'פקעת'},
  {name:'צבעוני',alt:'tulip',e:'🌷',type:'ornamental',floor:'קומה עליונה',lbl:'פקעת'},
  // ירקות
  {name:'עגבנייה',alt:'tomato Solanum lycopersicum',e:'🍅',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'מלפפון',alt:'cucumber Cucumis sativus',e:'🥒',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'גזר',alt:'carrot Daucus carota',e:'🥕',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'תרד',alt:'spinach Spinacia',e:'🥬',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'חסה',alt:'lettuce Lactuca sativa',e:'🥬',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'פלפל',alt:'pepper Capsicum',e:'🫑',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'חציל',alt:'eggplant aubergine Solanum',e:'🍆',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'דלעת',alt:'pumpkin squash',e:'🎃',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'שעועית',alt:'bean Phaseolus',e:'🫘',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'אפונה',alt:'pea Pisum sativum',e:'🫛',type:'tropical',floor:'נספחים',lbl:'ירק'},
  {name:'תפוח אדמה',alt:'potato Solanum tuberosum',e:'🥔',type:'tropical',floor:'נספחים',lbl:'ירק'},
  // תבלינים
  {name:'ג\'ינג\'ר',alt:"ginger Zingiber officinale",e:'🌿',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'כורכום',alt:'turmeric Curcuma',e:'🌿',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'נענע',alt:'mint Mentha',e:'🌿',type:'ornamental',floor:'נספחים',lbl:'תבלין'},
  {name:'בזיליקום',alt:'basil Ocimum basilicum',e:'🌿',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'כוסברה',alt:'coriander Coriandrum',e:'🌿',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'פטרוזיליה',alt:'parsley Petroselinum',e:'🌿',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'שום',alt:'garlic Allium sativum',e:'🧄',type:'tropical',floor:'נספחים',lbl:'תבלין'},
  {name:'בצל',alt:'onion Allium cepa',e:'🧅',type:'tropical',floor:'נספחים',lbl:'ירק'},
  // שיחים
  {name:'יסמין',alt:'jasmine Jasminum',e:'🌸',type:'bush',floor:'קומה עליונה',lbl:'שיח ריחני'},
  {name:'הידנגה',alt:'hydrangea',e:'💐',type:'bush',floor:'קומה עליונה',lbl:'שיח נוי'},
  {name:'גרניום',alt:'geranium Pelargonium',e:'🌺',type:'bush',floor:'קומה עליונה',lbl:'שיח'},
  {name:'דפנה',alt:'oleander Nerium oleander',e:'🌸',type:'bush',floor:'קומה עליונה',lbl:'שיח'},
  {name:'שזיף יפני',alt:'Japanese plum Prunus mume',e:'🌸',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ נוי'},
  {name:'פרח שמש',alt:'sunflower Helianthus',e:'🌻',type:'ornamental',floor:'נספחים',lbl:'פרח שנתי'},
  {name:'קקטוס',alt:'cactus Cactaceae',e:'🌵',type:'ornamental',floor:'קומה עליונה',lbl:'עסיסי'},
  {name:'עלות',alt:'aloe vera',e:'🌿',type:'ornamental',floor:'קומה עליונה',lbl:'עסיסי'},
  {name:'פיקוס',alt:'ficus Ficus benjamina',e:'🌳',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ נוי'},
  {name:'דקל',alt:'palm Phoenix',e:'🌴',type:'tropical',floor:'קומה עליונה',lbl:'דקל'},
  {name:'בוהינייה',alt:'bauhinia orchid tree',e:'🌸',type:'ornamental',floor:'קומה תחתונה',lbl:'עץ נוי'},
  {name:'פלמריה',alt:'plumeria frangipani',e:'🌸',type:'tropical',floor:'קומה עליונה',lbl:'טרופי'},
];

function fuzzyMatch(query, text) {
  // normalize
  const q = query.toLowerCase().trim();
  const t = text.toLowerCase();
  if (t.includes(q)) return { match: true, score: 100 - t.indexOf(q) };
  // char-by-char fuzzy
  let qi = 0, score = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) { qi++; score += (qi === 1 ? 20 : 10); }
  }
  return { match: qi === q.length, score };
}

function highlightMatch(text, query) {
  const q = query.toLowerCase().trim();
  const idx = text.toLowerCase().indexOf(q);
  if (idx >= 0) {
    return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + q.length) + '</mark>' + text.slice(idx + q.length);
  }
  return text;
}

let AC_debounce = null;
function onAPInput(val) {
  clearTimeout(AC_debounce);
  if (val.length < 2) { closeACDropdown(); return; }
  AC_debounce = setTimeout(() => searchPlants(val), 150);
}

function searchPlants(query) {
  const q = query.trim();
  // Search in local DB
  const local = PLANT_DB
    .map(p => {
      const nameMatch = fuzzyMatch(q, p.name);
      const altMatch = fuzzyMatch(q, p.alt);
      const score = Math.max(nameMatch.match ? nameMatch.score + 50 : 0, altMatch.match ? altMatch.score : 0);
      return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  // Also search existing P for matches
  const existing = P
    .filter(p => {
      const m = fuzzyMatch(q, p.name);
      return m.match;
    })
    .map(p => ({ ...p, _existing: true, score: 999 }));

  AC_results = [...existing.filter(e => !local.find(l => l.name === e.name)), ...local];
  AC_focusIdx = -1;
  renderACDropdown(q);
}

function renderACDropdown(query) {
  const dd = document.getElementById('ap-ac-dropdown');
  if (!AC_results.length) {
    dd.innerHTML = `<div class="ap-ac-empty">לא נמצאו תוצאות. לחץ ✨ הוסף לחיפוש עם AI</div>`;
    dd.classList.add('open');
    return;
  }

  const existing = AC_results.filter(r => r._existing);
  const suggestions = AC_results.filter(r => !r._existing);

  let h = '';
  if (existing.length) {
    h += `<div class="ap-ac-section">בגינה שלך</div>`;
    existing.forEach((p, i) => {
      h += `<div class="ap-ac-item" data-idx="${i}" onclick="quickAddExisting(${p.id})">
        <span class="ap-ac-emoji">${p.e}</span>
        <div class="ap-ac-body">
          <div class="ap-ac-name">${highlightMatch(p.name, query)} <span style="font-size:.7rem;color:#9ca3af">✓ כבר בגינה</span></div>
          <div class="ap-ac-sub">${p.lbl} · ${p.floor}</div>
        </div>
      </div>`;
    });
  }
  if (suggestions.length) {
    h += `<div class="ap-ac-section">הצעות</div>`;
    suggestions.forEach((p, i) => {
      const idx = existing.length + i;
      h += `<div class="ap-ac-item" data-idx="${idx}" onclick="selectACItem(${idx})">
        <span class="ap-ac-emoji">${p.e}</span>
        <div class="ap-ac-body">
          <div class="ap-ac-name">${highlightMatch(p.name, query)}</div>
          <div class="ap-ac-sub">${p.lbl} · ${p.floor}</div>
        </div>
        <span class="ap-ac-badge">${p.type === 'fruit' ? 'פרי' : p.type === 'ornamental' ? 'נוי' : p.type === 'tropical' ? 'טרופי' : p.type === 'bush' ? 'שיח' : 'דשא'}</span>
        <button class="ap-ac-add-btn" onclick="event.stopPropagation();quickAddFromDB(${idx})">+ הוסף</button>
      </div>`;
    });
  }
  h += `<div class="ap-ac-item" style="border-top:2px solid var(--g7)" onclick="classifyPlant()">
    <span class="ap-ac-emoji">✨</span>
    <div class="ap-ac-body">
      <div class="ap-ac-name" style="color:var(--g3)">הוסף עם AI מפורט</div>
      <div class="ap-ac-sub">Claude ינתח ויגדיר את הצמח בשלמות</div>
    </div>
  </div>`;

  dd.innerHTML = h;
  dd.classList.add('open');
}

function closeACDropdown() {
  document.getElementById('ap-ac-dropdown').classList.remove('open');
  AC_results = [];
}

function onAPKey(e) {
  const dd = document.getElementById('ap-ac-dropdown');
  if (!dd.classList.contains('open')) {
    if (e.key === 'Enter') classifyPlant();
    return;
  }
  const items = dd.querySelectorAll('.ap-ac-item');
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    AC_focusIdx = Math.min(AC_focusIdx + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('focused', i === AC_focusIdx));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    AC_focusIdx = Math.max(AC_focusIdx - 1, 0);
    items.forEach((el, i) => el.classList.toggle('focused', i === AC_focusIdx));
  } else if (e.key === 'Enter') {
    if (AC_focusIdx >= 0 && items[AC_focusIdx]) { items[AC_focusIdx].click(); }
    else { classifyPlant(); }
  } else if (e.key === 'Escape') {
    closeACDropdown();
  }
}

function selectACItem(idx) {
  const p = AC_results[idx];
  if (!p) return;
  document.getElementById('ap-name-input').value = p.name;
  closeACDropdown();
  // auto-classify with this known name
  classifyPlant();
}

function quickAddFromDB(idx) {
  const template = AC_results[idx];
  if (!template) return;
  // Directly classify using Claude with the exact name
  document.getElementById('ap-name-input').value = template.name;
  closeACDropdown();
  classifyPlant();
}

function quickAddExisting(id) {
  closeACDropdown();
  closeAddPlant();
  openM(id);
}

// close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('.ap-ac-wrap')) closeACDropdown();
});

function openAddPlant(){
  document.getElementById('ap-bg').classList.add('open');
  document.getElementById('ap-panel').classList.add('open');
  setTimeout(() => document.getElementById('ap-name-input').focus(), 300);
  document.getElementById('ap-result').style.display='none';
  document.getElementById('ap-loading').style.display='none';
  document.getElementById('ap-name-input').value='';
  closeACDropdown();
}

function closeAddPlant(){
  document.getElementById('ap-bg').classList.remove('open');
  document.getElementById('ap-panel').classList.remove('open');
  AP_pending=null;
  closeACDropdown();
}

async function classifyPlant(){
  const name=document.getElementById('ap-name-input').value.trim();
  if(!name){alert('נא להזין שם צמח.');return;}
  closeACDropdown();
  
  document.getElementById('ap-loading').style.display='block';
  document.getElementById('ap-result').style.display='none';
  document.getElementById('ap-classify-btn').disabled=true;
  document.getElementById('ap-btn-txt').textContent='⏳';

  const prompt=`אתה מומחה גינון ישראלי. המשתמש רוצה להוסיף לגינה: "${name}".
ענה אך ורק ב-JSON תקני ללא שום טקסט נוסף, ללא markdown, ללא הסברים:
{"name":"שם עברי","lbl":"תיאור קצר","e":"אמוג'י","type":"fruit|ornamental|tropical|bush|lawn","floor":"קומה עליונה|קומה תחתונה|נספחים","prune":"זמן גיזום","pi":"קל|בינוני|קשה|קשה מאוד|קל מאוד","pmth":"שיטת גיזום","pm":[מספרי חודשים],"fert":"דשן מומלץ","fm":[מספרי חודשים],"supp":"תוסף או null","sm":[מספרי חודשים],"rules":"כללים או null","crit":"אזהרה קריטית או null","waterSummer":מספר_ליטרים_בשבוע_בקיץ,"waterWinter":מספר_ליטרים_בשבוע_בחורף,"waterType":"עמוקה|רדודה","light":"שמש מלאה|חצי שמש|צל","lightAlt":"שמש מלאה|חצי שמש|צל|null","climate":["עמיד לקור","עמיד לשרב"],"indoor":true_or_false,"geo":"תיאור התאמה גיאוגרפית לישראל","harvestMonths":[מספרי חודשים לפרי בלבד או מערך ריק],"winter":"חורף","summer":"קיץ","sizes":{"small":"שלב שתיל","medium":"שלב בינוני","large":"שלב בוגר"}}`;

  try{
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,
        system:'ענה אך ורק ב-JSON תקני ללא שום טקסט נוסף.',
        messages:[{role:'user',content:prompt}]})
    });
    if(!resp.ok){
      const errBody=await resp.text();
      console.error('API error',resp.status,errBody);
      // Fallback: build plant from local DB if possible
      const localMatch = PLANT_DB.find(p => p.name === name || p.alt.toLowerCase().includes(name.toLowerCase()));
      if(localMatch){
        await quickAddFromTemplate(localMatch);
        return;
      }
      throw new Error(`HTTP ${resp.status}: ${errBody}`);
    }
    const data=await resp.json();
    let txt=(data.content||[]).map(c=>c.text||'').join('').trim();
    txt=txt.replace(/```json|```/g,'').trim();
    const plant=JSON.parse(txt);
    plant.id=Date.now();
    plant.bg=plant.type==='citrus'?'citrus':plant.type;
    plant.pm=Array.isArray(plant.pm)?plant.pm:[];
    plant.fm=Array.isArray(plant.fm)?plant.fm:[];
    plant.sm=Array.isArray(plant.sm)?plant.sm:[];
    plant.harvestMonths=Array.isArray(plant.harvestMonths)?plant.harvestMonths:[];
    plant.climate=Array.isArray(plant.climate)?plant.climate:[];
    plant.indoor=!!plant.indoor;
    AP_pending=plant;
    showAPResult(plant);
  }catch(e){
    console.error('classifyPlant error:',e);
    // Try local fallback
    const localMatch = PLANT_DB.find(p => p.name === name || name.includes(p.name) || p.name.includes(name));
    if(localMatch){
      await quickAddFromTemplate(localMatch);
    } else {
      alert('לא ניתן להתחבר ל-AI כרגע.\nייתכן שהאפליקציה צריכה לרוץ בתוך Claude.ai.\n\nפרטי שגיאה: ' + e.message);
    }
  }finally{
    document.getElementById('ap-loading').style.display='none';
    document.getElementById('ap-classify-btn').disabled=false;
    document.getElementById('ap-btn-txt').textContent='✨ הוסף';
  }
}

async function quickAddFromTemplate(template){
  // Build a complete plant object from local DB template with sensible defaults
  const typeDefaults = {
    fruit:     {prune:'פברואר (לפני פריחה)',pm:[2],pi:'בינוני',pmth:'הסרת ענפים מתים ויבשים, דילול.',fert:'NPK 10-10-10 – אביב.',fm:[3,4],supp:'כילאט ברזל',sm:[9],winter:'רדום או ירוק עד, לפי הזן.',summer:'צמיחה פעילה, פיתוח פרי.'},
    ornamental:{prune:'ינואר-פברואר',pm:[1,2],pi:'קל',pmth:'גיזום עיצובי, הסרת ענפים יבשים.',fert:'דשן אוניברסלי – אביב.',fm:[3,4],supp:null,sm:[],winter:'תרדמה חלקית.',summer:'צמיחה ופריחה.'},
    tropical:  {prune:'ספטמבר-אוקטובר',pm:[9,10],pi:'קל',pmth:'הסרת עלים יבשים וענפים חלשים.',fert:'דשן עשיר באשלגן – אביב.',fm:[3,4,5],supp:null,sm:[],winter:'מוגן מקור, צמיחה איטית.',summer:'צמיחה מהירה, דורש השקיה.'},
    bush:      {prune:'פברואר-מרץ',pm:[2,3],pi:'בינוני',pmth:'גיזום לחידוש וצמיחה.',fert:'NPK מאוזן – אביב.',fm:[3,4],supp:null,sm:[],winter:'תרדמה חלקית.',summer:'פריחה ופרי.'},
    lawn:      {prune:'כל הקיץ',pm:[4,5,6,7,8],pi:'קל',pmth:'גז קצב ב-4-6 ס"מ.',fert:'דשן חנקן – אביב.',fm:[3,4],supp:null,sm:[],winter:'גדילה איטית.',summer:'גדילה מהירה, דורש השקיה.'},
  };
  const def = typeDefaults[template.type] || typeDefaults.fruit;
  const plant = {
    id: Date.now(),
    name: template.name,
    lbl: template.lbl,
    e: template.e,
    type: template.type,
    bg: template.type,
    floor: template.floor,
    prune: def.prune,
    pm: def.pm,
    pi: def.pi,
    pmth: def.pmth,
    fert: def.fert,
    fm: def.fm,
    supp: def.supp,
    sm: def.sm,
    rules: null,
    crit: null,
    winter: def.winter,
    summer: def.summer,
    sizes: {
      small: 'שתיל קטן – 0.5-1 מ׳',
      medium: 'גדילה בינונית – 1-3 מ׳',
      large: 'עץ/שיח בוגר – 3+ מ׳'
    }
  };
  AP_pending = plant;
  showAPResult(plant);
  showToast('✅ מילאנו פרטים בסיסיים. AI לא היה זמין.');
}

function showAPResult(p){
  const typeMap={fruit:'עץ פרי 🍎',ornamental:'נוי 🌸',tropical:'טרופי 🌴',bush:'שיח 🌿',lawn:'דשא 🌾'};
  document.getElementById('ap-result-card').innerHTML=`
    <h4>${p.e} ${p.name} <span style="font-size:0.75rem;font-weight:500;color:#7a9a7a">${p.lbl}</span></h4>
    <div class="ap-row"><span class="ap-lbl">סוג:</span><span class="ap-val">${typeMap[p.type]||p.type}</span></div>
    <div class="ap-row"><span class="ap-lbl">מיקום:</span><span class="ap-val">${p.floor}</span></div>
    <div class="ap-row"><span class="ap-lbl">גיזום:</span><span class="ap-val">${p.prune||'—'} (${p.pi||''})</span></div>
    <div class="ap-row"><span class="ap-lbl">שיטה:</span><span class="ap-val">${p.pmth||'—'}</span></div>
    <div class="ap-row"><span class="ap-lbl">דישון:</span><span class="ap-val">${p.fert||'—'}</span></div>
    ${p.supp?`<div class="ap-row"><span class="ap-lbl">תוסף:</span><span class="ap-val">${p.supp}</span></div>`:''}
    ${p.rules?`<div class="ap-row"><span class="ap-lbl">כללים:</span><span class="ap-val">${p.rules}</span></div>`:''}
    ${p.crit?`<div style="background:#fee2e2;border-radius:8px;padding:8px 10px;font-size:0.8rem;color:#991b1b;margin-top:6px">⚠️ ${p.crit}</div>`:''}
    <div style="margin-top:10px;border-top:1px solid #c5ddc5;padding-top:10px;font-size:0.78rem;color:#5a7a5a">
      ❄️ <strong>חורף:</strong> ${p.winter||'—'}<br>☀️ <strong>קיץ:</strong> ${p.summer||'—'}
    </div>`;
  document.getElementById('ap-result').style.display='block';
}

// confirmAddPlant replaced by patched version below


// ===================================================
// AGE & PLANTING DATE
// ===================================================
// plantingDates[id] = ISO date string "YYYY-MM-DD"
const plantingDates = {};

function formatAge(plantDate) {
  if (!plantDate) return null;
  const now = new Date();
  const planted = new Date(plantDate);
  const diffMs = now - planted;
  if (diffMs < 0) return 'טרם נשתל';
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const years = diffDays / 365.25;
  if (years < 0.08) return `${Math.round(diffDays)} ימים`;
  if (years < 1) {
    const months = years * 12;
    return `${Math.round(months * 2) / 2} חודשים`;
  }
  // Round to nearest 0.5
  const rounded = Math.round(years * 2) / 2;
  return `${rounded} שנ${rounded === 1 ? 'ה' : 'ים'}`;
}

function getOrlaInfo(plantDate) {
  if (!plantDate) return null;
  const planted = new Date(plantDate);
  const orlaEnd = new Date(planted);
  orlaEnd.setFullYear(orlaEnd.getFullYear() + 4); // 3 שנות ערלה + שנה רביעית נטע רבעי
  const now = new Date();
  const cleared = now >= orlaEnd;
  const diffMs = orlaEnd - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffYears = Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 2) / 2;
  
  if (cleared) {
    return { cleared: true, text: 'ערלה הסתיימה ✅ ניתן לאכול מהפרי!' };
  } else {
    const endStr = orlaEnd.toLocaleDateString('he-IL', {year:'numeric',month:'long',day:'numeric'});
    const remaining = diffYears > 0 ? `${diffYears} שנ${diffYears===1?'ה':'ים'}` : `${diffDays} ימים`;
    return { cleared: false, text: `שנות ערלה מסתיימות: ${endStr}\nנותר עוד: ${remaining} עד שניתן לאכול` };
  }
}

function openAgeEditor(pid) {
  const existing = plantingDates[pid];
  const section = document.getElementById(`age-section-${pid}`);
  if (!section) return;
  const isOpen = section.querySelector('.age-editor');
  if (isOpen) { section.removeChild(isOpen); return; }

  const p = P.find(x => x.id === pid);
  const isTree = p && (p.type === 'fruit' || p.type === 'tropical' || p.type === 'ornamental');

  const div = document.createElement('div');
  div.className = 'age-editor';
  div.innerHTML = `
    <h5>📅 עדכון תאריך שתילה</h5>
    <div class="age-inp-row">
      <span class="age-inp-label">תאריך שתילה:</span>
      <input type="date" class="age-inp" id="age-date-${pid}" value="${existing || ''}">
    </div>
    <button class="age-save-btn" onclick="saveAge(${pid})">שמור</button>
    ${existing ? `<button class="age-save-btn" style="background:#dc2626;margin-right:8px" onclick="clearAge(${pid})">מחק</button>` : ''}
    ${isTree && existing ? renderOrlaBlock(pid) : ''}
  `;
  section.appendChild(div);
}

function renderOrlaBlock(pid) {
  const orla = getOrlaInfo(plantingDates[pid]);
  if (!orla) return '';
  return `<div class="orla-info ${orla.cleared ? 'cleared' : ''}">
    <strong>🍎 חוק הערלה</strong>
    ${orla.text.replace(/\n/g,'<br>')}
  </div>`;
}

function saveAge(pid) {
  const inp = document.getElementById(`age-date-${pid}`);
  if (!inp || !inp.value) return;
  plantingDates[pid] = inp.value;
  // Re-render modal section
  const section = document.getElementById(`age-section-${pid}`);
  if (section) {
    const editor = section.querySelector('.age-editor');
    if (editor) section.removeChild(editor);
  }
  // Update the badges
  refreshAgeBadges(pid);
  showToast('📅 תאריך שתילה נשמר!');
}

function clearAge(pid) {
  delete plantingDates[pid];
  refreshAgeBadges(pid);
  const section = document.getElementById(`age-section-${pid}`);
  if (section) { const editor = section.querySelector('.age-editor'); if (editor) section.removeChild(editor); }
}

function refreshAgeBadges(pid) {
  const ageBadge = document.getElementById(`age-badge-${pid}`);
  const orlaEl = document.getElementById(`orla-badge-${pid}`);
  const date = plantingDates[pid];
  
  if (ageBadge) {
    const age = formatAge(date);
    ageBadge.textContent = age ? `🌱 גיל: ${age}` : '📅 הוסף גיל';
    ageBadge.style.opacity = age ? '1' : '0.6';
  }
  if (orlaEl) {
    if (!date) { orlaEl.style.display = 'none'; return; }
    const orla = getOrlaInfo(date);
    if (!orla) { orlaEl.style.display = 'none'; return; }
    orlaEl.style.display = 'inline-flex';
    orlaEl.textContent = orla.cleared ? '✅ ערלה הסתיימה' : `⏳ ערלה נגמרת ${new Date(new Date(date).setFullYear(new Date(date).getFullYear()+4)).getFullYear()}`;
    orlaEl.className = `age-badge orla-badge${orla.cleared?' done':''}`;
  }
}

// ===================================================
// CARD 3-DOT CONTEXT MENU
// ===================================================
let openMenuId = null;

function toggleCardMenu(id, event) {
  event.stopPropagation();
  const menu = document.getElementById(`ctx-${id}`);
  const btn = document.getElementById(`cmb-${id}`);
  const isOpen = menu.classList.contains('open');
  closeCardMenu();
  if (!isOpen) {
    menu.classList.add('open');
    btn.classList.add('open');
    openMenuId = id;
  }
}

function closeCardMenu() {
  if (openMenuId !== null) {
    const m = document.getElementById(`ctx-${openMenuId}`);
    const b = document.getElementById(`cmb-${openMenuId}`);
    if (m) m.classList.remove('open');
    if (b) b.classList.remove('open');
    openMenuId = null;
  }
}

// Close menu on outside click
document.addEventListener('click', () => closeCardMenu());

function moveCardUp(id) {
  closeCardMenu();
  const idx = P.findIndex(x => x.id === id);
  if (idx <= 0) return;
  [P[idx - 1], P[idx]] = [P[idx], P[idx - 1]];
  render();
  showToast('⬆️ הצמח הוזז למעלה');
}

function moveCardDown(id) {
  closeCardMenu();
  const idx = P.findIndex(x => x.id === id);
  if (idx < 0 || idx >= P.length - 1) return;
  [P[idx], P[idx + 1]] = [P[idx + 1], P[idx]];
  render();
  showToast('⬇️ הצמח הוזז למטה');
}

function confirmDeletePlant(id) {
  closeCardMenu();
  const p = P.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`למחוק את "${p.name}" לצמיתות?`)) return;
  deletePlant(id);
}

function confirmDeleteFromModal() {
  if (!AP) return;
  if (!confirm(`למחוק את "${AP.name}" לצמיתות?`)) return;
  const id = AP.id;
  closeModal();
  deletePlant(id);
}

// deletePlant replaced by patched version below


// ===================================================
// MODAL EDIT MODE
// ===================================================
let EDIT_MODE = false;
const P_ORIGINALS = {}; // backup of original plant data

function backupPlant(p) {
  if (!P_ORIGINALS[p.id]) {
    P_ORIGINALS[p.id] = JSON.parse(JSON.stringify(p));
  }
}

function toggleEditMode() {
  EDIT_MODE = !EDIT_MODE;
  const btn = document.getElementById('modal-edit-btn');
  if (EDIT_MODE) {
    btn.textContent = '✅ סיים עריכה';
    btn.classList.add('active');
    renderEditMode();
  } else {
    btn.textContent = '✏️ ערוך פרטים';
    btn.classList.remove('active');
    openM(AP.id); // re-render view mode
  }
}

function renderEditMode() {
  if (!AP) return;
  backupPlant(AP);

  const mbody = document.getElementById('mbody');
  const MHE_SHORT = ['ינו','פבר','מרץ','אפר','מאי','יוני','יולי','אוג','ספט','אוק','נוב','דצמ'];

  function monthPicker(field, selected, label) {
    return `<label class="edit-field-label">${label}</label>
    <div class="edit-months" id="emp-${field}">
      ${MHE_SHORT.map((m, i) => `<button class="edit-month-chip ${selected.includes(i+1)?'sel':''}" 
        onclick="toggleEditMonth('${field}',${i+1},this)">${m}</button>`).join('')}
    </div>`;
  }

  mbody.innerHTML = `
    <div style="padding:6px 0 14px">
      <label class="edit-field-label">שם הצמח</label>
      <input class="edit-field" id="ef-name" value="${AP.name}">
      
      <label class="edit-field-label">תיאור / סוג</label>
      <input class="edit-field" id="ef-lbl" value="${AP.lbl||''}">

      <label class="edit-field-label">אמוג'י</label>
      <input class="edit-field" id="ef-e" value="${AP.e||''}" style="width:80px">

      <label class="edit-field-label">קומה / מיקום</label>
      <select class="edit-field" id="ef-floor">
        <option ${AP.floor==='קומה עליונה'?'selected':''}>קומה עליונה</option>
        <option ${AP.floor==='קומה תחתונה'?'selected':''}>קומה תחתונה</option>
        <option ${AP.floor==='נספחים'?'selected':''}>נספחים</option>
      </select>

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">✂️ גיזום</div>
      
      <label class="edit-field-label">זמן גיזום</label>
      <input class="edit-field" id="ef-prune" value="${AP.prune||''}">

      <label class="edit-field-label">עוצמת גיזום</label>
      <select class="edit-field" id="ef-pi">
        ${['קל מאוד','קל','בינוני','קשה','קשה מאוד'].map(v=>`<option ${AP.pi===v?'selected':''}>${v}</option>`).join('')}
      </select>

      <label class="edit-field-label">שיטת גיזום</label>
      <textarea class="edit-field" id="ef-pmth" rows="2">${AP.pmth||''}</textarea>

      ${monthPicker('pm', AP.pm, 'חודשי גיזום')}

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">🌱 דישון</div>

      <label class="edit-field-label">סוג דשן</label>
      <textarea class="edit-field" id="ef-fert" rows="2">${AP.fert||''}</textarea>

      ${monthPicker('fm', AP.fm, 'חודשי דישון')}

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">💧 תוספים</div>

      <label class="edit-field-label">תוסף</label>
      <input class="edit-field" id="ef-supp" value="${AP.supp||''}">

      ${monthPicker('sm', AP.sm, 'חודשי תוסף')}

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>

      <label class="edit-field-label">כללים חשובים</label>
      <textarea class="edit-field" id="ef-rules" rows="2">${AP.rules||''}</textarea>

      <label class="edit-field-label">אזהרה קריטית</label>
      <textarea class="edit-field" id="ef-crit" rows="2">${AP.crit||''}</textarea>

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">💧 השקייה</div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div>
          <label class="edit-field-label">☀️ קיץ (ליטר/שבוע)</label>
          <input class="edit-field" type="number" id="ef-waterSummer" value="${AP.waterSummer||''}" min="0" max="500">
        </div>
        <div>
          <label class="edit-field-label">❄️ חורף (ליטר/שבוע)</label>
          <input class="edit-field" type="number" id="ef-waterWinter" value="${AP.waterWinter||''}" min="0" max="500">
        </div>
      </div>

      <label class="edit-field-label">🌊 אופי השקייה</label>
      <select class="edit-field" id="ef-waterType">
        <option value="">לא מוגדר</option>
        <option ${AP.waterType==='עמוקה'?'selected':''}>עמוקה</option>
        <option ${AP.waterType==='רדודה'?'selected':''}>רדודה</option>
      </select>

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">🌡️ עונות</div>

      <label class="edit-field-label">❄️ חורף – תיאור</label>
      <textarea class="edit-field" id="ef-winter" rows="2">${AP.winter||''}</textarea>

      <label class="edit-field-label">☀️ קיץ – תיאור</label>
      <textarea class="edit-field" id="ef-summer" rows="2">${AP.summer||''}</textarea>

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">📏 שלבי גדילה</div>

      <label class="edit-field-label">🌱 שתיל קטן</label>
      <input class="edit-field" id="ef-sz-small" value="${AP.sizes?.small||''}">

      <label class="edit-field-label">🌿 גדילה בינונית</label>
      <input class="edit-field" id="ef-sz-medium" value="${AP.sizes?.medium||''}">

      <label class="edit-field-label">🌳 עץ בוגר</label>
      <input class="edit-field" id="ef-sz-large" value="${AP.sizes?.large||''}">

      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">🌿 תנאי גידול</div>

      <label class="edit-field-label">☀️ תנאי אור (ראשי)</label>
      <select class="edit-field" id="ef-light">
        <option value="">לא מוגדר</option>
        ${['שמש מלאה','חצי שמש','צל'].map(v=>`<option ${AP.light===v?'selected':''}>${v}</option>`).join('')}
      </select>

      <label class="edit-field-label">⛅ תנאי אור נוספים (אופציונלי)</label>
      <select class="edit-field" id="ef-lightAlt">
        <option value="">ללא</option>
        ${['שמש מלאה','חצי שמש','צל'].map(v=>`<option ${AP.lightAlt===v?'selected':''}>${v}</option>`).join('')}
      </select>

      <label class="edit-field-label">🌡️ עמידות אקלימית</label>
      <div style="display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap">
        <label style="display:flex;align-items:center;gap:6px;font-size:0.83rem;cursor:pointer">
          <input type="checkbox" id="ef-cold" ${(AP.climate||[]).includes('עמיד לקור')?'checked':''} style="width:16px;height:16px;accent-color:var(--g3)"> 🧊 עמיד לקור
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:0.83rem;cursor:pointer">
          <input type="checkbox" id="ef-heat" ${(AP.climate||[]).includes('עמיד לשרב')?'checked':''} style="width:16px;height:16px;accent-color:var(--g3)"> 🔥 עמיד לשרב
        </label>
      </div>

      <label class="edit-field-label">🏠 גידול בבית</label>
      <select class="edit-field" id="ef-indoor">
        <option value="false" ${!AP.indoor?'selected':''}>לא – גינה בלבד</option>
        <option value="true" ${AP.indoor?'selected':''}>כן – מתאים לבית</option>
      </select>

      <label class="edit-field-label">📍 התאמה גיאוגרפית</label>
      <textarea class="edit-field" id="ef-geo" rows="2">${AP.geo||''}</textarea>

      <div id="ef-harvest-section" style="${AP.type==='fruit'?'':'display:none'}">
      <div style="border-top:1px solid var(--g7);margin:14px 0 12px"></div>
      <div style="font-size:0.78rem;font-weight:800;color:var(--g3);margin-bottom:10px">🍎 עונת קטיף</div>
      ${monthPicker('harvestMonths', AP.harvestMonths||[], 'חודשי קטיף')}
      </div>

      <div class="edit-save-row">
        <button class="edit-save-btn" onclick="saveEditedPlant()">💾 שמור שינויים</button>
        <button class="edit-cancel-btn" onclick="toggleEditMode()">ביטול</button>
      </div>
    </div>`;
}

function toggleEditMonth(field, month, btn) {
  if (!AP) return;
  if (!AP[field]) AP[field] = [];
  const arr = AP[field];
  const idx = arr.indexOf(month);
  if (idx >= 0) { arr.splice(idx, 1); btn.classList.remove('sel'); }
  else { arr.push(month); arr.sort((a,b)=>a-b); btn.classList.add('sel'); }
}

// saveEditedPlant replaced by patched version below


function buildModalBody() {
  if (!AP) return;
  let b = '';
  const isFruit = AP.type === 'fruit';

  // --- תנאי אור, אקלים, גידול בבית ---
  const lightArr = [AP.light, AP.lightAlt].filter(Boolean);
  const climateArr = Array.isArray(AP.climate) ? AP.climate : (AP.climate ? [AP.climate] : []);
  const lightIcons = {'שמש מלאה':'☀️','חצי שמש':'⛅','צל':'🌥️'};
  const climateIcons = {'עמיד לקור':'🧊','עמיד לשרב':'🔥'};

  if (lightArr.length || climateArr.length || AP.indoor != null) {
    b += `<div class="msec"><div class="msec-ttl">🌿 תנאי גידול</div>`;
    if (lightArr.length) {
      b += `<div class="irow"><span>☀️</span><span class="ilabel">אור:</span><span class="ival">
        <span class="info-tags">${lightArr.map(l=>`<span class="itag light">${lightIcons[l]||'☀️'} ${l}</span>`).join('')}</span>
      </span></div>`;
    }
    if (climateArr.length) {
      b += `<div class="irow"><span>🌡️</span><span class="ilabel">עמידות:</span><span class="ival">
        <span class="info-tags">${climateArr.map(c=>`<span class="itag climate">${climateIcons[c]||'🌡️'} ${c}</span>`).join('')}</span>
      </span></div>`;
    }
    if (AP.indoor != null) {
      b += `<div class="irow"><span>🏠</span><span class="ilabel">בבית:</span><span class="ival">
        <span class="itag ${AP.indoor?'indoor':'outdoor'}">${AP.indoor?'✅ מתאים לגידול בבית':'🌳 גינה בלבד'}</span>
      </span></div>`;
    }
    b += `</div>`;
  }

  // --- התאמה גיאוגרפית ---
  if (AP.geo) {
    b += `<div class="msec"><div class="msec-ttl">📍 התאמה גיאוגרפית</div>
    <div class="geo-box">🗺️ ${AP.geo}</div></div>`;
  }

  // --- זמן הוצאת פירות (עצי פרי בלבד) ---
  if (isFruit && AP.harvestMonths?.length) {
    const chips = MHE.map((m,i) => {
      const active = AP.harvestMonths.includes(i+1);
      const isCur = (i+1) === CUR;
      return active ? `<span class="hm-chip${isCur?' cur':''}">${m}</span>` : '';
    }).join('');
    b += `<div class="msec"><div class="msec-ttl">🍎 עונת קטיף</div>
    <div class="harvest-months">${chips}</div></div>`;
  }

  // --- השקייה ---
  const hasSummer = AP.waterSummer != null;
  const hasWinter = AP.waterWinter != null;
  if (hasSummer || hasWinter || AP.waterType) {
    const typeLabel = AP.waterType === 'עמוקה'
      ? '🪣 עמוקה (השקייה ארוכה ורצופה)'
      : AP.waterType === 'רדודה'
      ? '🚿 רדודה (השקיות קצרות ותכופות)'
      : AP.waterType || '';
    b += `<div class="msec"><div class="msec-ttl">💧 השקייה</div>
    ${hasSummer ? `<div class="irow"><span>☀️</span><span class="ilabel">קיץ:</span><span class="ival"><strong>${AP.waterSummer} ליטר</strong> לשבוע</span></div>` : ''}
    ${hasWinter ? `<div class="irow"><span>❄️</span><span class="ilabel">חורף:</span><span class="ival"><strong>${AP.waterWinter} ליטר</strong> לשבוע</span></div>` : ''}
    ${typeLabel ? `<div class="irow"><span>🌊</span><span class="ilabel">אופי:</span><span class="ival">${typeLabel}</span></div>` : ''}
    </div>`;
  }

  if(AP.prune||AP.pmth){
    b+=`<div class="msec"><div class="msec-ttl">✂️ גיזום</div>
    ${AP.prune?`<div class="irow"><span>📅</span><span class="ilabel">זמן:</span><span class="ival">${AP.prune}</span></div>`:''}
    ${AP.pi?`<div class="irow"><span>💪</span><span class="ilabel">עוצמה:</span><span class="ival">${AP.pi}</span></div>`:''}
    ${AP.pmth?`<div class="irow"><span>🪚</span><span class="ilabel">שיטה:</span><span class="ival">${AP.pmth}</span></div>`:''}
    </div>`;
  }
  if(AP.fert){
    b+=`<div class="msec"><div class="msec-ttl">🌱 דישון</div>
    <div class="irow"><span>🧪</span><span class="ilabel">סוג:</span><span class="ival">${AP.fert}</span></div>
    ${AP.fm.length?`<div class="irow"><span>📅</span><span class="ilabel">חודשים:</span><span class="ival">${AP.fm.map(m=>MHE[m-1]).join(', ')}</span></div>`:''}
    </div>`;
  }
  if(AP.supp){
    b+=`<div class="msec"><div class="msec-ttl">💧 תוספים</div>
    <div class="irow"><span>🧴</span><span class="ilabel">תוסף:</span><span class="ival">${AP.supp}</span></div>
    ${AP.sm.length?`<div class="irow"><span>📅</span><span class="ilabel">חודשים:</span><span class="ival">${AP.sm.map(m=>MHE[m-1]).join(', ')}</span></div>`:''}
    </div>`;
  }
  if(AP.rules) b+=`<div class="msec"><div class="msec-ttl">📋 כללים</div><div class="nbox">${AP.rules}</div></div>`;
  if(AP.crit)  b+=`<div class="cbox">⚠️ <strong>קריטי:</strong> ${AP.crit}</div>`;
  const allM=new Set([...AP.pm,...AP.fm,...AP.sm]);
  if(allM.size){
    b+=`<div class="msec" style="margin-top:18px"><div class="msec-ttl">📅 לוח שנה שנתי</div>
    <div class="cal-grid">${MHE.map((m,i)=>{
      const t=[];
      if(AP.pm.includes(i+1)) t.push('✂️');
      if(AP.fm.includes(i+1)) t.push('🌱');
      if(AP.sm.includes(i+1)) t.push('💧');
      const now=i+1===CUR;
      return `<div class="cal-cell ${t.length?'has':''} ${now?'now':''}"><span class="cm">${m}</span><span>${t.join('')||'–'}</span></div>`;
    }).join('')}</div></div>`;
  }
  document.getElementById('mbody').innerHTML = b;

  // Inject age section
  const isTree = (AP.type==='fruit'||AP.type==='tropical'||AP.type==='ornamental');
  const ageDateVal = plantingDates[AP.id];
  const ageStr = formatAge(ageDateVal);
  const orla = isTree ? getOrlaInfo(ageDateVal) : null;
  const ageSection = document.createElement('div');
  ageSection.id = `age-section-${AP.id}`;
  ageSection.style.cssText = 'padding:12px 20px 0;';
  ageSection.innerHTML = `
    <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:4px">
      <span class="age-badge" id="age-badge-${AP.id}" onclick="openAgeEditor(${AP.id})" style="opacity:${ageStr?1:0.6}">
        🌱 ${ageStr ? 'גיל: '+ageStr : 'הוסף תאריך שתילה'}
      </span>
      ${isTree ? `<span class="age-badge orla-badge${orla?.cleared?' done':''}" id="orla-badge-${AP.id}" style="display:${ageDateVal?'inline-flex':'none'}" onclick="openAgeEditor(${AP.id})">
        ${orla?.cleared ? '✅ ערלה הסתיימה' : ageDateVal ? `⏳ ערלה נגמרת ${new Date(new Date(ageDateVal).setFullYear(new Date(ageDateVal).getFullYear()+4)).getFullYear()}` : ''}
      </span>` : ''}
    </div>`;
  document.getElementById('mbody').prepend(ageSection);
}

function confirmResetPlant() {
  if (!AP) return;
  const orig = P_ORIGINALS[AP.id];
  if (!orig) { showToast('ℹ️ אין גרסה קודמת לשחזר'); return; }
  if (!confirm(`לשחזר את "${AP.name}" למצב הראשוני?\nכל השינויים יאבדו.`)) return;
  Object.assign(AP, JSON.parse(JSON.stringify(orig)));
  const idx = P.findIndex(x => x.id === AP.id);
  if (idx >= 0) P[idx] = AP;
  EDIT_MODE = false;
  updCounts();
  renderAlerts();
  render();
  openM(AP.id);
 showToast('↺ הצמח שוחזר למצב הראשוני');
}

boot();

