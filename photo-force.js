(function(){
  var VERSION='no-photo-overwrite-20260517';

  function installCss(){
    if(document.getElementById('photo-force-css'))return;
    var style=document.createElement('style');
    style.id='photo-force-css';
    style.textContent='.real-photo.show,.m-slot-real.show{opacity:1!important}.card-img:has(.real-photo.show) .plant-emoji-big,.m-slot:has(.m-slot-real.show) .slot-emoji{display:none!important}.m-photos.stage-gallery{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}@media(max-width:768px){.m-photos.stage-gallery{grid-template-columns:1fr!important;height:auto!important}.m-photos.stage-gallery .m-slot{height:190px!important}}';
    document.head.appendChild(style);
  }

  function labelModal(){
    var photos=document.getElementById('mPhotos');
    if(photos)photos.classList.add('stage-gallery');
    var labels={small:'צמח צעיר',medium:'בן 3-4',large:'צמח בוגר'};
    ['small','medium','large'].forEach(function(stage){
      var slot=document.getElementById('mslot-'+stage);
      var label=slot&&slot.querySelector('.m-slot-lbl');
      if(!label)return;
      var old=label.querySelector('small');
      label.innerHTML=labels[stage]+(old?'<br><small>'+old.textContent+'</small>':'');
    });
  }

  function patchOpenModal(){
    if(window.__photoForceOpenM)return;
    var old=window.openM;
    if(typeof old!=='function')return;
    window.__photoForceOpenM=true;
    window.openM=function(){
      var result=old.apply(this,arguments);
      setTimeout(labelModal,80);
      setTimeout(labelModal,700);
      return result;
    };
  }

  function boot(){
    installCss();
    labelModal();
    patchOpenModal();
    setInterval(function(){patchOpenModal();labelModal();},1500);
    window.__photoForceVersion=VERSION;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();