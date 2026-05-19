(function () {
  var VERSION = 'tree-plant-images-no-fruit-20260519';
  var STAGES = ['small', 'medium', 'large'];
  var LABEL = { small: 'צמח צעיר', medium: 'בן 3-4', large: 'צמח בוגר' };
  var OV = {
    'ערבה בוכיה':'Salix babylonica','ערבה בוכייה':'Salix babylonica','מנגו':'Mangifera indica','תאנה':'Ficus carica','שמיר':'Anethum graveolens','שסק':'Eriobotrya japonica',
    'לימון':'Citrus limon','לימון ננסי':'Citrus limon','ליים':'Citrus aurantiifolia','תפוז':'Citrus sinensis','תפוז טבורי':'Citrus sinensis','אשכולית':'Citrus paradisi','קלמנטינה':'Citrus clementina','פומלה':'Citrus maxima',
    'אבוקדו':'Persea americana','רימון':'Punica granatum','זית':'Olea europaea','פפאיה':'Carica papaya','בננה':'Musa','תמר':'Phoenix dactylifera','חרוב':'Ceratonia siliqua',
    'שקד':'Prunus dulcis','שזיף':'Prunus domestica','משמש':'Prunus armeniaca','אפרסק':'Prunus persica','תפוח':'Malus domestica','אגס':'Pyrus communis',
    'ענב':'Vitis vinifera','ענבים':'Vitis vinifera','פסיפלורה':'Passiflora edulis','קיווי':'Actinidia deliciosa','תות שדה':'Fragaria ananassa','פטל':'Rubus idaeus','אוכמניות':'Vaccinium corymbosum',
    'נענע':'Mentha','בזיליקום':'Ocimum basilicum','רוזמרין':'Salvia rosmarinus','לבנדר':'Lavandula','מרווה':'Salvia officinalis','לואיזה':'Aloysia citrodora',
    'אורן ירושלים':'Pinus halepensis','ברוש':'Cupressus sempervirens','אקליפטוס':'Eucalyptus','יוקה':'Yucca','אלוורה':'Aloe vera','מונסטרה':'Monstera deliciosa',
    'כלנית':'Anemone coronaria','נרקיס':'Narcissus','חמניה':'Helianthus annuus','עגבנייה':'Solanum lycopersicum','מלפפון':'Cucumis sativus','פלפל':'Capsicum annuum','חציל':'Solanum melongena'
  };
  var BAD_URL = /loremflickr|staticflickr|flickr\.com|flickr\.net|placekitten|defaultImage|logo|icon|map|diagram|symbol/i;
  var BAD_TEXT = /logo|icon|map|diagram|drawing|illustration|symbol|fruit only|slice|sliced|peeled|market|basket|juice|dish|food|seed packet|herbarium|specimen|scan|person|people|man|woman|child|street|building|statue|sculpture|monument|cat|kitten/i;
  var GOOD_TEXT = /tree|plant|leaf|leaves|foliage|branch|branches|trunk|habit|habitus|orchard|garden|sapling|seedling|shrub|bush|vine|palm|cactus|flowering|bloom|field/i;
  var SAFE_HOST = /(^data:image\/(png|jpe?g|webp);)|upload\.wikimedia\.org/i;

  function plants(){try{return typeof P !== 'undefined' && Array.isArray(P) ? P : []}catch(e){return []}}
  function byId(id){return plants().find(function(p){return String(p.id) === String(id)}) || null}
  function wi(name){try{return typeof WIKI_PAGES !== 'undefined' && WIKI_PAGES && WIKI_PAGES[name] ? WIKI_PAGES[name] : {}}catch(e){return {}}}
  function safe(url){url=String(url||'');return !!url && !BAD_URL.test(url) && SAFE_HOST.test(url)}
  function page(name){var info=wi(name);return OV[name] || info.page || name || 'Plant'}
  function clean(v){return String(v||'').replace(/\([^)]*\)/g,' ').replace(/[^a-zA-Z0-9\s-]/g,' ').replace(/\s+/g,' ').trim()}
  function esc(v){return String(v||'').replace(/[<>&"']/g,function(c){return {'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]})}
  function query(p,stage){
    var base=clean(page(p&&p.name));
    var tail=stage==='small'?'young sapling seedling plant leaves':stage==='large'?'mature tree plant foliage':'tree plant leaves foliage';
    return (base+' '+tail).trim();
  }
  function hitOk(hit,q){
    var text=((hit&&hit.title)||'')+' '+((hit&&hit.snippet)||'')+' '+q;
    if(BAD_TEXT.test(text) || !GOOD_TEXT.test(text)) return false;
    var core=clean(q).split(/\s+/).filter(function(w){return w.length>3}).slice(0,2);
    return !core.length || core.some(function(w){return new RegExp(w,'i').test(text)});
  }
  async function getJson(url){var r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(r.status);return r.json()}
  async function commons(p,stage){
    var q=query(p,stage), key='safe_tree_'+VERSION+'_'+(p&&p.name||'plant')+'_'+stage;
    try{if(typeof imgCache!=='undefined' && safe(imgCache[key]))return imgCache[key]}catch(e){}
    try{
      var s=await getJson('https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=18&srsearch='+encodeURIComponent(q)+'&format=json&origin=*');
      var hits=(s.query&&s.query.search||[]).filter(function(h){return hitOk(h,q)}).slice(0,8);
      for(var i=0;i<hits.length;i++){
        var title=hits[i].title&&hits[i].title.indexOf('File:')===0?hits[i].title:'File:'+hits[i].title;
        var d=await getJson('https://commons.wikimedia.org/w/api.php?action=query&titles='+encodeURIComponent(title)+'&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*');
        var obj=Object.values(d.query&&d.query.pages||{})[0], info=obj&&obj.imageinfo&&obj.imageinfo[0], url=info&&(info.thumburl||info.url);
        if(/^image\/(jpeg|png|webp)/i.test(info&&info.mime||'') && safe(url)){try{if(typeof imgCache!=='undefined')imgCache[key]=url}catch(e){} return url}
      }
    }catch(e){}
    return null;
  }
  async function wiki(p){
    var pg=page(p&&p.name), key='safe_wp_'+VERSION+'_'+pg;
    try{if(typeof imgCache!=='undefined' && imgCache[key]!==undefined)return imgCache[key]}catch(e){}
    var url=null;
    try{
      var d=await getJson('https://en.wikipedia.org/w/api.php?action=query&titles='+encodeURIComponent(pg)+'&prop=pageimages&pithumbsize=1200&format=json&origin=*');
      var obj=Object.values(d.query&&d.query.pages||{})[0], cand=obj&&obj.thumbnail&&obj.thumbnail.source;
      if(safe(cand))url=cand;
    }catch(e){}
    try{if(typeof imgCache!=='undefined')imgCache[key]=url}catch(e){}
    return url;
  }
  function placeholder(p,stage){
    var name=esc(p&&p.name?p.name:'צמח'), label=esc(LABEL[stage]||''), a=stage==='small'?'#d9ead3':stage==='large'?'#b7cfaa':'#c9ddbd';
    var svg='<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="'+a+'"/><circle cx="600" cy="350" r="120" fill="#fff" opacity=".72"/><path d="M610 475c-5-92 13-166 76-230-92 38-141 94-162 181-24-62-70-106-145-133 53 50 83 107 92 182h139z" fill="#2f6b3f" opacity=".9"/><text x="600" y="615" direction="rtl" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="700" fill="#173f25">'+name+'</text><text x="600" y="680" direction="rtl" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" fill="#42604b">'+label+'</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  }
  function cleanCache(){
    try{if(typeof imgCache!=='undefined')Object.keys(imgCache).forEach(function(k){var v=imgCache[k];if(!v||BAD_URL.test(String(v))||/__(small|medium|large)$/.test(k)||/^resolved_|^commons_|^wc__|^wp__|safe_tree_|safe_wp_|real-photo-fallbacks|botanical-photos|force-real-photos/.test(k))delete imgCache[k]})}catch(e){}
    try{for(var i=localStorage.length-1;i>=0;i--){var k=localStorage.key(i), v=localStorage.getItem(k);if(v&&BAD_URL.test(v)&&/image|photo|img|gan_chacham_local_images/i.test(k))localStorage.removeItem(k)}}catch(e){}
  }
  async function resolve(p,stage){
    stage=STAGES.indexOf(stage)>=0?stage:'medium';
    var customKey=p?'custom_'+p.id+'_'+stage:null, directKey=p?p.name+'__'+stage:null;
    try{var custom=customKey&&typeof imgCache!=='undefined'?imgCache[customKey]:null;if(safe(custom))return custom;if(custom&&typeof imgCache!=='undefined')delete imgCache[customKey];if(directKey&&typeof imgCache!=='undefined')delete imgCache[directKey]}catch(e){}
    var url=await commons(p,stage) || await wiki(p) || placeholder(p,stage);
    try{if(typeof imgCache!=='undefined'&&directKey)imgCache[directKey]=url}catch(e){}
    return url;
  }
  function show(img,url){if(!img||!url)return;img.classList.remove('show');img.onload=function(){img.classList.add('show')};img.onerror=function(){img.classList.remove('show')};img.src=url;if(img.complete&&img.naturalWidth>0)img.classList.add('show')}
  function css(){if(document.getElementById('safe-botanical-image-css'))return;var s=document.createElement('style');s.id='safe-botanical-image-css';s.textContent='.real-photo.show,.m-slot-real.show{opacity:1!important}.card-img:has(.real-photo.show) .plant-emoji-big,.m-slot:has(.m-slot-real.show) .slot-emoji{display:none!important}.m-photos.stage-gallery{height:310px!important;display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;background:#17251b}.m-photos.stage-gallery .m-slot-lbl{padding:9px 10px 8px!important;background:linear-gradient(180deg,rgba(0,0,0,0),rgba(0,0,0,.78))!important;font-size:.82rem!important;line-height:1.2!important}@media(max-width:768px){.m-photos.stage-gallery{height:auto!important;grid-template-columns:1fr!important}.m-photos.stage-gallery .m-slot{height:190px!important}}';document.head.appendChild(s)}
  function labelModal(p){var photos=document.getElementById('mPhotos');if(photos)photos.classList.add('stage-gallery');STAGES.forEach(function(st){var slot=document.getElementById('mslot-'+st), lab=slot&&slot.querySelector('.m-slot-lbl'), detail=p&&p.sizes&&p.sizes[st]||'';if(lab)lab.innerHTML=LABEL[st]+(detail?'<br><small>'+esc(detail)+'</small>':'')})}
  async function repairCard(id,stage){var p=byId(id), img=document.getElementById('cimg-'+id), l=document.getElementById('cload-'+id);if(!p||!img)return;if(l)l.classList.add('show');var url=await resolve(p,stage||'medium');if(l)l.classList.remove('show');show(img,url)}
  function repairCards(){document.querySelectorAll('img.real-photo[id^="cimg-"]').forEach(function(img){repairCard(img.id.replace('cimg-',''),'medium')})}
  async function repairModal(p){if(!p)return;labelModal(p);for(var i=0;i<STAGES.length;i++){var st=STAGES[i], img=document.getElementById('mimg-'+st), l=document.getElementById('mload-'+st);if(!img)continue;if(l)l.classList.add('show');var url=await resolve(p,st);if(l)l.classList.remove('show');show(img,url)}}
  function patch(){window.fetchWikiImg=function(name,stage){return resolve(plants().find(function(p){return p.name===name})||{name:name},stage||'medium')};window.tryLoadImg=function(id,stage,ok,fail){var p=byId(id);if(!p){if(fail)fail();return}resolve(p,stage||'medium').then(function(url){if(ok)ok(url)}).catch(function(){if(ok)ok(placeholder(p,stage||'medium'));else if(fail)fail()})};window.loadCardImg=function(id,stage){repairCard(id,stage||'medium')}}
  function patchModal(){if(window.__safeBotanicalOpenM)return;var old=window.openM;if(typeof old!=='function')return;window.__safeBotanicalOpenM=true;window.openM=async function(id){var r=await old.apply(this,arguments);setTimeout(function(){repairModal(byId(id))},50);setTimeout(function(){repairModal(byId(id))},650);return r}}
  function patchRender(){if(window.__safeBotanicalRender)return;var old=window.render;if(typeof old!=='function')return;window.__safeBotanicalRender=true;window.render=function(){var r=old.apply(this,arguments);setTimeout(repairCards,80);setTimeout(repairCards,800);return r}}
  function observe(){var a=document.getElementById('pa');if(!a||window.__safeBotanicalObserver)return;window.__safeBotanicalObserver=true;new MutationObserver(function(){setTimeout(repairCards,100)}).observe(a,{childList:true,subtree:true})}
  function ready(){try{return typeof P!=='undefined'&&Array.isArray(P)&&typeof imgCache!=='undefined'&&typeof window.openM==='function'}catch(e){return false}}
  var tries=0;function boot(){cleanCache();css();if(!ready()){if(++tries<240)setTimeout(boot,100);return}patch();patchModal();patchRender();observe();repairCards();setTimeout(repairCards,1200);window.__realPhotoStageVersion=VERSION}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();