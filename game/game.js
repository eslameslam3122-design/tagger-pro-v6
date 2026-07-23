var C=document.getElementById('g'),ctx=C.getContext('2d'),W,H;
var MW=4000,MH=2800,cam={x:0,y:0},team='blue',over=false,tick=0,shake=0,shakeX=0,shakeY=0;
var TP={infantry:{hp:80,spd:1.2,dmg:8,rng:60,sz:7,rl:900,bs:6},tank:{hp:280,spd:1.8,dmg:30,rng:110,sz:11,rl:1400,bs:7},apc:{hp:160,spd:2.4,dmg:14,rng:80,sz:9,rl:700,bs:6},mortar:{hp:60,spd:.7,dmg:35,rng:220,sz:8,rl:2500,bs:4},rocket:{hp:90,spd:.9,dmg:50,rng:200,sz:9,rl:3000,bs:3}};
var CL={blue:{f:'#4a9eff',d:'#2a6ecc',l:'#80c4ff',g:'#1a4e8e',arm:'#3a7acc',skin:'#e8c8a0'},red:{f:'#ff4a4a',d:'#cc2a2a',l:'#ff8888',g:'#8e1a1a',arm:'#cc5533',skin:'#e8c8a0'}};
var units=[],bul=[],fx=[],bases={},cities=[],grps=[null,null,null],trees=[],rocks=[],dust=[],smokes=[],defTurrets=[],airfields={},airplanes=[],airTarget=null;

function resize(){W=C.width=innerWidth;H=C.height=innerHeight}
addEventListener('resize',resize);resize();

function mkCity(cx,cy){
  var blds=[],n=6+~~(Math.random()*5);
  for(var i=0;i<n;i++){var bx=cx-60+Math.random()*120,by=cy-60+Math.random()*120,bw=14+Math.random()*22,bh=12+Math.random()*20;var cs=['#8B7355','#A0522D','#CD853F','#DEB887','#D2B48C'];blds.push({x:bx,y:by,w:bw,h:bh,c:cs[~~(Math.random()*cs.length)],rh:4+Math.random()*6})}
  var turrets=[];
  var tp=[{x:cx-70,y:cy-70},{x:cx+70,y:cy-70},{x:cx-70,y:cy+70},{x:cx+70,y:cy+70},{x:cx,y:cy-80},{x:cx,y:cy+80}];
  for(var j=0;j<tp.length;j++)turrets.push({x:tp[j].x,y:tp[j].y,hp:150,mx:150,dmg:35,rng:350,rl:600,ls:0,dead:false,ang:0});
  return{x:cx,y:cy,hp:1000,mx:1000,owner:null,rad:100,blds:blds,turrets:turrets,
    roads:[{x1:cx-85,y1:cy,x2:cx+85,y2:cy},{x1:cx,y1:cy-85,x2:cx,y2:cy+85},{x1:cx-60,y1:cy-60,x2:cx+60,y2:cy+60},{x1:cx+60,y1:cy-60,x2:cx-60,y2:cy+60}],
    capP:0,capT:null,_lastFire:0};
}

function init(){
  units=[];bul=[];fx=[];dust=[];smokes=[];defTurrets=[];airplanes=[];airTarget=null;team='blue';over=false;tick=0;grps=[null,null,null];shake=0;
  bases={blue:{x:250,y:MH/2,hp:600,mx:600,team:'blue'},red:{x:MW-250,y:MH/2,hp:600,mx:600,team:'red'}};
  airfields={blue:{x:bases.blue.x-30,y:MH/2+120,cooldown:0,team:'blue'},red:{x:bases.red.x+30,y:MH/2+120,cooldown:0,team:'red'}};
  cities=[mkCity(MW*.3,MH*.3),mkCity(MW*.5,MH*.22),mkCity(MW*.7,MH*.3),mkCity(MW*.3,MH*.7),mkCity(MW*.5,MH*.78),mkCity(MW*.7,MH*.7),mkCity(MW*.5,MH*.5)];
  trees=[];rocks=[];
  for(var i=0;i<100;i++)trees.push({x:Math.random()*MW,y:Math.random()*MH,s:8+Math.random()*12,sh:Math.random()*.3});
  for(var j=0;j<30;j++)rocks.push({x:Math.random()*MW,y:Math.random()*MH,s:5+Math.random()*10,rot:Math.random()*6.28});
  for(var k=-1;k<=1;k++){spawn('blue','infantry',bases.blue.x+80,bases.blue.y+k*50);spawn('red','infantry',bases.red.x-80,bases.red.y+k*50)}
  cam.x=0;cam.y=MH/2-H/2;
  document.getElementById('ov').className='';
  buildBtns();ui();
}

function buildBtns(){
  var el=document.getElementById('bp');el.innerHTML='';
  var ts=[['infantry','INF'],['apc','APC'],['tank','TNK'],['mortar','MTR'],['rocket','RCT']];
  for(var i=0;i<ts.length;i++){
    el.innerHTML+='<div class="b bu" onclick="mk(\'blue\',\''+ts[i][0]+'\')">'+ts[i][1]+'</div>';
    el.innerHTML+='<div class="b ru" onclick="mk(\'red\',\''+ts[i][0]+'\')">'+ts[i][1]+'</div>';
  }
  el.innerHTML+='<div class="b" style="border-color:#fa0;color:#fa0" onclick="buildDefLine()">DEF LINE</div>';
  el.innerHTML+='<div class="b bu" onclick="callAir(\'blue\')" id="airB">AIR STRIKE</div>';
}

