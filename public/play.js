// Open Dungeons — browser game (TD + action, top-down).
// Captures core loop from design doc §3: prep → combat → result, mana, towers, waves.
(() => {
"use strict";

// ===== data =====
const JOBS = [
  { id:"knight",    role:"盾 TANK",    accent:"#c89b3c", name:"騎士",    desc:"硬く、塔費用を割引。", hp:180, mp:60, atk:14, def:10, spd:170, color:"#c89b3c", weapon:"melee", manaDiscount:0.85, range:36, attackCd:0.45, attackDmg:18 },
  { id:"berserker", role:"剣 MELEE",   accent:"#b13030", name:"狂戦士",  desc:"高火力近接、被弾はやや脆い。", hp:130, mp:50, atk:26, def:5,  spd:210, color:"#b13030", weapon:"melee", manaDiscount:1.0, range:42, attackCd:0.32, attackDmg:32 },
  { id:"ranger",    role:"弓 RANGE",   accent:"#7ea860", name:"レンジャー", desc:"遠距離。マナ獲得 +25%。", hp:110, mp:80, atk:18, def:5, spd:200, color:"#7ea860", weapon:"ranged", manaDiscount:1.0, range:340, attackCd:0.45, attackDmg:20, manaBonus:1.25 },
  { id:"wizard",    role:"杖 SUPPORT", accent:"#7a8cc4", name:"魔術師",  desc:"範囲魔法と凍結。MP多め。", hp:95, mp:140, atk:10, def:4, spd:185, color:"#7a8cc4", weapon:"magic",  manaDiscount:1.0, range:260, attackCd:0.6,  attackDmg:24, splash:36 },
];

const TOWERS = [
  { id:"arrow",   name:"矢の塔",   cost:50, range:170, cd:0.55, dmg:14, color:"#c89b3c", proj:"#e6c275", effect:null },
  { id:"frost",   name:"氷結の塔", cost:80, range:140, cd:1.1,  dmg:8,  color:"#7a8cc4", proj:"#a8c8ff", effect:"slow" },
  { id:"bulwark", name:"城壁塔",   cost:60, range:0,   cd:0,    dmg:0,  color:"#7a6b53", proj:null,      effect:"wall", hp:160 },
  { id:"spike",   name:"棘の罠",   cost:35, range:48,  cd:0.4,  dmg:22, color:"#b13030", proj:null,      effect:"melee" },
];

const ENEMIES = {
  goblin:   { hp:30,  spd:60, dmg:8,  reward:6,  color:"#7ea860", r:9 },
  orc:      { hp:90,  spd:42, dmg:18, reward:14, color:"#9c5a2a", r:13 },
  wraith:   { hp:50,  spd:90, dmg:14, reward:18, color:"#a070c0", r:10, ghost:true },
  gargoyle: { hp:70,  spd:78, dmg:10, reward:20, color:"#6b6b6b", r:11 },
  boss:     { hp:1800, spd:36, dmg:38, reward:300, color:"#b13030", r:24, boss:true },
};

const WAVES = [
  [["goblin",8]],
  [["goblin",10],["orc",2]],
  [["goblin",6],["wraith",4],["orc",3]],
  [["orc",5],["gargoyle",4],["wraith",6]],
  [["boss",1],["gargoyle",6]],
];

// ===== state =====
const state = {
  job: null,
  phase: "menu",   // menu | prep | combat | result
  prepTime: 15,
  wave: 0,
  mana: 200,
  player: null,
  core: null,
  enemies: [],
  towers: [],
  projectiles: [],
  particles: [],
  selectedTower: 0,
  keys: new Set(),
  mouse: { x: 0, y: 0, down: false, rdown: false },
  lastT: 0,
  paused: false,
  spawnQueue: [],
  spawnTimer: 0,
  stats: { kills: 0, towersBuilt: 0, manaGained: 0, dmgDealt: 0 },
  ePressed: false, fPressed: false,
  eCD: 0, fCD: 0,
  freezeTimer: 0,
  ironGuardTimer: 0,
};

// ===== DOM =====
const $ = (s) => document.querySelector(s);
const cv = $("#cv");
const ctx = cv.getContext("2d");
const W = cv.width, H = cv.height;

// ===== menu =====
function renderMenu() {
  const host = $("#jobs");
  host.innerHTML = "";
  JOBS.forEach((j) => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.style.setProperty("--accent", j.accent);
    card.innerHTML = `
      <div class="role">— ${j.role} —</div>
      <div class="name">${j.name}</div>
      <div class="desc">${j.desc}</div>
      <div class="stats">
        <span>HP <b>${j.hp}</b></span>
        <span>ATK <b>${j.atk}</b></span>
        <span>DEF <b>${j.def}</b></span>
      </div>
    `;
    card.addEventListener("click", () => {
      document.querySelectorAll(".job-card").forEach(e => e.classList.remove("selected"));
      card.classList.add("selected");
      state.job = j;
      $("#startBtn").disabled = false;
    });
    host.appendChild(card);
  });
  $("#startBtn").addEventListener("click", startGame);
}
renderMenu();

// ===== start =====
function startGame() {
  if (!state.job) return;
  $("#screen").classList.add("hidden");
  $("#game").classList.remove("hidden");

  state.player = {
    x: W*0.3, y: H*0.5,
    r: 11,
    hp: state.job.hp, hpMax: state.job.hp,
    mp: state.job.mp, mpMax: state.job.mp,
    atkCd: 0,
    facing: 0,
  };
  state.core = { x: W*0.18, y: H*0.5, r: 22, hp: 1000, hpMax: 1000 };

  renderDock();
  beginPrep();

  state.lastT = performance.now();
  requestAnimationFrame(loop);
}

function renderDock() {
  const host = $("#towerDock");
  host.innerHTML = "";
  TOWERS.forEach((t, i) => {
    const slot = document.createElement("div");
    slot.className = "dock-slot" + (i === state.selectedTower ? " selected" : "");
    const cost = Math.round(t.cost * (state.job.manaDiscount || 1));
    slot.innerHTML = `
      <div class="num">${i+1}</div>
      <div class="nm">${t.name}</div>
      <div class="ct">マナ ${cost}</div>
    `;
    slot.addEventListener("click", () => { state.selectedTower = i; renderDock(); });
    host.appendChild(slot);
  });
}

// ===== input =====
document.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  state.keys.add(k);
  if (k === " ") { e.preventDefault(); if (state.phase === "prep") beginCombat(); }
  if (k === "p") state.paused = !state.paused;
  if (k >= "1" && k <= "4") { state.selectedTower = parseInt(k,10)-1; renderDock(); }
  if (k === "e" && state.eCD <= 0) { state.ePressed = true; }
  if (k === "f" && state.fCD <= 0) { state.fPressed = true; }
});
document.addEventListener("keyup", (e) => { state.keys.delete(e.key.toLowerCase()); });

