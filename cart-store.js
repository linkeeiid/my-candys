(function(){
  var KEY='mcCartV1';
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY)) || []; }catch(e){ return []; } }
  function write(items){
    try{ localStorage.setItem(KEY, JSON.stringify(items)); }catch(e){}
    try{ window.dispatchEvent(new CustomEvent('mc-cart-change')); }catch(e){}
  }
  var API = {
    items: function(){ return read(); },
    count: function(){ return read().reduce(function(n,l){ return n + l.qty; }, 0); },
    subtotal: function(){ return read().reduce(function(n,l){ return n + l.price * l.qty; }, 0); },
    add: function(p, qty){
      qty = qty || 1;
      var items = read();
      var ex = items.find(function(l){ return l.id === p.id; });
      if(ex){ ex.qty += qty; }
      else { items.push({ id:p.id, name:p.name, price:p.price, qty:qty, tint:p.tint||'', cat:p.cat||'', old:(p.old!=null?p.old:null) }); }
      write(items);
    },
    setQty: function(id, qty){ write(read().map(function(l){ return l.id===id ? Object.assign({}, l, {qty:Math.max(1,qty)}) : l; })); },
    inc: function(id){ write(read().map(function(l){ return l.id===id ? Object.assign({}, l, {qty:l.qty+1}) : l; })); },
    dec: function(id){ write(read().map(function(l){ return l.id===id ? Object.assign({}, l, {qty:Math.max(1,l.qty-1)}) : l; })); },
    remove: function(id){ write(read().filter(function(l){ return l.id !== id; })); },
    clear: function(){ write([]); },
    seedIfEmpty: function(demo){ if(read().length===0){ write(demo.slice()); } }
  };
  window.MCCart = API;
})();

(function(){
  var KEY='mcWishV1';
  function read(){ try{ return JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ return []; } }
  function write(a){ try{ localStorage.setItem(KEY, JSON.stringify(a)); }catch(e){} try{ window.dispatchEvent(new CustomEvent('mc-wish-change')); }catch(e){} }
  window.MCWish = {
    items:function(){ return read(); },
    count:function(){ return read().length; },
    has:function(id){ return read().some(function(x){return x.id===id;}); },
    toggle:function(p){ var a=read(); var i=a.findIndex(function(x){return x.id===p.id;}); if(i>=0){a.splice(i,1);} else {a.push({id:p.id,name:p.name,cat:p.cat||'',price:p.price,tint:p.tint||''});} write(a); return i<0; },
    remove:function(id){ write(read().filter(function(x){return x.id!==id;})); }
  };
})();
