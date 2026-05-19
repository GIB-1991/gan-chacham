(function () {
  var VERSION = 'no-modal-photo-logos-20260519';

  function installCss() {
    if (document.getElementById('photo-force-css')) return;
    var style = document.createElement('style');
    style.id = 'photo-force-css';
    style.textContent = [
      '.card-img .plant-emoji-big,.card-img .img-bg,.card-img .size-tabs{display:none!important}',
      '.card-img{background:#e6eddf!important}',
      '.real-photo.show{opacity:1!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function hideModalPhotos() {
    var box = document.getElementById('mPhotos');
    if (!box) return;
    box.innerHTML = '';
    box.className = 'm-photos modal-photos-removed';
    box.setAttribute('aria-hidden', 'true');
    box.style.display = 'none';
    box.style.height = '0';
    box.style.minHeight = '0';
    box.style.margin = '0';
    box.style.padding = '0';
    box.style.border = '0';
    box.style.overflow = 'hidden';
  }

  function patchOpenModal() {
    if (window.__photoForceOpenM) return;
    var old = window.openM;
    if (typeof old !== 'function') return;
    window.__photoForceOpenM = true;
    window.openM = function () {
      var result = old.apply(this, arguments);
      hideModalPhotos();
      setTimeout(hideModalPhotos, 0);
      setTimeout(hideModalPhotos, 80);
      setTimeout(hideModalPhotos, 700);
      if (result && typeof result.then === 'function') result.then(hideModalPhotos).catch(function () {});
      return result;
    };
  }

  function boot() {
    installCss();
    hideModalPhotos();
    patchOpenModal();
    setInterval(function () {
      patchOpenModal();
      hideModalPhotos();
    }, 1500);
    window.__photoForceVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();