cv.addEventListener("mousemove", (e) => {
  const r = cv.getBoundingClientRect();
  state.mouse.x = (e.clientX - r.left) * (W / r.width);
  state.mouse.y = (e.clientY - r.top) * (H / r.height);
});
cv.addEventListener("mousedown", (e) => {
  if (e.button === 0) state.mouse.down = true;
  if (e.button === 2) state.mouse.rdown = true;
});
cv.addEventListener("mouseup", (e) => {
  if (e.button === 0) state.mouse.down = false;
  if (e.button === 2) state.mouse.rdown = false;
});
cv.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  if (state.phase === "prep") tryPlaceTower(state.mouse.x, state.mouse.y);
});

// ===== phases =====
function beginPrep() {
  state.phase = "prep";
  state.prepTime = state.wave === 0 ? 12 : 10;
  $("#phaseTxt").textContent = "準備フェーズ";
  $("#dockHint").innerHTML = "準備中：塔を選んで<b>右クリック</b>で設置 ／ <b>Space</b>で戦闘開始";
}
function beginCombat() {
  state.phase = "combat";
  state.wave++;
  $("#phaseTxt").textContent = `戦闘 ／ ウェーブ ${state.wave}`;
  $("#dockHint").innerHTML = "戦闘中：敵を殲滅せよ。 <b>E</b>=スキル <b>F</b>=アルティメット";
  state.spawnQueue = [];
  const tpl = WAVES[state.wave-1] || WAVES[WAVES.length-1];
  tpl.forEach(([type, n]) => { for (let i = 0; i < n; i++) state.spawnQueue.push(type); });
  state.spawnTimer = 0;
}
function endGame(win) {
  state.phase = "result";
  $("#game").classList.add("hidden");
  $("#result").classList.remove("hidden");
  $("#resultTitle").textContent = win ? "勝利" : "敗北";
  $("#resultText").textContent = win
    ? "結界石は守られた。魔王は退いた ── しばしの間。"
    : "結界石は崩れ落ちた。闇が、地を覆う。";
  const s = state.stats;
  $("#resultStats").innerHTML = `
    <li><span>到達ウェーブ</span><b>${state.wave}</b></li>
    <li><span>撃破数</span><b>${s.kills}</b></li>
    <li><span>建設した塔</span><b>${s.towersBuilt}</b></li>
    <li><span>獲得マナ累計</span><b>${s.manaGained}</b></li>
    <li><span>与ダメージ</span><b>${Math.floor(s.dmgDealt)}</b></li>
  `;
}

