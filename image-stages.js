(function () {
  var VERSION = 'no-floors-ui-20260604';

  function installCss() {
    if (document.getElementById('modal-only-photo-strip-css')) return;
    var style = document.createElement('style');
    style.id = 'modal-only-photo-strip-css';
    style.textContent = [
      '.alerts-bar{display:none!important}',
      '.floor-hdr,#floor-toggle{display:none!important}',
      '#mPhotos,.modal .m-photos{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}',
      '#mPhotos *{display:none!important}',
      '.modal .m-info{padding-top:28px!important}',
      '.m-slot,.m-slot-bg,.m-slot-real,.m-slot-loading,.m-slot-lbl,.slot-edit-btn{display:none!important}'
    ].join('');
    document.head.appendChild(style);
  }

  function disableFloors() {
    try { SHOW_FLOORS = false; } catch (e) {}
    var toggle = document.getElementById('floor-toggle');
    if (toggle) toggle.style.display = 'none';
    document.querySelectorAll('.floor-hdr').forEach(function (node) {
      node.style.display = 'none';
    });
  }

  function stripModalFloor() {
    var sub = document.getElementById('ms');
    if (!sub) return;
    var text = String(sub.textContent || '');
    sub.textContent = text.split('·')[0].split('Â·')[0].trim();
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

  function patchRender() {
    if (window.__noFloorsRenderPatch) return;
    var oldRender = window.render;
    if (typeof oldRender !== 'function') return;
    window.__noFloorsRenderPatch = true;
    window.render = function () {
      disableFloors();
      var result = oldRender.apply(this, arguments);
      disableFloors();
      return result;
    };
  }

  function patchOpenModal() {
    if (window.__modalOnlyNoPhotoOpenM) return;
    var old = window.openM;
    if (typeof old !== 'function') return;
    window.__modalOnlyNoPhotoOpenM = true;
    window.openM = function () {
      var result = old.apply(this, arguments);
      hideModalPhotos();
      stripModalFloor();
      setTimeout(hideModalPhotos, 0);
      setTimeout(stripModalFloor, 0);
      setTimeout(hideModalPhotos, 80);
      setTimeout(stripModalFloor, 80);
      setTimeout(hideModalPhotos, 700);
      setTimeout(stripModalFloor, 700);
      if (result && typeof result.then === 'function') {
        result.then(function () { hideModalPhotos(); stripModalFloor(); }).catch(function () {});
      }
      return result;
    };
  }

  function boot() {
    installCss();
    disableFloors();
    patchRender();
    hideModalPhotos();
    stripModalFloor();
    patchOpenModal();
    try { if (typeof render === 'function') render(); } catch (e) {}
    setInterval(function () {
      disableFloors();
      patchRender();
      patchOpenModal();
      hideModalPhotos();
      stripModalFloor();
    }, 1500);
    window.__modalOnlyPhotoStripVersion = VERSION;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();