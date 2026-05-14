(function () {
  var VERSION = 'force-real-photos-20260514';
  var MAP = {
    'ערבה בוכיה':'weeping willow tree','שסק':'loquat tree','מנגו':'mango tree','תאנה':'fig tree','שמיר':'dill plant',
    'לימון':'lemon tree','לימון ננסי':'lemon tree','ליים':'lime tree','תפוז':'orange tree','תפוז טבורי':'orange tree',
    'אשכולית':'grapefruit tree','קלמנטינה':'clementine tree','פומלה':'pomelo tree','אבוקדו':'avocado tree','רימון':'pomegranate tree',
    'זית':'olive tree','ענב':'grape vine','ענבים':'grape vine','קיווי':'kiwi vine','פסיפלורה':'passion fruit vine','פשיפלורה':'passion fruit vine',
    'נענע':'mint plant','בזיליקום':'basil plant','רוזמרין':'rosemary plant','מרווה':'sage plant','לואיזה':'lemon verbena plant','זוטה לבנה':'micromeria plant',
    'תימין':'thyme plant','אורגנו':'oregano plant','פטרוזיליה':'parsley plant','כוסברה':'coriander plant','עירית':'chives plant',
    'לבנדר':'lavender plant','ורד':'rose bush','בוגנוויליה':'bougainvillea plant','יסמין':'jasmine plant','גרניום':'geranium plant',
    'בננה':'banana plant','תמר':'date palm','חרוב':'carob tree','שקד':'almond tree','שזיף':'plum tree','אפרסק':'peach tree','משמש':'apricot tree',
    'תפוח':'apple tree','אגס':'pear tree','תות שדה':'strawberry plant','פטל':'raspberry bush','אוכמניות':'blueberry bush','סברס':'prickly pear cactus',
    'אורן ירושלים':'aleppo pine tree','ברוש':'cypress tree','ברוש מצוי':'cypress tree','אקליפטוס':'eucalyptus tree','הדס':'myrtle plant',
    'יוקה':'yucca plant','אלוורה':'aloe vera plant','מונסטרה':'monstera plant','סנסיווריה':'snake plant','סחלב':'orchid plant',
    'רקפת':'cyclamen plant','כלנית':'anemone flower','נרקיס':'narcissus flower','צבעוני':'tulip flower','חמניה':'sunflower plant',
    'לנטנה':'lantana plant','פטוניה':'petunia plant','שעועית':'bean plant','כרישה':'leek plant','מלפפון':'cucumber plant','עגבנייה':'tomato plant',
    'פלפל':'pepper plant','חציל':'eggplant plant','חסה':'lettuce plant','קישוא':'zucchini plant','אבטיח':'watermelon plant','מלון':'melon plant',
    'פאפאיה':'papaya tree','אננס':'pineapple plant','קוקוס':'coconut palm','תפוח אדמה':'potato plant','בטטה':'sweet potato plant','גזר':'carrot plant',
    'בצל':'onion plant','שום':'garlic plant','כרוב':'cabbage plant','ברוקולי':'broccoli plant','כרובית':'cauliflower plant','סלרי':'celery plant'
  };

  function hash(text) {
    var h = 2166136261;
    text = String(text || '');
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }

  function queryFor(name, stage) {
    var base = MAP[name] || 'garden plant';
    if (stage === 'small') return base + ' sapling seedling young';
    if (stage === 'large') return base + ' mature large full grown';
    return base + ' young garden';
  }

  function photoUrl(name, stage) {
    var query = queryFor(name, stage).split(/\s+/).filter(Boolean).slice(0, 6).join(',');
    var lock = hash(name + '-' + stage + '-' + VERSION) % 999999;
    return 'https://loremflickr.com/1200/800/' + encodeURIComponent(query) + '?lock=' + lock;
  }

  function applyBackground(holder, name, stage) {
    if (!holder || !name) return;
    var url = photoUrl(name, stage || 'medium');
    holder.style.backgroundImage = 'linear-gradient(rgba(0,0,0,.02),rgba(0,0,0,.02)), url("' + url + '")';
    holder.style.backgroundSize = 'cover';
    holder.style.backgroundPosition = 'center';
    holder.style.backgroundRepeat = 'no-repeat';
    var emoji = holder.querySelector('.plant-emoji-big,.slot-emoji');
    if (emoji) emoji.style.display = 'none';
  }

  function forceCard(card) {
    if (!card || card.getAttribute('data-photo-force') === VERSION) return;
    var nameEl = card.querySelector('.card-name');
    var name = nameEl ? nameEl.textContent.trim() : '';
    var bg = card.querySelector('.img-bg');
    var img = card.querySelector('img.real-photo');
    if (!name || !bg) return;
    card.setAttribute('data-photo-force', VERSION);
    applyBackground(bg, name, 'medium');
    if (img) {
      img.src = photoUrl(name, 'medium');
      img.onload = function () { img.classList.add('show'); };
      img.onerror = function () { img.classList.remove('show'); };
    }
  }

  function forceCards() {
    var cards = document.querySelectorAll('.card[id^="card-"]');
    for (var i = 0; i < cards.length; i++) forceCard(cards[i]);
  }

  function forceModal() {
    var nameEl = document.getElementById('mt');
    var name = nameEl ? nameEl.textContent.trim() : '';
    if (!name) return;
    var stages = ['small','medium','large'];
    for (var i = 0; i < stages.length; i++) {
      var stage = stages[i];
      var slot = document.getElementById('mslot-' + stage);
      var bg = slot ? slot.querySelector('.m-slot-bg') : null;
      var img = document.getElementById('mimg-' + stage);
      applyBackground(bg, name, stage);
      if (img) {
        img.src = photoUrl(name, stage);
        img.onload = (function (el) { return function () { el.classList.add('show'); }; })(img);
        img.onerror = (function (el) { return function () { el.classList.remove('show'); }; })(img);
      }
    }
  }

  function installCss() {
    if (document.getElementById('photo-force-css')) return;
    var style = document.createElement('style');
    style.id = 'photo-force-css';
    style.textContent = '.card-img .img-bg{background-size:cover!important;background-position:center!important}.card-img .plant-emoji-big{display:none!important}.m-slot-bg{background-size:cover!important;background-position:center!important}.m-slot-bg .slot-emoji{display:none!important}.real-photo.show{opacity:1!important}.m-slot-real.show{opacity:1!important}';
    document.head.appendChild(style);
  }

  function boot() {
    installCss();
    forceCards();
    forceModal();
    setInterval(forceCards, 1200);
    var pa = document.getElementById('pa');
    if (pa && window.MutationObserver) {
      new MutationObserver(function () { setTimeout(forceCards, 80); }).observe(pa, { childList: true, subtree: true });
    }
    var overlay = document.getElementById('overlay');
    if (overlay && window.MutationObserver) {
      new MutationObserver(function () { setTimeout(forceModal, 80); }).observe(overlay, { attributes: true, childList: true, subtree: true });
    }
    var oldOpen = window.openM;
    if (typeof oldOpen === 'function' && !window.__photoForceOpenM) {
      window.__photoForceOpenM = true;
      window.openM = function () {
        var result = oldOpen.apply(this, arguments);
        setTimeout(forceModal, 120);
        setTimeout(forceModal, 800);
        return result;
      };
    }
    window.__photoForceVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