// ===== towers =====
function tryPlaceTower(x, y) {
  const def = TOWERS[state.selectedTower];
  const cost = Math.round(def.cost * (state.job.manaDiscount || 1));
  if (state.mana < cost) return spark(x, y, "#b13030");
  // distance constraint: not too close to core, not overlapping
  if (dist(x, y, state.core.x, state.core.y) < 50) return spark(x, y, "#b13030");
  for (const t of state.towers) if (dist(x,y,t.x,t.y) < 30) return spark(x, y, "#b13030");
  state.mana -= cost;
  state.stats.towersBuilt++;
  state.towers.push({
    x, y, def,
    cd: 0,
    hp: def.effect === "wall" ? def.hp : 60,
    hpMax: def.effect === "wall" ? def.hp : 60,
  });
  spark(x, y, def.color);
}

// ===== enemy spawn =====
function spawnEnemy(type) {
  const e = ENEMIES[type];
  const side = Math.random();
  let x, y;
  if (side < 0.5) { x = W - 20; y = 60 + Math.random() * (H - 120); }
  else { x = 60 + Math.random() * (W - 120); y = (Math.random() < 0.5 ? 20 : H - 20); }
  state.enemies.push({
    type, x, y,
    r: e.r,
    hp: e.hp, hpMax: e.hp,
    spd: e.spd, dmg: e.dmg, reward: e.reward,
    color: e.color, ghost: !!e.ghost, boss: !!e.boss,
    atkCd: 0, slowT: 0,
  });
}

// ===== utils =====
function dist(ax,ay,bx,by){ return Math.hypot(ax-bx, ay-by); }
function spark(x,y,col,n=10){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2,s=40+Math.random()*120; state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:0.5+Math.random()*0.3,age:0,col});} }
function damageNumber(x,y,n,col="#e6c275"){ state.particles.push({x,y,vx:0,vy:-40,life:0.7,age:0,col,text:String(Math.floor(n))}); }

// ===== loop =====
function loop(now) {
  const dt = Math.min(0.05, (now - state.lastT) / 1000);
  state.lastT = now;
  if (!state.paused && state.phase !== "result") update(dt);
  render();
  if (state.phase !== "result") requestAnimationFrame(loop);
}

