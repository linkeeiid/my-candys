setTimeout(function(){
  var vw=innerWidth,bad=[];
  document.querySelectorAll('*').forEach(function(el){
    var r=el.getBoundingClientRect();
    if(r.right>vw+1){bad.push((el.className||el.tagName)+'@'+Math.round(r.right))}
  });
  var c=document.querySelector('.count');
  if(c){c.style.cssText='position:fixed;left:0;top:0;z-index:9999;background:rgb(0,0,0);color:rgb(0,255,0);font:11px monospace;padding:5px;max-width:100%;white-space:pre-wrap;margin:0';c.textContent='VW='+vw+' SW='+document.documentElement.scrollWidth+' | '+bad.slice(0,9).join('  ')}
},1300);
