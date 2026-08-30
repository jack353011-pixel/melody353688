const RAW_GAME='https://raw.githubusercontent.com/jack353011-pixel/melody353688/main/game.html';
const PATCH=`<script>
(function(){
  if(typeof Game==='undefined'||Game.prototype.__forestNpcFixV2)return;
  const origSwitch=Game.prototype.switchMap;
  const origRender=Game.prototype.render;
  const origUpdate=Game.prototype.update;
  Game.prototype.switchMap=function(mapId,x,y){
    if(!this.__villageNpcsCache&&Array.isArray(this.npcs))this.__villageNpcsCache=this.npcs.slice();
    const result=origSwitch.call(this,mapId,x,y);
    this.npcs=mapId==='mistForest'?[]:(this.__villageNpcsCache||this.npcs||[]);
    return result;
  };
  Game.prototype.render=function(){
    if(this.world&&this.world.mapId==='mistForest'){
      const saved=this.npcs;this.npcs=[];
      try{return origRender.call(this);}finally{this.npcs=saved;}
    }
    return origRender.call(this);
  };
  Game.prototype.update=function(dt){
    if(this.world&&this.world.mapId==='mistForest'){
      const saved=this.npcs;this.npcs=[];
      try{return origUpdate.call(this,dt);}finally{this.npcs=saved;}
    }
    return origUpdate.call(this,dt);
  };
  Game.prototype.__forestNpcFixV2=true;
})();
</script>`;
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(u.origin===self.location.origin&&u.pathname.endsWith('/game.html')){
    e.respondWith(fetch(RAW_GAME,{cache:'no-store'}).then(r=>r.text()).then(html=>{
      const out=html.includes('</body>')?html.replace('</body>',PATCH+'\n</body>'):html+PATCH;
      return new Response(out,{status:200,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});
    }).catch(()=>fetch(e.request)));
  }
});