function spawn(t,tp,x,y){var T=TP[tp];units.push({team:t,type:tp,x:x,y:y,hp:T.hp,mx:T.mx,spd:T.spd,dmg:T.dmg,rng:T.rng,sz:T.sz,rl:T.rl,bs:T.bs,ls:0,tgt:null,dest:null,atk:null,sel:false,dead:false,man:false,ang:Math.random()*6.28})}
function mk(t,tp){if(over)return;var b=bases[t],ox=t==='blue'?100:-100;spawn(t,tp,b.x+ox,b.y+(Math.random()-.5)*80);ui()}
function swTeam(){if(over)return;team=team==='blue'?'red':'blue';units.forEach(function(u){u.sel=false});ui()}
function selAll(){units.forEach(function(u){if(u.team===team)u.sel=true});ui()}
function deselAll(){units.forEach(function(u){u.sel=false});ui()}
function saveG(i){var s=units.filter(function(u){return u.sel});if(s.length>0){grps[i]=s.map(function(u){return units.indexOf(u)});ui()}}
function recallG(i){if(!grps[i])return;units.forEach(function(u){u.sel=false});grps[i].forEach(function(j){if(units[j])units[j].sel=true});ui()}
function grpClick(i){var s=units.filter(function(u){return u.sel});if(s.length>0)saveG(i);else recallG(i)}
function ds(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

function findE(u,r){
  var best=null,bd=r||350;
  for(var i=0;i<units.length;i++){var o=units[i];if(o.dead||o.team===u.team)continue;var d=ds(u,o);if(d<bd){bd=d;best=o}}
  if(!best){
    for(var ti=0;ti<cities.length;ti++){var c=cities[ti];if(!c.owner||c.owner===u.team)continue;
      for(var tj=0;tj<c.turrets.length;tj++){if(c.turrets[tj].dead)continue;var d2=ds(u,c.turrets[tj]);if(d2<bd){bd=d2;best=c.turrets[tj]}}
    }
  }
  if(!best){
    for(var di=0;di<defTurrets.length;di++){var dt2=defTurrets[di];if(dt2.team===u.team||dt2.dead)continue;var d3=ds(u,dt2);if(d3<bd){bd=d3;best=dt2}}
  }
  return best;
}

function addDust(x,y,n,clr){for(var i=0;i<n;i++){var a=Math.random()*6.28,sp=Math.random()*1.5+.5;dust.push({x:x,y:y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:20+Math.random()*20,sz:1+Math.random()*2,clr:clr||'#a93'})}}
function addSmoke(x,y,n){for(var i=0;i<n;i++){smokes.push({x:x+(Math.random()-.5)*10,y:y,vx:(Math.random()-.5)*.3,vy:-Math.random()*.5-.3,life:40+Math.random()*30,sz:3+Math.random()*5,ma:1})}}

function buildDefLine(){
  var owned=cities.filter(function(c){return c.owner===team});
  if(owned.length<2)return;
  for(var i=0;i<owned.length;i++){
    var next=owned[(i+1)%owned.length];
    var dx=next.x-owned[i].x,dy=next.y-owned[i].y;
    var dist=Math.hypot(dx,dy);
    var steps=Math.floor(dist/80);
    for(var s=1;s<steps;s++){
      var tx=owned[i].x+dx*(s/steps);
      var ty=owned[i].y+dy*(s/steps);
      var exists=false;
      for(var di=0;di<defTurrets.length;di++){if(ds({x:tx,y:ty},defTurrets[di])<30){exists=true;break}}
      if(!exists){defTurrets.push({x:tx,y:ty,hp:200,mx:200,dmg:30,rng:320,rl:700,ls:0,dead:false,ang:0,team:team,soldiers:~~(Math.random()*2)+2})}
    }
  }
  fx.push({x:owned[0].x,y:owned[0].y,r:0,mr:50,life:30,clr:team,big:true});
}

function callAir(t){
  if(over)return;
  var af=airfields[t];
  if(af.cooldown>0)return;
  airTarget={team:t,pending:true};
  document.getElementById('unit-info').textContent='Click target location for air strike';
}

function spawnAirplane(t,tx,ty){
  var af=airfields[t];
  af.cooldown=15*60;
  airplanes.push({team:t,x:af.x,y:af.y-50,tx:tx,ty:ty,ang:Math.atan2(ty-af.y+50,tx-af.x),spd:5,phase:'go',bombCount:5,bombTimer:0,sz:14});
}

function updateAir(){
  for(var k in airfields){var af=airfields[k];if(af.cooldown>0)af.cooldown--}
  for(var i=airplanes.length-1;i>=0;i--){
    var a=airplanes[i];
    var dx=a.tx-a.x,dy=a.ty-a.y;
    var dist=Math.hypot(dx,dy);
    a.ang=Math.atan2(dy,dx);
    if(a.phase==='go'){
      a.x+=Math.cos(a.ang)*a.spd;
      a.y+=Math.sin(a.ang)*a.spd;
      a.bombTimer++;
      if(a.bombTimer%18===0&&a.bombCount>0){
        a.bombCount--;
        bul.push({x:a.x,y:a.y,vx:0,vy:1.5,dmg:50,team:a.team,life:90,type:'bomb',grav:.15});
      }
      if(dist<30){a.phase='return';a.ang=Math.atan2((airfields[a.team].y-50)-a.y,airfields[a.team].x-a.x)}
    }else{
      a.x+=Math.cos(a.ang)*a.spd;
      a.y+=Math.sin(a.ang)*a.spd;
      if(dist<30)airplanes.splice(i,1);
    }
  }
}

function update(ts){
  if(over)return;tick++;
  updateAir();

  if(shake>0){shakeX=(Math.random()-.5)*shake;shakeY=(Math.random()-.5)*shake;shake*=.85;if(shake<.5)shake=0}else{shakeX=0;shakeY=0}

  for(var i=0;i<dust.length;i++){var d=dust[i];d.x+=d.vx;d.y+=d.vy;d.vy+=.02;d.life--;d.sz*=.97}
  dust=dust.filter(function(d){return d.life>0});
  for(var si=0;si<smokes.length;si++){var s=smokes[si];s.x+=s.vx;s.y+=s.vy;s.sz+=.08;s.ma*=.97;s.life--}
  smokes=smokes.filter(function(s){return s.life>0});

  for(var i=0;i<units.length;i++){
    var u=units[i];if(u.dead)continue;
    var prevX=u.x,prevY=u.y;
    if(u.man){
      if(u.atk){
        var atkDead=u.atk.dead||(u.atk.hp!==undefined&&u.atk.hp<=0);
        if(atkDead){u.atk=null;u.man=false}
        else{var d=ds(u,u.atk);u.ang=Math.atan2(u.atk.y-u.y,u.atk.x-u.x);if(d<=u.rng){if(ts-u.ls>u.rl){u.ls=ts;bul.push({x:u.x+Math.cos(u.ang)*u.sz,y:u.y+Math.sin(u.ang)*u.sz,vx:Math.cos(u.ang+(Math.random()-.5)*.3)*u.bs,vy:Math.sin(u.ang+(Math.random()-.5)*.3)*u.bs,dmg:u.dmg,team:u.team,life:80,type:u.type,sx:u.x,sy:u.y});addDust(u.x+Math.cos(u.ang)*u.sz,u.y+Math.sin(u.ang)*u.sz,2,'#aa8')}}else{u.x+=(u.atk.x-u.x)/d*u.spd;u.y+=(u.atk.y-u.y)/d*u.spd}}
      }
      if(u.dest&&!u.atk){var dd=ds(u,u.dest);u.ang=Math.atan2(u.dest.y-u.y,u.dest.x-u.x);if(dd>4){u.x+=(u.dest.x-u.x)/dd*u.spd;u.y+=(u.dest.y-u.y)/dd*u.spd}else{u.dest=null;u.man=false}}
    }else{
      if(!u.tgt||u.tgt.dead||(u.tgt.hp!==undefined&&u.tgt.hp<=0))u.tgt=findE(u,400);
      if(u.tgt){var dt=ds(u,u.tgt);u.ang=Math.atan2(u.tgt.y-u.y,u.tgt.x-u.x);if(dt<=u.rng){if(ts-u.ls>u.rl){u.ls=ts;bul.push({x:u.x+Math.cos(u.ang)*u.sz,y:u.y+Math.sin(u.ang)*u.sz,vx:Math.cos(u.ang+(Math.random()-.5)*.3)*u.bs,vy:Math.sin(u.ang+(Math.random()-.5)*.3)*u.bs,dmg:u.dmg,team:u.team,life:80,type:u.type,sx:u.x,sy:u.y});addDust(u.x+Math.cos(u.ang)*u.sz,u.y+Math.sin(u.ang)*u.sz,2,'#aa8')}}else if(!u.dest){u.x+=(u.tgt.x-u.x)/dt*u.spd;u.y+=(u.tgt.y-u.y)/dt*u.spd}}
      if(u.dest){var d2=ds(u,u.dest);u.ang=Math.atan2(u.dest.y-u.y,u.dest.x-u.x);if(d2>4){u.x+=(u.dest.x-u.x)/d2*u.spd;u.y+=(u.dest.y-u.y)/d2*u.spd}else{u.dest=null}}
    }
    u.x=Math.max(u.sz,Math.min(MW-u.sz,u.x));u.y=Math.max(u.sz,Math.min(MH-u.sz,u.y));
    if(Math.abs(u.x-prevX)>0.1||Math.abs(u.y-prevY)>0.1){if(tick%3===0)dust.push({x:u.x,y:u.y+u.sz,vx:(Math.random()-.5)*.3,vy:(Math.random()-.5)*.3,life:15,sz:1+Math.random(),clr:'#765'})}
  }

  for(var di=0;di<defTurrets.length;di++){
    var dt=defTurrets[di];if(dt.dead)continue;
    var best=null,bdD=dt.rng;
    for(var ui2=0;ui2<units.length;ui2++){var u2=units[ui2];if(u2.dead||u2.team===dt.team)continue;var dd2=ds(dt,u2);if(dd2<bdD){bdD=dd2;best=u2}}
    if(best){dt.ang=Math.atan2(best.y-dt.y,best.x-dt.x)}
    if(best&&ts-dt.ls>dt.rl){dt.ls=ts;bul.push({x:dt.x+Math.cos(dt.ang)*10,y:dt.y+Math.sin(dt.ang)*10,vx:Math.cos(dt.ang)*9,vy:Math.sin(dt.ang)*9,dmg:dt.dmg,team:dt.team,life:70,type:'turret',sx:dt.x,sy:dt.y});addDust(dt.x+Math.cos(dt.ang)*10,dt.y+Math.sin(dt.ang)*10,2,'#888')}
  }

  for(var ci=0;ci<cities.length;ci++){
    var c=cities[ci];
    if(c.owner){
      var aliveTurrets=0;
      for(var ti=0;ti<c.turrets.length;ti++){if(!c.turrets[ti].dead)aliveTurrets++}
      var hasFriendly=false;
      for(var uf=0;uf<units.length;uf++){if(!units[uf].dead&&units[uf].team===c.owner&&ds(units[uf],c)<c.rad){hasFriendly=true;break}}
      if(aliveTurrets===0&&!hasFriendly){c.owner=null;c.capP=0;continue}
      for(var ti=0;ti<c.turrets.length;ti++){
        var tr=c.turrets[ti];if(tr.dead)continue;
        var bestC=null,bd2=tr.rng;
        for(var ui2=0;ui2<units.length;ui2++){var u2=units[ui2];if(u2.dead||u2.team===c.owner)continue;var dd2=ds(tr,u2);if(dd2<bd2){bd2=dd2;bestC=u2}}
        if(bestC){tr.ang=Math.atan2(bestC.y-tr.y,bestC.x-tr.x)}
        if(bestC&&ts-tr.ls>tr.rl){tr.ls=ts;bul.push({x:tr.x+Math.cos(tr.ang)*12,y:tr.y+Math.sin(tr.ang)*12,vx:Math.cos(tr.ang)*10,vy:Math.sin(tr.ang)*10,dmg:tr.dmg,team:c.owner,life:80,type:'turret',sx:tr.x,sy:tr.y});addDust(tr.x+Math.cos(tr.ang)*12,tr.y+Math.sin(tr.ang)*12,3,'#888')}
      }
      if(aliveTurrets>0){
        var bestCity=null,bdCity=400;
        for(var ui4=0;ui4<units.length;ui4++){var u4=units[ui4];if(u4.dead||u4.team===c.owner)continue;var ddc=ds(c,u4);if(ddc<bdCity){bdCity=ddc;bestCity=u4}}
        if(bestCity&&ts-c._lastFire>1200){c._lastFire=ts;var ac=Math.atan2(bestCity.y-c.y,bestCity.x-c.x);for(var si=0;si<3;si++){var sa=ac+(Math.random()-.5)*.2;bul.push({x:c.x+Math.cos(sa)*20,y:c.y+Math.sin(sa)*20,vx:Math.cos(sa)*9,vy:Math.sin(sa)*9,dmg:25,team:c.owner,life:70,type:'citygun',sx:c.x,sy:c.y});addSmoke(c.x+Math.cos(sa)*20,c.y+Math.sin(sa)*20,3)}shake=3}
      }
      if(tick%300===0){for(var ti2=0;ti2<c.turrets.length;ti2++){if(!c.turrets[ti2].dead)c.turrets[ti2].hp=Math.min(c.turrets[ti2].mx,c.turrets[ti2].hp+20)}}
    }
  }

  for(var ci2=0;ci2<cities.length;ci2++){
    var nb=cities[ci2];
    if(nb.owner)continue;
    var blueC=0,redC=0;
    for(var ui3=0;ui3<units.length;ui3++){
      var uu=units[ui3];if(uu.dead)continue;var dd3=ds(uu,nb);
      if(dd3<nb.rad){if(uu.team==='blue')blueC++;if(uu.team==='red')redC++}
    }
    var rate=.015+Math.max(blueC,redC)*.008;
    if(blueC>0&&redC===0){nb.capT='blue';nb.capP=Math.min(1,nb.capP+rate)}
    else if(redC>0&&blueC===0){nb.capT='red';nb.capP=Math.min(1,nb.capP+rate)}
    else if(blueC>0&&redC>0){nb.capP=Math.max(0,nb.capP-rate*.3);nb.capT=null}
    else{nb.capP=Math.max(0,nb.capP-.005);nb.capT=null}
    if(nb.capP>=1){nb.owner=nb.capT;nb.capP=0;nb.capT=null;for(var tj=0;tj<nb.turrets.length;tj++){nb.turrets[tj].dead=false;nb.turrets[tj].hp=nb.turrets[tj].mx}fx.push({x:nb.x,y:nb.y,r:0,mr:80,life:40,clr:nb.owner,big:true});shake=6;addSmoke(nb.x,nb.y,10)}
  }

  for(var bi=bul.length-1;bi>=0;bi--){
    var b=bul[bi];b.x+=b.vx;b.y+=b.vy;b.life--;var hit=false;
    if(b.type==='bomb'){
      if(b.grav)b.vy+=b.grav;
      if(b.life<=0){
        fx.push({x:b.x,y:b.y,r:0,mr:40,life:40,clr:b.team,big:true});shake=6;addSmoke(b.x,b.y,8);addDust(b.x,b.y,10,'#a84');
        for(var ui5=0;ui5<units.length;ui5++){var u5=units[ui5];if(u5.dead||u5.team===b.team)continue;if(ds(b,u5)<50){u5.hp-=b.dmg;if(u5.hp<=0){u5.dead=true;fx.push({x:u5.x,y:u5.y,r:0,mr:u5.sz*5,life:35,clr:b.team,big:true});addSmoke(u5.x,u5.y,5)}}}
        for(var ti5=0;ti5<defTurrets.length;ti5++){var dt5=defTurrets[ti5];if(!dt5.dead&&dt5.team!==b.team&&ds(b,dt5)<50){dt5.hp-=b.dmg;if(dt5.hp<=0){dt5.dead=true;fx.push({x:dt5.x,y:dt5.y,r:0,mr:25,life:20,clr:b.team,big:true})}}}
        bul.splice(bi,1);continue;
      }
      continue;
    }
    for(var ui4=0;ui4<units.length;ui4++){var u3=units[ui4];if(u3.dead||u3.team===b.team)continue;
      if(ds(b,u3)<u3.sz+5){u3.hp-=b.dmg;if(u3.hp<=0){u3.dead=true;fx.push({x:u3.x,y:u3.y,r:0,mr:u3.sz*5,life:35,clr:b.team,big:true});shake=4;addSmoke(u3.x,u3.y,6);addDust(u3.x,u3.y,8,b.team==='blue'?'#48f':'#f84')}else{addDust(b.x,b.y,3,'#ff8')}fx.push({x:b.x,y:b.y,r:0,mr:10,life:12,clr:b.team,big:false});hit=true;break}}
    if(!hit){var eb=bases[b.team==='blue'?'red':'blue'];if(eb.hp>0&&ds(b,eb)<40){eb.hp-=b.dmg;fx.push({x:b.x,y:b.y,r:0,mr:18,life:18,clr:b.team,big:true});shake=5;addSmoke(b.x,b.y,4);if(eb.hp<=0){over=true;showOv(b.team);shake=10}hit=true}}
    if(!hit){for(var ci3=0;ci3<cities.length;ci3++){var nb2=cities[ci3];
      for(var tk=0;tk<nb2.turrets.length;tk++){if(!nb2.turrets[tk].dead&&ds(b,nb2.turrets[tk])<14){nb2.turrets[tk].hp-=b.dmg;if(nb2.turrets[tk].hp<=0){nb2.turrets[tk].dead=true;fx.push({x:nb2.turrets[tk].x,y:nb2.turrets[tk].y,r:0,mr:30,life:25,clr:b.team,big:true});shake=3;addSmoke(nb2.turrets[tk].x,nb2.turrets[tk].y,5)}fx.push({x:b.x,y:b.y,r:0,mr:8,life:10,clr:b.team,big:false});hit=true;break}}
      if(hit)break}}
    if(!hit){for(var ddi=0;ddi<defTurrets.length;ddi++){var dtt=defTurrets[ddi];if(!dtt.dead&&ds(b,dtt)<14){dtt.hp-=b.dmg;if(dtt.hp<=0){dtt.dead=true;fx.push({x:dtt.x,y:dtt.y,r:0,mr:25,life:20,clr:b.team,big:true});shake=2;addSmoke(dtt.x,dtt.y,4)}fx.push({x:b.x,y:b.y,r:0,mr:8,life:10,clr:b.team,big:false});hit=true;break}}}
    if(hit||b.life<=0)bul.splice(bi,1);
  }

  for(var fi=fx.length-1;fi>=0;fi--){fx[fi].r+=fx[fi].big?3:1.5;fx[fi].life--;if(fx[fi].life<=0)fx.splice(fi,1)}
  units=units.filter(function(u){return!u.dead});
  ui();
}

function ui(){
  document.getElementById('bc').textContent=units.filter(function(u){return u.team==='blue'}).length;
  document.getElementById('rc').textContent=units.filter(function(u){return u.team==='red'}).length;
  document.getElementById('tl').textContent=team==='blue'?'Blue Team':'Red Team';
  document.getElementById('tl').style.background=team==='blue'?'rgba(74,158,255,.4)':'rgba(255,74,74,.4)';
  var sel=units.filter(function(u){return u.sel});var inf=document.getElementById('unit-info');
  if(sel.length>1){var tp={};sel.forEach(function(u){tp[u.type]=(tp[u.type]||0)+1});var p=[];for(var k in tp)p.push(k+'x'+tp[k]);inf.textContent=sel.length+': '+p.join(' ')}
  else if(sel.length===1){var u=sel[0];inf.textContent=u.type+' hp:'+Math.ceil(u.hp)+'/'+u.mx+' dmg:'+u.dmg+' rng:'+u.rng}
  else inf.textContent='';
  for(var gi=0;gi<3;gi++){var el=document.getElementById('gb'+gi);if(el){if(grps[gi]){el.style.borderColor=sel.length>0?'#ff0':'#4f4';el.style.color=sel.length>0?'#ff0':'#4f4'}else{el.style.borderColor='#666';el.style.color='#fff'}}}
  var ab=document.getElementById('airB');if(ab){var cd=airfields.blue.cooldown;if(cd>0){ab.textContent='AIR ('+Math.ceil(cd/60)+'s)';ab.style.opacity='.5'}else{ab.textContent='AIR STRIKE';ab.style.opacity='1'}}
}

function showOv(w){document.getElementById('ov').className='show';document.getElementById('wt').textContent=(w==='blue'?'BLUE':'RED')+' WINS!';document.getElementById('ws').textContent='Destroyed enemy base'}
function restart(){document.getElementById('ov').className='';init()}

function draw(){
  var gr=ctx.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1a3a1a');gr.addColorStop(.5,'#2d5a2d');gr.addColorStop(1,'#1a3a1a');
  ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);
  ctx.save();
  ctx.translate(~~(-cam.x+shakeX),~~(-cam.y+shakeY));

  var tg=ctx.createLinearGradient(0,0,MW,MH);tg.addColorStop(0,'#2a4a2a');tg.addColorStop(.5,'#3a6a3a');tg.addColorStop(1,'#2a4a2a');
  ctx.fillStyle=tg;ctx.fillRect(0,0,MW,MH);
  ctx.strokeStyle='#2a4a2a';ctx.lineWidth=.5;ctx.globalAlpha=.3;
  for(var gx=0;gx<MW;gx+=80){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,MH);ctx.stroke()}
  for(var gy=0;gy<MH;gy+=80){ctx.beginPath();ctx.moveTo(0,gy);ctx.lineTo(MW,gy);ctx.stroke()}
  ctx.globalAlpha=1;

  for(var ri=0;ri<rocks.length;ri++){var r=rocks[ri];ctx.save();ctx.translate(r.x,r.y);
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(2,3,r.s,r.s*.6,0,0,Math.PI*2);ctx.fill();
    var rg=ctx.createRadialGradient(-r.s*.2,-r.s*.2,0,0,0,r.s);rg.addColorStop(0,'#777');rg.addColorStop(1,'#3a3a30');ctx.fillStyle=rg;ctx.beginPath();ctx.ellipse(0,0,r.s,r.s*.6,0,0,Math.PI*2);ctx.fill();ctx.restore()}

  for(var ti=0;ti<trees.length;ti++){var t=trees[ti];ctx.save();ctx.translate(t.x,t.y);
    ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(3,t.s+4,t.s*.7,t.s*.3,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#5a3a1a';ctx.fillRect(-2,t.s*.3,4,t.s*.7);
    var lg=ctx.createRadialGradient(-t.s*.3,-t.s*.3,0,0,0,t.s);
    lg.addColorStop(0,'rgb('+(50+t.sh*50)+','+(110+t.sh*70)+','+(30+t.sh*30)+')');
    lg.addColorStop(1,'rgb('+(25+t.sh*30)+','+(60+t.sh*50)+','+(15+t.sh*25)+')');
    ctx.fillStyle=lg;ctx.beginPath();ctx.arc(0,0,t.s,0,Math.PI*2);ctx.fill();ctx.restore()}

  for(var ci=0;ci<cities.length;ci++)dCity(cities[ci]);
  dBase(bases.blue,'blue');dBase(bases.red,'red');
  dAirfield(airfields.blue);dAirfield(airfields.red);

  for(var ddi=0;ddi<defTurrets.length;ddi++){
    var dt=defTurrets[ddi];if(dt.dead)continue;
    for(var ddj=ddi+1;ddj<defTurrets.length;ddj++){
      var dt2=defTurrets[ddj];if(dt2.dead||dt.team!==dt2.team)continue;
      var dd=ds(dt,dt2);if(dd<160){
        var ang=Math.atan2(dt2.y-dt.y,dt2.x-dt.x);
        var px=-Math.sin(ang)*4,py=Math.cos(ang)*4;
        ctx.fillStyle=dt.team==='blue'?'#2a4a6a':'#6a2a2a';
        ctx.beginPath();ctx.moveTo(dt.x+px,dt.y+py);ctx.lineTo(dt2.x+px,dt2.y+py);ctx.lineTo(dt2.x-px,dt2.y-py);ctx.lineTo(dt.x-px,dt.y-py);ctx.closePath();ctx.fill();
        ctx.fillStyle='rgba(255,255,255,.06)';ctx.beginPath();ctx.moveTo(dt.x+px*.5,dt.y+py*.5);ctx.lineTo(dt2.x+px*.5,dt2.y+py*.5);ctx.lineTo(dt2.x,dt2.y);ctx.lineTo(dt.x,dt.y);ctx.closePath();ctx.fill();
      }
    }
    dDefTurret(dt);
  }

  for(var ui=0;ui<units.length;ui++)dUnit(units[ui]);
  for(var ai=0;ai<airplanes.length;ai++)dAirplane(airplanes[ai]);

  for(var bi=0;bi<bul.length;bi++){var b=bul[bi];
    if(b.type==='bomb')continue;
    if(b.type==='rocket'){
      ctx.strokeStyle=b.team==='blue'?'rgba(255,100,100,.5)':'rgba(255,200,50,.5)';ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(b.sx,b.sy);ctx.lineTo(b.x,b.y);ctx.stroke();
      var rg=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,8);rg.addColorStop(0,'#fff');rg.addColorStop(.2,'#ff0');rg.addColorStop(.5,b.team==='blue'?'#f66':'#fa0');rg.addColorStop(1,'rgba(255,50,0,0)');ctx.fillStyle=rg;ctx.beginPath();ctx.arc(b.x,b.y,8,0,Math.PI*2);ctx.fill();
    }else if(b.type==='citygun'){
      var cg=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,7);cg.addColorStop(0,'#fff');cg.addColorStop(.3,b.team==='blue'?'#6cf':'#fc6');cg.addColorStop(1,'rgba(255,150,0,0)');ctx.fillStyle=cg;ctx.beginPath();ctx.arc(b.x,b.y,7,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=b.team==='blue'?'rgba(100,180,255,.4)':'rgba(255,200,100,.4)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(b.sx,b.sy);ctx.lineTo(b.x,b.y);ctx.stroke();
    }else if(b.type==='mortar'){
      ctx.fillStyle='#555';ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#777';ctx.beginPath();ctx.arc(b.x-1,b.y-1,2.5,0,Math.PI*2);ctx.fill();
    }else if(b.type==='turret'){
      var tg2=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,5);tg2.addColorStop(0,'#ff8');tg2.addColorStop(.5,b.team==='blue'?'#4af':'#f84');tg2.addColorStop(1,'rgba(255,100,0,0)');ctx.fillStyle=tg2;ctx.beginPath();ctx.arc(b.x,b.y,5,0,Math.PI*2);ctx.fill();
    }else{
      var ig=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,4);ig.addColorStop(0,'#fff');ig.addColorStop(.4,b.team==='blue'?'#8cf':'#fc8');ig.addColorStop(1,'rgba(255,200,0,0)');ctx.fillStyle=ig;ctx.beginPath();ctx.arc(b.x,b.y,4,0,Math.PI*2);ctx.fill();
    }}

  for(var bi2=0;bi2<bul.length;bi2++){var b2=bul[bi2];
    if(b2.type==='bomb'){
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(b2.x+3,b2.y+40,6,2,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#333';ctx.beginPath();ctx.ellipse(b2.x,b2.y,3,6,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#555';ctx.fillRect(b2.x-1,b2.y-6,2,4);
    }}

  if(airTarget&&airTarget.pending){
    ctx.fillStyle='rgba(255,0,0,.6)';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
    ctx.fillText('CLICK MAP TO STRIKE',cam.x+W/2,cam.y+30);ctx.textAlign='start';
  }

  for(var di=0;di<dust.length;di++){var d=dust[di];ctx.globalAlpha=d.life/40;ctx.fillStyle=d.clr;ctx.beginPath();ctx.arc(d.x,d.y,d.sz,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
  for(var si=0;si<smokes.length;si++){var s=smokes[si];ctx.globalAlpha=s.ma*.3;ctx.fillStyle='#888';ctx.beginPath();ctx.arc(s.x,s.y,s.sz,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;

  for(var fi=0;fi<fx.length;fi++){var e=fx[fi];var ml=e.big?50:20;var a=Math.max(0,e.life/ml);
    if(e.big){
      var eg=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);eg.addColorStop(0,'rgba(255,255,220,'+a*.95+')');eg.addColorStop(.15,'rgba(255,220,80,'+a*.9+')');eg.addColorStop(.35,'rgba(255,130,30,'+a*.7+')');eg.addColorStop(.6,'rgba(200,40,0,'+a*.4+')');eg.addColorStop(.85,'rgba(120,20,0,'+a*.2+')');eg.addColorStop(1,'rgba(60,10,0,0)');ctx.fillStyle=eg;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(100,100,100,'+a*.3+')';ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.4,0,Math.PI*2);ctx.fill();
      for(var p=0;p<4;p++){var pa=Math.random()*Math.PI*2,pr=e.r*(.3+Math.random()*.7);ctx.fillStyle='rgba(255,'+~~(120+Math.random()*135)+',0,'+a*.6+')';ctx.beginPath();ctx.arc(e.x+Math.cos(pa)*pr,e.y+Math.sin(pa)*pr,e.r*.12,0,Math.PI*2);ctx.fill()}
    }else{
      var eg2=ctx.createRadialGradient(e.x,e.y,0,e.x,e.y,e.r);eg2.addColorStop(0,'rgba(255,255,200,'+a*.9+')');eg2.addColorStop(.5,'rgba(255,200,50,'+a*.6+')');eg2.addColorStop(1,'rgba(200,50,0,0)');ctx.fillStyle=eg2;ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,Math.PI*2);ctx.fill();
    }}

  if(boxS&&bs0&&bs1){
    var sx1=Math.min(bs0.x,bs1.x),sy1=Math.min(bs0.y,bs1.y),sw=Math.abs(bs1.x-bs0.x),sh=Math.abs(bs1.y-bs0.y);
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(sx1,sy1,sw,sh);
    ctx.strokeStyle='rgba(255,255,0,.8)';ctx.lineWidth=2;ctx.setLineDash([6,4]);ctx.strokeRect(sx1,sy1,sw,sh);ctx.setLineDash([])}
  ctx.restore();
}

function dDefTurret(tr){
  if(tr.dead)return;
  var c=CL[tr.team];
  var alive=tr.soldiers||2;
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(tr.x+3,tr.y+5,18,7,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#4a4235';ctx.beginPath();ctx.moveTo(tr.x-16,tr.y+4);ctx.lineTo(tr.x+16,tr.y+4);ctx.lineTo(tr.x+14,tr.y-2);ctx.lineTo(tr.x-14,tr.y-2);ctx.closePath();ctx.fill();
  ctx.fillStyle='#5a5245';ctx.beginPath();ctx.moveTo(tr.x-14,tr.y+2);ctx.lineTo(tr.x+14,tr.y+2);ctx.lineTo(tr.x+12,tr.y-1);ctx.lineTo(tr.x-12,tr.y-1);ctx.closePath();ctx.fill();
  var sg=ctx.createLinearGradient(tr.x,tr.y-6,tr.x,tr.y+2);sg.addColorStop(0,c.f);sg.addColorStop(1,c.d);ctx.fillStyle=sg;ctx.fillRect(tr.x-14,tr.y-6,28,8);
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(tr.x-14,tr.y-6,28,3);
  ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1;ctx.strokeRect(tr.x-14,tr.y-6,28,8);
  ctx.fillStyle='#3a3530';for(var si=0;si<alive;si++){var sx=tr.x-8+si*8;ctx.fillRect(sx,tr.y-10,4,6);ctx.fillStyle=c.skin;ctx.beginPath();ctx.arc(sx+2,tr.y-12,2.5,0,Math.PI*2);ctx.fill();ctx.fillStyle=c.f;ctx.fillRect(sx,tr.y-12,4,3)}
  ctx.save();ctx.translate(tr.x,tr.y);ctx.rotate(tr.ang);
  ctx.fillStyle='#555';ctx.fillRect(0,-2,20,4);ctx.fillStyle='#444';ctx.fillRect(17,-3,5,6);ctx.restore();
  var p=tr.hp/tr.mx;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(tr.x-10,tr.y-18,20,4);ctx.fillStyle=p>.5?'#4a4':p>.25?'#cc4':'#c44';ctx.fillRect(tr.x-10,tr.y-18,20*p,4);
}

function dBase(b,t){
  var c=CL[t];
  ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(b.x,b.y+45,55,18,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#3a3a3a';ctx.fillRect(b.x-50,b.y-20,100,45);
  var bg=ctx.createLinearGradient(b.x,b.y-20,b.x,b.y+25);bg.addColorStop(0,c.l);bg.addColorStop(.4,c.f);bg.addColorStop(1,c.d);ctx.fillStyle=bg;ctx.fillRect(b.x-48,b.y-18,96,41);
  ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(b.x-48,b.y-18,96,12);
  ctx.fillStyle=c.g;ctx.fillRect(b.x-12,b.y-10,24,24);
  ctx.fillStyle='#666';ctx.fillRect(b.x-4,b.y-2,8,8);ctx.strokeStyle=c.g;ctx.lineWidth=2;ctx.strokeRect(b.x-12,b.y-10,24,24);
  ctx.fillStyle=c.d;ctx.fillRect(b.x-45,b.y+15,90,6);ctx.fillStyle=c.f;ctx.fillRect(b.x-45,b.y+15,90*(b.hp/b.mx),6);
  ctx.fillStyle=c.f;ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText(t==='blue'?'BLUE HQ':'RED HQ',b.x,b.y+48);ctx.textAlign='start'}

function dCity(c){
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(c.x,c.y+5,c.rad+15,c.rad*.35,0,0,Math.PI*2);ctx.fill();
  var wg=ctx.createRadialGradient(c.x,c.y,c.rad*.3,c.x,c.y,c.rad+5);wg.addColorStop(0,'#5a5a4a');wg.addColorStop(.4,'#4a4a3a');wg.addColorStop(.8,'#3a3a2a');wg.addColorStop(1,'#2a2a1a');ctx.fillStyle=wg;ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.fill();

  if(c.owner){
    var cc=c.owner==='blue'?'rgba(74,158,255,':'rgba(255,74,74,';
    ctx.strokeStyle=cc+'0.9)';ctx.lineWidth=4;ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=cc+'0.2)';ctx.lineWidth=14;ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.stroke();
    var fg=c.owner==='blue'?'#4a9eff':'#ff4a4a';ctx.fillStyle=fg;ctx.fillRect(c.x+60,c.y-50,3,40);ctx.fillStyle=fg+'88';ctx.beginPath();ctx.moveTo(c.x+63,c.y-50);ctx.lineTo(c.x+83,c.y-40);ctx.lineTo(c.x+63,c.y-30);ctx.fill();
  }else if(c.capP>0){
    var clr=c.capT==='blue'?'#4a9eff':'#ff4a4a';
    ctx.strokeStyle=clr;ctx.lineWidth=3;ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle=clr+'66';ctx.lineWidth=10;ctx.beginPath();ctx.arc(c.x,c.y,c.rad,-Math.PI/2,-Math.PI/2+Math.PI*2*c.capP);ctx.stroke();
    ctx.fillStyle=clr;ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(~~(c.capP*100)+'%',c.x,c.y-c.rad-18);ctx.textAlign='start';
  }else{
    ctx.strokeStyle='#666';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(255,255,200,.15)';ctx.beginPath();ctx.arc(c.x,c.y,c.rad,0,Math.PI*2);ctx.fill();
  }

  for(var ri=0;ri<c.roads.length;ri++){var rd=c.roads[ri];
    ctx.strokeStyle='#555';ctx.lineWidth=10;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(rd.x1,rd.y1);ctx.lineTo(rd.x2,rd.y2);ctx.stroke();
    ctx.strokeStyle='#6a6a5a';ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(rd.x1,rd.y1);ctx.lineTo(rd.x2,rd.y2);ctx.stroke()}
  ctx.lineCap='butt';

  for(var bi=0;bi<c.blds.length;bi++){var b=c.blds[bi];
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(b.x+4,b.y+5,b.w,b.h);
    ctx.fillStyle='#444';ctx.fillRect(b.x-1,b.y+b.h,b.w+2,3);
    var bg2=ctx.createLinearGradient(b.x,b.y,b.x,b.y+b.h);bg2.addColorStop(0,b.c);bg2.addColorStop(1,'#3a2a1a');ctx.fillStyle=bg2;ctx.fillRect(b.x,b.y,b.w,b.h);
    ctx.fillStyle='rgba(255,255,200,.12)';ctx.fillRect(b.x+2,b.y+2,b.w-4,b.h*.25);
    ctx.fillStyle='#654321';ctx.fillRect(b.x-1,b.y-b.rh,b.w+2,b.rh);
    var ww=Math.min(~~(b.w/8),4);
    for(var wi=0;wi<ww;wi++){var wx=b.x+3+wi*(b.w/ww);ctx.fillStyle='rgba(180,200,230,.6)';ctx.fillRect(wx,b.y+b.h*.35,b.w/ww*.4,b.h*.3)}}

  for(var ti=0;ti<c.turrets.length;ti++){var tr=c.turrets[ti];if(tr.dead)continue;
    ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(tr.x+2,tr.y+4,11,6,0,0,Math.PI*2);ctx.fill();
    var tgr=ctx.createRadialGradient(tr.x-2,tr.y-2,1,tr.x,tr.y,10);tgr.addColorStop(0,'#999');tgr.addColorStop(1,'#444');ctx.fillStyle=tgr;ctx.beginPath();ctx.arc(tr.x,tr.y,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(tr.x,tr.y,6,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(tr.x,tr.y);ctx.rotate(tr.ang);ctx.fillStyle='#555';ctx.fillRect(0,-2,18,4);ctx.fillStyle='#444';ctx.fillRect(14,-3,5,6);ctx.restore();
    var tp2=tr.hp/tr.mx;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(tr.x-10,tr.y-16,20,5);ctx.fillStyle=tp2>.5?'#4a4':'#c44';ctx.fillRect(tr.x-10,tr.y-16,20*tp2,5)}

  ctx.font='bold 11px sans-serif';ctx.textAlign='center';
  if(!c.owner){ctx.fillStyle='#888';ctx.fillText('NEUTRAL CITY',c.x,c.y+c.rad+20)}
  else{ctx.fillStyle=CL[c.owner].f;ctx.fillText(c.owner==='blue'?'BLUE CITY':'RED CITY',c.x,c.y+c.rad+20)}
  ctx.textAlign='start';
}

function dUnit(u){
  var c=CL[u.team];ctx.save();ctx.translate(u.x,u.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(2,u.sz*.7+3,u.sz*.9,u.sz*.35,0,0,Math.PI*2);ctx.fill();
  if(u.sel){
    ctx.strokeStyle='rgba(255,255,0,.9)';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.beginPath();ctx.arc(0,0,u.sz+8,0,Math.PI*2);ctx.stroke();ctx.setLineDash([])}

  if(u.type==='infantry'){
    ctx.save();ctx.rotate(u.ang);
    ctx.fillStyle=c.d;ctx.beginPath();ctx.ellipse(0,0,u.sz*.5,u.sz*.35,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c.skin;ctx.beginPath();ctx.arc(0,-u.sz*.3,u.sz*.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c.f;ctx.beginPath();ctx.arc(0,-u.sz*.3,u.sz*.25,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c.arm;ctx.fillRect(-u.sz*.15,-u.sz*.1,u.sz*.6,2);
    ctx.restore();
  }else if(u.type==='tank'){
    ctx.save();ctx.rotate(u.ang);
    ctx.fillStyle=c.d;rr(-u.sz,-u.sz*.5,u.sz*2,u.sz,3);
    ctx.fillStyle=c.f;rr(-u.sz+2,-u.sz*.35,u.sz*2-4,u.sz*.7,2);
    ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(-u.sz+3,-u.sz*.35,u.sz*2-6,u.sz*.2);
    ctx.fillStyle=c.g;ctx.beginPath();ctx.arc(0,0,u.sz*.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#555';ctx.fillRect(0,-2,u.sz*1.4,4);ctx.fillStyle='#444';ctx.fillRect(u.sz*1.1,-3,4,6);
    ctx.restore();
  }else if(u.type==='apc'){
    ctx.save();ctx.rotate(u.ang);
    ctx.fillStyle=c.d;rr(-u.sz,-u.sz*.4,u.sz*2,u.sz*.8,3);
    ctx.fillStyle=c.f;rr(-u.sz+2,-u.sz*.3,u.sz*2-4,u.sz*.6,2);
    ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(-u.sz+4,-u.sz*.3,u.sz*2-8,u.sz*.2);
    ctx.restore();
  }else if(u.type==='mortar'){
    ctx.save();ctx.rotate(u.ang);
    ctx.fillStyle=c.d;rr(-u.sz,-u.sz*.45,u.sz*2,u.sz*.9,2);
    ctx.fillStyle=c.f;rr(-u.sz+2,-u.sz*.3,u.sz*2-4,u.sz*.6,2);
    ctx.fillStyle='#555';ctx.fillRect(u.sz*.2,-2,u.sz*.8,4);ctx.fillStyle='#444';ctx.fillRect(u.sz*.8,-4,4,8);
    ctx.restore();
  }else if(u.type==='rocket'){
    ctx.save();ctx.rotate(u.ang);
    ctx.fillStyle=c.d;ctx.beginPath();ctx.arc(0,0,u.sz,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=c.f;ctx.beginPath();ctx.arc(0,0,u.sz*.7,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ff0';ctx.fillRect(-2,-u.sz*.7,4,u.sz*.35);ctx.fillRect(-2,u.sz*.35,4,u.sz*.35);
    ctx.restore();
  }

  if(u.hp<u.mx){var p=u.hp/u.mx;ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-u.sz,-u.sz-10,u.sz*2,5);ctx.fillStyle=p>.5?'#4a4':p>.25?'#cc4':'#c44';ctx.fillRect(-u.sz,-u.sz-10,u.sz*2*p,5)}
  ctx.restore();
}

function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill()}
function s2w(sx,sy){return{x:sx+cam.x,y:sy+cam.y}}

function dAirfield(af){
  ctx.save();ctx.translate(af.x,af.y);
  ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(-40,12,82,14);
  ctx.fillStyle='#555';ctx.fillRect(-38,-20,76,40);
  ctx.fillStyle='#666';ctx.fillRect(-36,-18,72,36);
  ctx.strokeStyle='#888';ctx.lineWidth=2;ctx.strokeRect(-36,-18,72,36);
  ctx.fillStyle='#777';ctx.fillRect(-34,0,68,3);
  for(var i=-3;i<=3;i++){ctx.fillStyle='#444';ctx.fillRect(i*9-2,-14,4,28)}
  if(af.cooldown>0){ctx.fillStyle='rgba(255,0,0,.6)';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText('REARMING',0,-28);ctx.textAlign='start'}
  var clr=CL[af.team];ctx.fillStyle=clr.d;ctx.beginPath();ctx.arc(0,-28,6,0,Math.PI*2);ctx.fill();ctx.fillStyle=clr.f;ctx.beginPath();ctx.arc(0,-28,4,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function dAirplane(a){
  ctx.save();ctx.translate(a.x,a.y);
  ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.ellipse(4,12,10,4,0,0,Math.PI*2);ctx.fill();
  ctx.save();ctx.rotate(a.ang);
  var cl=CL[a.team];
  ctx.fillStyle=cl.d;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-8);ctx.lineTo(-6,0);ctx.lineTo(-8,8);ctx.closePath();ctx.fill();
  ctx.fillStyle=cl.f;ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(-8,-8);ctx.lineTo(-6,0);ctx.closePath();ctx.fill();
  ctx.fillStyle='#ff0';ctx.fillRect(-2,-9,3,4);ctx.fillRect(-2,5,3,4);
  ctx.restore();
  ctx.restore();
}

var tS=null,tM=false,boxS=false,bs0=null,bs1=null,boxMoved=false;

function hTap(sx,sy){
  var w=s2w(sx,sy);
  if(airTarget&&airTarget.pending){
    airTarget.x=w.x;airTarget.y=w.y;airTarget.pending=false;
    spawnAirplane(airTarget.team,w.x,w.y);airTarget=null;
    document.getElementById('unit-info').textContent='Air strike inbound!';return;
  }
  var hu=null;
  for(var i=0;i<units.length;i++){var u=units[i];if(u.team===team&&!u.dead&&ds(w,u)<u.sz+15){hu=u;break}}
  if(hu){units.forEach(function(u){u.sel=false});hu.sel=true;ui();return}
  var he=null;for(var j=0;j<units.length;j++){var ue=units[j];if(ue.team!==team&&!ue.dead&&ds(w,ue)<ue.sz+15){he=ue;break}}
  var hc=null;if(!he){for(var ci=0;ci<cities.length;ci++){var c=cities[ci];if(c.owner&&c.owner!==team&&ds(w,c)<c.rad){hc=c;break}}}
  var hb=null;if(!he&&!hc){var eb=bases[team==='blue'?'red':'blue'];if(eb.hp>0&&ds(w,eb)<50)hb=eb}
  var sel=units.filter(function(u){return u.sel});
  if(sel.length>0){
    if(he||hc||hb){var tgt2=he||hc||hb;sel.forEach(function(u){u.man=true;u.atk=tgt2;u.dest=null;u.tgt=null})}
    else{sel.forEach(function(u,i){var a=sel.length>1?(i/sel.length)*Math.PI*2:0;var r=sel.length>1?Math.sqrt(i)*22:0;u.dest={x:w.x+Math.cos(a)*r,y:w.y+Math.sin(a)*r};u.man=true;u.atk=null;u.tgt=null})}
  }else units.forEach(function(u){u.sel=false});
}

function hBox(){if(!bs0||!bs1)return;var dx=Math.abs(bs1.x-bs0.x),dy=Math.abs(bs1.y-bs0.y);if(dx<10&&dy<10)return;
  var wx1=Math.min(bs0.x,bs1.x)+cam.x,wy1=Math.min(bs0.y,bs1.y)+cam.y;
  var wx2=Math.max(bs0.x,bs1.x)+cam.x,wy2=Math.max(bs0.y,bs1.y)+cam.y;
  units.forEach(function(u){if(u.team===team&&!u.dead&&u.x>=wx1&&u.x<=wx2&&u.y>=wy1&&u.y<=wy2)u.sel=true});ui()}

C.addEventListener('mousedown',function(e){if(over)return;
  if(e.button===2||e.button===1){tS={x:e.clientX,y:e.clientY};tM=false;boxS=false;return}
  tS={x:e.clientX,y:e.clientY};tM=false;boxS=false;boxMoved=false;
  var w=s2w(e.clientX,e.clientY);var ou=false;
  for(var i=0;i<units.length;i++){if(units[i].team===team&&!units[i].dead&&ds(w,units[i])<units[i].sz+15){ou=true;break}}
  if(!ou){boxS=true;bs0={x:e.clientX,y:e.clientY};bs1={x:e.clientX,y:e.clientY}}
});
C.addEventListener('mousemove',function(e){if(!tS)return;
  if(boxS){bs1={x:e.clientX,y:e.clientY};boxMoved=true;return}
  var dx=e.clientX-tS.x,dy=e.clientY-tS.y;
  cam.x-=dx;cam.y-=dy;cam.x=Math.max(0,Math.min(MW-W,cam.x));cam.y=Math.max(0,Math.min(MH-H,cam.y));
  tS={x:e.clientX,y:e.clientY};
});
C.addEventListener('mouseup',function(e){if(!tS)return;
  if(boxS){
    if(boxMoved){hBox()}
    else{hTap(e.clientX,e.clientY)}
    boxS=false;bs0=null;bs1=null;
  }else if(e.button===0){hTap(e.clientX,e.clientY)}
  tS=null;
});
C.addEventListener('touchstart',function(e){e.preventDefault();if(over)return;if(e.touches.length===1){var t=e.touches[0];tS={x:t.clientX,y:t.clientY};tM=false;boxS=false;boxMoved=false}},{passive:false});
C.addEventListener('touchmove',function(e){e.preventDefault();if(!tS||e.touches.length!==1)return;var t=e.touches[0];
  var dx=t.clientX-tS.x,dy=t.clientY-tS.y;
  if(!boxMoved&&Math.abs(dx)>8||Math.abs(dy)>8)boxMoved=true;
  cam.x-=dx;cam.y-=dy;cam.x=Math.max(0,Math.min(MW-W,cam.x));cam.y=Math.max(0,Math.min(MH-H,cam.y));
  tS={x:t.clientX,y:t.clientY}},{passive:false});
C.addEventListener('touchend',function(e){e.preventDefault();if(!tS)return;
  if(!boxMoved){hTap(e.changedTouches[0].clientX,e.changedTouches[0].clientY)}
  tS=null},{passive:false});
C.addEventListener('contextmenu',function(e){e.preventDefault()});
document.addEventListener('keydown',function(e){if(e.key>='1'&&e.key<='3'){var idx=parseInt(e.key)-1;grpClick(idx)}if(e.key==='a'||e.key==='A')selAll();if(e.key==='Escape')deselAll()});

function loop(ts){update(ts);draw();requestAnimationFrame(loop)}
init();requestAnimationFrame(loop);
