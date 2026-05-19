(function () {
  var VERSION = 'single-plant-photo-20260519';
  var OV = {
    'ערבה בוכיה':'Salix babylonica tree','ערבה בוכייה':'Salix babylonica tree','מנגו':'Mangifera indica tree','תאנה':'Ficus carica tree','שמיר':'Anethum graveolens plant','שסק':'Eriobotrya japonica tree',
    'לימון':'Citrus limon tree','לימון ננסי':'Citrus limon tree','ליים':'Citrus aurantiifolia tree','תפוז':'Citrus sinensis tree','תפוז טבורי':'Citrus sinensis tree','אשכולית':'Citrus paradisi tree','קלמנטינה':'Citrus clementina tree','פומלה':'Citrus maxima tree',
    'אבוקדו':'Persea americana tree','רימון':'Punica granatum tree','זית':'Olea europaea tree','פפאיה':'Carica papaya tree','בננה':'Musa plant','תמר':'Phoenix dactylifera palm','חרוב':'Ceratonia siliqua tree',
    'שקד':'Prunus dulcis tree','שזיף':'Prunus domestica tree','משמש':'Prunus armeniaca tree','אפרסק':'Prunus persica tree','תפוח':'Malus domestica tree','אגס':'Pyrus communis tree',
    'ענב':'Vitis vinifera vine','ענבים':'Vitis vinifera vine','פסיפלורה':'Passiflora edulis vine','קיווי':'Actinidia deliciosa vine','תות שדה':'Fragaria ananassa plant','פטל':'Rubus idaeus plant','אוכמניות':'Vaccinium corymbosum bush',
    'נענע':'Mentha plant','בזיליקום':'Ocimum basilicum plant','רוזמרין':'Salvia rosmarinus plant','לבנדר':'Lavandula plant','מרווה':'Salvia officinalis plant','לואיזה':'Aloysia citrodora plant',
    'אורן ירושלים':'Pinus halepensis tree','ברוש':'Cupressus sempervirens tree','אקליפטוס':'Eucalyptus tree','יוקה':'Yucca plant','אלוורה':'Aloe vera plant','מונסטרה':'Monstera deliciosa plant',
    'כלנית':'Anemone coronaria plant','נרקיס':'Narcissus plant','חמניה':'Helianthus annuus plant','עגבנייה':'Solanum lycopersicum plant','מלפפון':'Cucumis sativus plant','פלפל':'Capsicum annuum plant','חציל':'Solanum melongena plant'
  };
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol|\.svg/i;
  var BAD_TEXT = /logo|icon|map|diagram|drawing|illustration|symbol|fruit only|isolated|slice|sliced|peeled|market|basket|juice|dish|food|seed packet|herbarium|specimen|scan|person|people|man|woman|child|street|building|statue|sculpture|monument|cat|kitten/i;
  var GOOD_TEXT = /tree|plant|leaf|leaves|foliage|branch|branches|trunk|habit|habitus|orchard|garden|sapling|seedling|shrub|bush|vine|palm|cactus|flowering|bloom|field/i;

  function plants(){try{return typeof P !== 'undefined' && Array.isArray(P) ? P : []}catch(e){return []}}
  function byId(id){return plants().find(function(p){return String(p.id)===String(id)})||null}
  function wi(name){try{return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES && WIKI_PAGES[name] ? WIKI_PAGES[name] : {}}catch(e){return {}}}
  function clean(v){return String(v||'').replace(/\([^)]*\)/g,' ').replace(/[^a-zA-Z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
  function safe(url){url=String(url||'');return /^https:\/\/upload\.wikimedia\.org\//i.test(url) && !BAD_URL.test(url)}
  function baseName(p){var n=p&&p.name||'';return OV[n] || (wi(n).page ? clean(wi(n).page)+' plant tree' : clean(n)+' plant tree')}
  function query(p){return (baseName(p)+' leaves foliage habit garden').trim()}
  function okHit(hit,q){
    var text=((hit&&hit.title)||'')+' '+((hit&&hit.snippet)||'')+' '+q;
    return !BAD_TEXT.test(text) && GOOD_TEXT.test(text);
  }
  async function json(url){var r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(r.status);return r.json()}
  async function commons(p){
    var key='single_photo_'+VERSION+'_'+(p&&p.name||'plant');
    try{if(typeof imgCache!=='undefined' && safe(imgCache[key]))return imgCache[key]}catch(e){}
    var q=query(p);
    try{
      var s=await json('https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=24&srsearch='+encodeURIComponent(q)+'&format=json&origin=*');
      var hits=(s.query&&s.query.search||[]).filter(function(h){return okHit(h,q)}).slice(0,10);
      for(var i=0;i<hits.length;i++){
        var title=hits[i].title&&hits[i].title.indexOf('File:')===0?hits[i].title:'File:'+hits[i].title;
        var d=await json('https://commons.wikimedia.org/w/api.php?action=query&titles='+encodeURIComponent(title)+'&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*');
        var obj=Object.values(d.query&&d.query.pages||{})[0], info=obj&&obj.imageinfo&&obj.imageinfo[0], url=info&&(info.thumburl||info.url);
        if(/^image\/(jpeg|png|webp)/i.test(info&&info.mime||'') && safe(url)){
          try{if(typeof imgCache!=='undefined')imgCache[key]=url}catch(e){}
          return url;
        }
      }
    }catch(e){}
    return null;
  }
  async function wiki(p){
    var pg=clean(baseName(p).replace(/\s+(tree|plant|vine|palm|bush)$/i,'')), key='single_wiki_'+VERSION+'_'+pg;
    try{if(typeof imgCache!=='undefined' && imgCache[key]!==undefined)return imgCache[key]}catch(e){}
    var url=null;
    try{
      var d=await json('https://en.wikipedia.org/w/api.php?action=query&titles='+encodeURIComponent(pg)+'&prop=pageimages&pithumbsize=1200&format=json&origin=*');
      var obj=Object.values(d.query&&d.query.pages||{})[0], cand=obj&&obj.thumbnail&&obj.thumbnail.source;
      if(safe(cand))url=cand;
    }catch(e){}
    try{if(typeof imgCache!=='undefined')imgCache[key]=url}catch(e){}
    return url;
  }
  function noPhoto(p){var name=(p&&p.name)||'צמח';return '<div class="single-photo-empty"><div>'+name+'</div><small>לא נמצאה תמונת צמח מתאימה</small></div>'}
  function cleanCache(){
    try{if(typeof imgCache!=='undefined')Object.keys(imgCache).forEach(function(k){var v=imgCache[k];if(!v||BAD_URL.test(String(v))||/__(small|medium|large)$/.test(k)||/^resolved_|^commons_|^wc__|^wp__|safe_tree_|safe_wp_|single_photo_|single_wiki_|real-photo-fallbacks|botanical-photos|force-real-photos/.test(k))delete imgCache[k]})}catch(e){}
    try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i), v=localStorage.getItem(k);if(v&&BAD_URL.test(v)&&/image|photo|img|gan_chacham_local_images/i.test(k))localStorage.removeItem(k)}}catch(e){}
  }
  async function resolve(p){
    var customKey=p?'custom_'+p.id+'_medium':null, directKey=p?p.name+'__medium':null;
    try{var custom=customKey&&typeof imgCache!=='undefined'?imgCache[customKey]:null;if(safe(custom))return custom;if(custom&&typeof imgCache!=='undefined')delete imgCache[customKey];if(directKey&&typeof imgCache!=='undefined')delete imgCache[directKey]}catch(e){}
    var url=await commons(p) || await wiki(p);
    try{if(typeof imgCache!=='undefined'&&directKey)imgCache[directKey]=url}catch(e){}
    return url;
  }
  function show(img,url){if(!img)return;img.classList.remove('show');if(!url){img.removeAttribute('src');return}img.onload=function(){img.classList.add('show')};img.onerror=function(){img.classList.remove('show')};img.src=url;if(img.complete&&img.naturalWidth>0)img.classList.add('show')}
  function css(){if(document.getElementById('single-plant-photo-css'))return;var s=document.createElement('style');s.id='single-plant-photo-css';s.textContent='.real-photo.show,.m-single-photo-img.show{opacity:1!important}.card-img:has(.real-photo.show) .plant-emoji-big{display:none!important}.m-photos.single-photo{height:320px!important;display:block!important;background:#dfe8d5!important;overflow:hidden}.m-photos.single-photo .m-slot{display:none!important}.m-single-photo-wrap{position:relative;width:100%;height:100%;background:#dfe8d5}.m-single-photo-img{width:100%;height:100%;object-fit:cover;opacity:0;transition:opacity .25s}.single-photo-empty{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#dfe8d5;color:#214d30;font-weight:800;font-size:1.35rem}.single-photo-empty small{font-size:.85rem;color:#60705f;margin-top:6px}.m-single-photo-title{position:absolute;right:0;left:0;bottom:0;padding:14px 18px;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.72));color:white;font-weight:800;font-size:1rem;text-align:right}@media(max-width:768px){.m-photos.single-photo{height:220px!important}}';document.head.appendChild(s)}
  async function repairCard(id){var p=byId(id), img=document.getElementById('cimg-'+id), l=document.getElementById('cload-'+id);if(!p||!img)return;if(l)l.classList.add('show');var url=await resolve(p);if(l)l.classList.remove('show');show(img,url)}
  function repairCards(){document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function(img){repairCard(img.id.replace('cimg-',''))})}
  async function repairModal(p){
    if(!p)return;
    var box=document.getElementById('mPhotos');if(!box)return;
    box.className='m-photos single-photo';
    box.innerHTML='<div class="m-single-photo-wrap"><img class="m-single-photo-img" id="mimg-single" alt=""><div class="m-single-photo-title">'+p.name+'</div></div>';
    var url=await resolve(p), img=document.getElementById('mimg-single');
    if(url)show(img,url);else box.innerHTML=noPhoto(p);
  }
  function patch(){
    window.fetchWikiImg=function(name){return resolve(plants().find(function(p){return p.name===name})||{name:name})};
    window.tryLoadImg=function(id,stage,ok,fail){var p=byId(id);if(!p){if(fail)fail();return}resolve(p).then(function(url){if(url&&ok)ok(url);else if(fail)fail()}).catch(function(){if(fail)fail()})};
    window.loadCardImg=function(id){repairCard(id)};
  }
  function patchModal(){if(window.__singlePlantPhotoOpenM)return;var old=window.openM;if(typeof old!=='function')return;window.__singlePlantPhotoOpenM=true;window.openM=async function(id){var r=await old.apply(this,arguments);setTimeout(function(){repairModal(byId(id))},50);setTimeout(function(){repairModal(byId(id))},650);return r}}
  function patchRender(){if(window.__singlePlantPhotoRender)return;var old=window.render;if(typeof old!=='function')return;window.__singlePlantPhotoRender=true;window.render=function(){var r=old.apply(this,arguments);setTimeout(repairCards,80);setTimeout(repairCards,800);return r}}
  function observe(){var a=document.getElementById('pa');if(!a||window.__singlePlantPhotoObserver)return;window.__singlePlantPhotoObserver=true;new MutationObserver(function(){setTimeout(repairCards,100)}).observe(a,{childList:true,subtree:true})}
  function ready(){try{return typeof P!=='undefined'&&Array.isArray(P)&&typeof imgCache!=='undefined'&&typeof window.openM==='function'}catch(e){return false}}
  var tries=0;function boot(){cleanCache();css();if(!ready()){if(++tries<240)setTimeout(boot,100);return}patch();patchModal();patchRender();observe();repairCards();setTimeout(repairCards,1200);window.__singlePlantPhotoVersion=VERSION}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();