// ===== update =====
function update(dt) {
  // cooldowns
  state.eCD = Math.max(0, state.eCD - dt);
  state.fCD = Math.max(0, state.fCD - dt);
  state.freezeTimer = Math.max(0, state.freezeTimer - dt);
  state.ironGuardTimer = Math.max(0, state.ironGuardTimer - dt);

  // phase
  if (state.phase === "prep") {
    state.prepTime -= dt;
    $("#phaseSub").textContent = `次のウェーブまで ${state.prepTime.toFixed(1)} 秒（Spaceで即開始）`;
    if (state.prepTime <= 0) beginCombat();
  } else if (state.phase === "combat") {
    // spawn
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.spawnQueue.length > 0) {
      spawnEnemy(state.spawnQueue.shift());
      state.spawnTimer = 0.55;
    }
    $("#phaseSub").textContent = `残り敵 ${state.enemies.length + state.spawnQueue.length}`;
    if (state.spawnQueue.length === 0 && state.enemies.length === 0) {
      if (state.wave >= WAVES.length) return endGame(true);
      beginPrep();
    }
  }

  // player
  const p = state.player;
  const mv = { x: 0, y: 0 };
  if (state.keys.has("w")) mv.y -= 1;
  if (state.keys.has("s")) mv.y += 1;
  if (state.keys.has("a")) mv.x -= 1;
  if (state.keys.has("d")) mv.x += 1;
  const len = Math.hypot(mv.x, mv.y);
  if (len > 0) { mv.x /= len; mv.y /= len; }
  p.x = Math.max(p.r, Math.min(W - p.r, p.x + mv.x * state.job.spd * dt));
  p.y = Math.max(p.r, Math.min(H - p.r, p.y + mv.y * state.job.spd * dt));
  p.facing = Math.atan2(state.mouse.y - p.y, state.mouse.x - p.x);
  p.atkCd = Math.max(0, p.atkCd - dt);

  // attacks (left click)
  if (state.mouse.down && p.atkCd <= 0) {
    doPlayerAttack(p);
  }

  // skills
  if (state.ePressed) {
    state.ePressed = false;
    triggerSkillE();
  }
  if (state.fPressed) {
    state.fPressed = false;
    triggerSkillF();
  }

  // mana regen during combat (slow)
  if (state.phase === "combat") {
    state.mana += dt * 4;
  }

  // mp regen
  p.mp = Math.min(p.mpMax, p.mp + dt * 5);

  // towers
  for (const t of state.towers) {
    if (t.def.effect === "wall") continue;
    t.cd = Math.max(0, t.cd - dt);
    if (t.cd > 0) continue;
    // find target
    let best = null, bd = t.def.range;
    for (const e of state.enemies) {
      const d = dist(t.x, t.y, e.x, e.y);
      if (d < bd) { best = e; bd = d; }
    }
    if (!best) continue;
    t.cd = t.def.cd;
    if (t.def.effect === "melee") {
      hitEnemy(best, t.def.dmg, t.x, t.y);
    } else {
      const a = Math.atan2(best.y - t.y, best.x - t.x);
      state.projectiles.push({
        x: t.x, y: t.y, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460,
        dmg: t.def.dmg, life: 1.5, col: t.def.proj, effect: t.def.effect, source: "tower",
      });
    }
  }

  // projectiles
  for (const pr of state.projectiles) {
    pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
    if (pr.x < 0 || pr.x > W || pr.y < 0 || pr.y > H) pr.life = 0;
    for (const e of state.enemies) {
      if (dist(pr.x, pr.y, e.x, e.y) < e.r + 4) {
        hitEnemy(e, pr.dmg, pr.x, pr.y, pr.effect);
        pr.life = 0;
        break;
      }
    }
  }
  state.projectiles = state.projectiles.filter(p => p.life > 0);

  // enemies
  for (const e of state.enemies) {
    e.slowT = Math.max(0, e.slowT - dt);
    e.atkCd = Math.max(0, e.atkCd - dt);
    // target: core (priority) or player if close
    const distPlayer = dist(e.x, e.y, p.x, p.y);
    let target = state.core;
    if (distPlayer < 130) target = p;
    // walls intercept (non-ghost)
    if (!e.ghost) {
      for (const t of state.towers) {
        if (t.def.effect !== "wall") continue;
        if (dist(e.x, e.y, t.x, t.y) < e.r + 16 && dist(t.x,t.y,target.x,target.y) < dist(e.x,e.y,target.x,target.y)) {
          target = t;
          break;
        }
      }
    }
    const a = Math.atan2(target.y - e.y, target.x - e.x);
    const slowK = (e.slowT > 0 || state.freezeTimer > 0) ? 0.4 : 1;
    e.x += Math.cos(a) * e.spd * slowK * dt;
    e.y += Math.sin(a) * e.spd * slowK * dt;
    // attack
    const td = dist(e.x, e.y, target.x, target.y);
    if (td < e.r + (target.r || 18) + 2 && e.atkCd <= 0) {
      e.atkCd = 0.9;
      let dmg = e.dmg;
      if (target === p && state.ironGuardTimer > 0) dmg *= 0.3;
      if (target.hp !== undefined) {
        target.hp -= dmg;
        damageNumber(target.x, target.y - 20, dmg, "#ff8888");
      }
    }
  }
  // remove dead enemies & loot
  state.enemies = state.enemies.filter(e => {
    if (e.hp > 0) return true;
    state.stats.kills++;
    const m = Math.round(e.reward * (state.job.manaBonus || 1));
    state.mana += m;
    state.stats.manaGained += m;
    spark(e.x, e.y, e.color, 18);
    damageNumber(e.x, e.y - 8, m, "#e6c275");
    return false;
  });

  // remove dead towers
  state.towers = state.towers.filter(t => t.hp > 0);

  // particles
  for (const pt of state.particles) {
    pt.age += dt;
    pt.x += pt.vx * dt;
    pt.y += pt.vy * dt;
    pt.vy += 60 * dt;
  }
  state.particles = state.particles.filter(p => p.age < p.life);

  // win/lose
  if (state.core.hp <= 0) return endGame(false);
  if (p.hp <= 0) {
    // respawn at core after short delay
    p.hp = p.hpMax * 0.4;
    p.x = state.core.x + 50; p.y = state.core.y;
    spark(p.x, p.y, "#fff", 24);
  }

  // HUD
  $("#hpFill").style.width = `${Math.max(0,(p.hp/p.hpMax)*100)}%`;
  $("#mpFill").style.width = `${(p.mp/p.mpMax)*100}%`;
  $("#coreFill").style.width = `${Math.max(0,(state.core.hp/state.core.hpMax)*100)}%`;
  $("#hpTxt").textContent = `${Math.max(0,Math.floor(p.hp))} / ${p.hpMax}`;
  $("#mpTxt").textContent = `${Math.floor(p.mp)} / ${p.mpMax}`;
  $("#coreTxt").textContent = `${Math.max(0,Math.floor(state.core.hp))} / ${state.core.hpMax}`;
  $("#manaTxt").textContent = Math.floor(state.mana);
  $("#waveTxt").textContent = `${state.wave} / ${WAVES.length}`;
}

