(function () {
  var VERSION = 'modal-only-no-photo-strip-20260521';

  function installCss() {
    if (document.getElementById('modal-only-photo-strip-css')) return;
    var style = document.createElement('style');
    style.id = 'modal-only-photo-strip-css';
    style.textContent = [
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}',
      '.modal .m-info{padding-top:28px!important}',
      '.m-slot,.m-slot-bg,.m-slot-real,.m-slot-loading,.m-slot-lbl,.slot-edit-btn{display:none!important}'
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
    if (window.__modalOnlyNoPhotoOpenM) return;
    var old = window.openM;
    if (typeof old !== 'function') return;
    window.__modalOnlyNoPhotoOpenM = true;
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
    window.__modalOnlyPhotoStripVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();