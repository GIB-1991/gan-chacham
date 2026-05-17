(function(){
  var VERSION='botanical-photos-20260517b';
  var STAGES=['small','medium','large'];
  var LABELS={small:'צמח צעיר',medium:'בן 3-4',large:'צמח בוגר'};
  var FALLBACK={
    'ערבה בוכיה':'Salix babylonica','ערבה בוכייה':'Salix babylonica','שסק':'Eriobotrya japonica','מנגו':'Mangifera indica','תאנה':'Ficus carica','שמיר':'Anethum graveolens',
    'לימון':'Citrus limon','לימון ננסי':'Citrus limon','תפוז טבורי':'Citrus sinensis','אבוקדו':'Persea americana','רימון':'Punica granatum','זית':'Olea europaea',
    'נענע':'Mentha','בזיליקום':'Ocimum basilicum','רוזמרין':'Salvia rosmarinus','לבנדר':'Lavandula','בננה':'Musa','תמר':'Phoenix dactylifera',
    'חרוב':'Ceratonia siliqua','שקד':'Prunus dulcis','אפרסק':'Prunus persica','תפוח':'Malus domestica','אגס':'Pyrus communis',
    'אורן ירושלים':'Pinus halepensis','ברוש':'Cupressus sempervirens','אקליפטוס':'Eucalyptus','יוקה':'Yucca','אלוורה':'Aloe vera',
    'מונסטרה':'Monstera deliciosa','כלנית':'Anemone coronaria','נרקיס':'Narcissus','חמניה':'Helianthus annuus','עגבנייה':'Solanum lycopersicum',
    'מלפפון':'Cucumis sativus','פלפל':'Capsicum annuum','חציל':'Solanum melongena'
  };
  var SPECIAL={
    'ערבה בוכיה':{small:'Salix babylonica sapling',medium:'Salix babylonica tree leaves',large:'Salix babylonica mature tree'},
    'ערבה בוכייה':{small:'Salix babylonica sapling',medium:'Salix babylonica tree leaves',large:'Salix babylonica mature tree'},
    'מנגו':{small:'Mangifera indica seedling',medium:'Mangifera indica tree leaves',large:'Mangifera indica mature tree'},
    'תאנה':{small:'Ficus carica sapling',medium:'Ficus carica tree leaves',large:'Ficus carica mature tree'},
    'שסק':{small:'Eriobotrya japonica sapling',medium:'Eriobotrya japonica tree leaves',large:'Eriobotrya japonica mature tree'},
    'שמיר':{small:'Anethum graveolens seedling',medium:'Anethum graveolens plant leaves',large:'Anethum graveolens flowering plant'}
  };
  var BAD=/baby|child|children|kid|person|people|man|woman|portrait|statue|sculpture|monument|street|car|vehicle|building|logo|icon|map|diagram|drawing|herbarium|scan|seed packet|fruit only/i;
  var GOOD=/tree|plant|leaf|leaves|flower|sapling|seedling|shrub|bush|vine|palm|grass|cactus|herb|orchard|garden|foliage|bloom|fruit/i;
  var mem={};
  function plants(){try{return Array.isArray(P)?P:[]}catch(e){return[]}}
  function byId(id){return plants().find(function(p){return String(p.id)===String(id)})||null}
  function ok(url){return /^https?:\/\//i.test(String(url||''))&&!/defaultImage|logo|icon|map|symbol|\.svg/i.test(url)}
  function wi(name){try{return typeof WIKI_PAGES!=='undefined'&&WIKI_PAGES?WIKI_PAGES[name]:null}catch(e){return null}}
  function page(name){var w=wi(name);return (w&&w.page)||FALLBACK[name]||String(name||'Garden plant')}
  function latin(name){return FALLBACK[name]||page(name)}
  function q(p,stage){var n=p&&p.name||'';if(SPECIAL[n]&&SPECIAL[n][stage])return SPECIAL[n][stage];var w=wi(n);if(stage==='small'&&w&&w.small)return w.small;if(stage==='large'&&w&&w.large)return w.large;var base=latin(n);if(stage==='small')return base+' sapling seedling plant';if(stage==='large')return base+' mature tree plant';return base+' tree plant leaves'}
  async function json(url){var r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error(r.status);return r.json()}
  async function pageImg(pg){var key='page:'+pg;if(key in mem)return mem[key];try{var d=await json('https://en.wikipedia.org/w/api.php?action=query&titles='+encodeURIComponent(pg)+'&prop=pageimages&pithumbsize=1200&format=json&origin=*');var first=Object.values(d.query&&d.query.pages||{})[0];var url=first&&first.thumbnail&&first.thumbnail.source;mem[key]=ok(url)?url:null}catch(e){mem[key]=null}return mem[key]}
  function hitOk(h,query){var text=((h&&h.title)||'')+' '+((h&&h.snippet)||'')+' '+query;return !BAD.test(text)&&GOOD.test(text)}
  async function commons(query,used){var key='commons:'+query;if(key in mem&&!used.has(mem[key]))return mem[key];try{var d=await json('https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srlimit=12&srsearch='+encodeURIComponent(query)+'&format=json&origin=*');var hits=(d.query&&d.query.search||[]).filter(function(h){return hitOk(h,query)});for(var i=0;i<hits.length;i++){var title=hits[i].title&&hits[i].title.indexOf('File:')===0?hits[i].title:'File:'+hits[i].title;var fi=await json('https://commons.wikimedia.org/w/api.php?action=query&titles='+encodeURIComponent(title)+'&prop=imageinfo&iiprop=url|mime&iiurlwidth=1200&format=json&origin=*');var obj=Object.values(fi.query&&fi.query.pages||{})[0];var ii=obj&&obj.imageinfo&&obj.imageinfo[0];var url=ii&&(ii.thumburl||ii.url);if(/^image\/(jpeg|png|webp)/i.test(ii&&ii.mime||'')&&ok(url)&&!used.has(url)){mem[key]=url;return url}}}catch(e){}mem[key]=null;return null}
  async function resolve(p,stage,used){stage=STAGES.indexOf(stage)>=0?stage:'medium';used=used||new Set();var n=p&&p.name||'';var key=n+':'+stage;if(key in mem&&!used.has(mem[key]))return mem[key];try{var custom=p?'custom_'+p.id+'_'+stage:'';if(custom&&typeof imgCache!=='undefined'&&ok(imgCache[custom])&&!used.has(imgCache[custom]))return imgCache[custom]}catch(e){}
    var url=null;
    if(stage==='medium')url=await pageImg(page(n));
    if(!ok(url)||used.has(url))url=await commons(q(p,stage),used);
    if(!ok(url)||used.has(url))url=await pageImg(page(n));
    if(!ok(url)||used.has(url))url=await commons(latin(n)+' plant',used);
    url=ok(url)?url:null;mem[key]=url;try{if(url&&typeof imgCache!=='undefined')imgCache[n+'__'+stage]=url}catch(e){}return url}
  function css(){if(document.getElementById('photo-force-css'))return;var s=document.createElement('style');s.id='photo-force-css';s.textContent='.card-img .plant-emoji-big,.m-slot-bg .slot-emoji{display:none!important}.card-img .img-bg,.m-slot-bg{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}.real-photo.show,.m-slot-real.show{opacity:1!important}.m-photos.stage-gallery{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important}@media(max-width:768px){.m-photos.stage-gallery{grid-template-columns:1fr!important;height:auto!important}.m-photos.stage-gallery .m-slot{height:190px!important}}';document.head.appendChild(s)}
  function bg(el,url){if(!el||!url)return;el.style.backgroundImage='url("'+url+'")';el.style.backgroundSize='cover';el.style.backgroundPosition='center'}
  function show(img,url){if(!img||!url)return;img.classList.remove('show');img.onload=function(){img.classList.add('show')};img.onerror=function(){img.classList.remove('show')};img.src=url;if(img.complete&&img.naturalWidth>0)img.classList.add('show')}
  function cardPlant(card){var id=(card&&card.id||'').replace('card-','');var p=byId(id);if(p)return p;var n=card&&card.querySelector('.card-name')&&card.querySelector('.card-name').textContent.trim();return n?{id:id,name:n}:null}
  function forceCard(card){var p=cardPlant(card);if(!p)return;var rk=VERSION+':'+p.name;if(card.getAttribute('data-photo-force')===rk)return;card.setAttribute('data-photo-force',rk);var img=card.querySelector('img.real-photo');var holder=card.querySelector('.img-bg');resolve(p,'medium',new Set()).then(function(url){if(url){bg(holder,url);show(img,url)}})}
  function cards(){document.querySelectorAll('.card[id^="card-"]').forEach(forceCard)}
  function label(p){var photos=document.getElementById('mPhotos');if(photos)photos.classList.add('stage-gallery');STAGES.forEach(function(stage){var slot=document.getElementById('mslot-'+stage);var lab=slot&&slot.querySelector('.m-slot-lbl');var detail=p&&p.sizes&&p.sizes[stage]||'';if(lab)lab.innerHTML=LABELS[stage]+(detail?'<br><small>'+detail+'</small>':'')})}
  function modal(id){var current=document.getElementById('mt')&&document.getElementById('mt').textContent.trim();var p=byId(id)||plants().find(function(x){return x.name===current})||(current?{name:current}:null);if(!p)return;label(p);var used=new Set();STAGES.reduce(function(pr,stage){return pr.then(async function(){var img=document.getElementById('mimg-'+stage);var holder=document.querySelector('#mslot-'+stage+' .m-slot-bg');var loader=document.getElementById('mload-'+stage);if(loader)loader.classList.add('show');var url=await resolve(p,stage,used);if(loader)loader.classList.remove('show');if(url){used.add(url);bg(holder,url);show(img,url)}})},Promise.resolve())}
  function patch(){if(window.__photoForceOpenM)return;var old=window.openM;if(typeof old!=='function')return;window.__photoForceOpenM=true;window.openM=function(){var id=arguments[0];var r=old.apply(this,arguments);setTimeout(function(){modal(id)},100);setTimeout(function(){modal(id)},900);return r}}
  function boot(){css();cards();modal();patch();setInterval(function(){patch();cards()},1400);var pa=document.getElementById('pa');if(pa&&window.MutationObserver&&!window.__photoForceObserver){window.__photoForceObserver=true;new MutationObserver(function(){setTimeout(cards,80)}).observe(pa,{childList:true,subtree:true})}window.__photoForceVersion=VERSION}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();