function doPlayerAttack(p) {
  const j = state.job;
  p.atkCd = j.attackCd;
  if (j.weapon === "melee") {
    // arc hit in facing direction
    const ar = j.range;
    let hit = false;
    for (const e of state.enemies) {
      const dx = e.x - p.x, dy = e.y - p.y;
      const d = Math.hypot(dx, dy);
      if (d > ar + e.r) continue;
      const ang = Math.atan2(dy, dx);
      let diff = ang - p.facing;
      while (diff > Math.PI) diff -= Math.PI*2;
      while (diff < -Math.PI) diff += Math.PI*2;
      if (Math.abs(diff) < Math.PI/3) {
        hitEnemy(e, j.attackDmg, e.x, e.y);
        hit = true;
      }
    }
    if (hit) spark(p.x + Math.cos(p.facing)*ar*0.6, p.y + Math.sin(p.facing)*ar*0.6, "#e6c275", 6);
  } else {
    // projectile
    state.projectiles.push({
      x: p.x, y: p.y,
      vx: Math.cos(p.facing) * 520, vy: Math.sin(p.facing) * 520,
      dmg: j.attackDmg, life: 1.2, col: j.color,
      effect: j.weapon === "magic" ? "splash" : null,
      splash: j.splash || 0,
      source: "player",
    });
  }
}

function hitEnemy(e, dmg, sx, sy, effect) {
  e.hp -= dmg;
  state.stats.dmgDealt += dmg;
  damageNumber(sx, sy - 12, dmg);
  if (effect === "slow") e.slowT = 2.0;
  if (effect === "splash") {
    for (const o of state.enemies) {
      if (o === e) continue;
      if (dist(o.x, o.y, sx, sy) < 36) {
        o.hp -= dmg * 0.4;
        state.stats.dmgDealt += dmg * 0.4;
        damageNumber(o.x, o.y - 12, dmg * 0.4);
      }
    }
  }
}

function triggerSkillE() {
  const p = state.player;
  if (p.mp < 20) return;
  p.mp -= 20;
  state.eCD = 4;
  // ranger: snare; wizard: ice nova; knight: iron guard; berserker: cleave
  if (state.job.id === "ranger") {
    for (const e of state.enemies) if (dist(e.x,e.y,p.x,p.y) < 220) e.slowT = 3;
    spark(p.x, p.y, "#7ea860", 30);
  } else if (state.job.id === "wizard") {
    for (const e of state.enemies) if (dist(e.x,e.y,p.x,p.y) < 180) { e.hp -= 50; e.slowT = 2.5; damageNumber(e.x,e.y,50,"#a8c8ff"); state.stats.dmgDealt += 50; }
    spark(p.x, p.y, "#a8c8ff", 40);
  } else if (state.job.id === "knight") {
    state.ironGuardTimer = 5;
    spark(p.x, p.y, "#c89b3c", 24);
  } else { // berserker
    for (const e of state.enemies) if (dist(e.x,e.y,p.x,p.y) < 90) { e.hp -= 60; damageNumber(e.x,e.y,60,"#b13030"); state.stats.dmgDealt += 60; }
    spark(p.x, p.y, "#b13030", 30);
  }
}

function triggerSkillF() {
  const p = state.player;
  if (p.mp < 50) return;
  p.mp -= 50;
  state.fCD = 18;
  // global freeze + heavy aoe
  state.freezeTimer = 3.5;
  for (const e of state.enemies) {
    const d = dist(e.x,e.y,p.x,p.y);
    if (d < 320) {
      const dmg = 120 * (state.job.id === "wizard" ? 1.4 : 1);
      e.hp -= dmg; state.stats.dmgDealt += dmg;
      damageNumber(e.x, e.y, dmg, "#fff8e2");
    }
  }
  spark(p.x, p.y, "#fff8e2", 80);
}

// ===== render =====
function render() {
  // ground
  ctx.fillStyle = "#0a0805";
  ctx.fillRect(0,0,W,H);
  // floor tiles (parchment-y grid)
  ctx.strokeStyle = "rgba(200,155,60,0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

  // core (鎖石)
  const c = state.core;
  ctx.save();
  ctx.translate(c.x, c.y);
  const t = performance.now() / 1000;
  ctx.rotate(t * 0.3);
  ctx.fillStyle = "rgba(200,155,60,0.18)";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.lineTo(Math.cos(a) * (c.r + 8), Math.sin(a) * (c.r + 8));
  }
  ctx.closePath(); ctx.fill();
  ctx.rotate(-t * 0.6);
  ctx.strokeStyle = "#c89b3c"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(0, 0, c.r, 0, Math.PI*2); ctx.stroke();
  ctx.fillStyle = "rgba(200,155,60,0.35)";
  ctx.beginPath(); ctx.arc(0, 0, c.r - 6, 0, Math.PI*2); ctx.fill();
  ctx.restore();

  // freeze tint
  if (state.freezeTimer > 0) {
    ctx.fillStyle = `rgba(168,200,255,${0.12 * (state.freezeTimer/3.5)})`;
    ctx.fillRect(0,0,W,H);
  }

  // towers
  for (const tw of state.towers) {
    ctx.save();
    if (tw.def.effect === "wall") {
      ctx.fillStyle = "#5a4830";
      ctx.fillRect(tw.x - 14, tw.y - 14, 28, 28);
      ctx.strokeStyle = "#c89b3c"; ctx.strokeRect(tw.x - 14, tw.y - 14, 28, 28);
    } else {
      ctx.fillStyle = tw.def.color;
      ctx.beginPath(); ctx.arc(tw.x, tw.y, 12, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = "#0c0a08"; ctx.lineWidth = 1.5; ctx.stroke();
      // range ring during prep
      if (state.phase === "prep" && tw.def.range > 0) {
        ctx.strokeStyle = `${tw.def.color}55`;
        ctx.beginPath(); ctx.arc(tw.x, tw.y, tw.def.range, 0, Math.PI*2); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // placement preview during prep
  if (state.phase === "prep" && state.mouse.x > 0) {
    const def = TOWERS[state.selectedTower];
    ctx.save();
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.arc(state.mouse.x, state.mouse.y, 12, 0, Math.PI*2); ctx.fill();
    if (def.range > 0) {
      ctx.strokeStyle = `${def.color}55`;
      ctx.beginPath(); ctx.arc(state.mouse.x, state.mouse.y, def.range, 0, Math.PI*2); ctx.stroke();
    }
    ctx.restore();
  }

  // enemies
  for (const e of state.enemies) {
    ctx.save();
    if (e.slowT > 0 || state.freezeTimer > 0) {
      ctx.shadowColor = "#a8c8ff"; ctx.shadowBlur = 8;
    }
    ctx.fillStyle = e.ghost ? `${e.color}aa` : e.color;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#0c0a08"; ctx.lineWidth = 1.5; ctx.stroke();
    // hp bar
    const w = e.r * 2.2;
    const pct = e.hp / e.hpMax;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(e.x - w/2, e.y - e.r - 8, w, 3);
    ctx.fillStyle = e.boss ? "#b13030" : "#e6c275";
    ctx.fillRect(e.x - w/2, e.y - e.r - 8, w * pct, 3);
    ctx.restore();
  }

  // projectiles
  for (const pr of state.projectiles) {
    ctx.fillStyle = pr.col || "#fff";
    ctx.beginPath(); ctx.arc(pr.x, pr.y, 4, 0, Math.PI*2); ctx.fill();
  }

  // player
  const p = state.player;
  if (p) {
    ctx.save();
    ctx.translate(p.x, p.y);
    // facing arrow / aura
    if (state.ironGuardTimer > 0) {
      ctx.strokeStyle = "#c89b3c"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, p.r + 6 + Math.sin(performance.now()/180)*1.5, 0, Math.PI*2); ctx.stroke();
    }
    ctx.rotate(p.facing);
    ctx.fillStyle = state.job.color;
    ctx.beginPath();
    ctx.moveTo(p.r + 4, 0);
    ctx.lineTo(-p.r, -p.r);
    ctx.lineTo(-p.r * 0.6, 0);
    ctx.lineTo(-p.r, p.r);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#0c0a08"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }

  // particles
  for (const pt of state.particles) {
    const a = 1 - pt.age / pt.life;
    if (pt.text) {
      ctx.font = "12px JetBrains Mono, monospace";
      ctx.fillStyle = pt.col;
      ctx.globalAlpha = a;
      ctx.fillText(pt.text, pt.x, pt.y);
      ctx.globalAlpha = 1;
    } else {
      ctx.fillStyle = pt.col;
      ctx.globalAlpha = a;
      ctx.fillRect(pt.x - 2, pt.y - 2, 4, 4);
      ctx.globalAlpha = 1;
    }
  }

  // cooldown indicators top-right of canvas
  ctx.font = "11px JetBrains Mono";
  ctx.fillStyle = "#b3a487";
  ctx.fillText(`E ${state.eCD > 0 ? state.eCD.toFixed(1)+"s" : "READY"}`, W - 120, 18);
  ctx.fillText(`F ${state.fCD > 0 ? state.fCD.toFixed(1)+"s" : "READY"}`, W - 120, 34);
  if (state.paused) {
    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = "#e6c275"; ctx.font = "32px Cinzel, serif";
    ctx.fillText("PAUSED", W/2 - 60, H/2);
  }
}

})();
