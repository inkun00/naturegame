/**
 * 인메모리 게임 상태.
 * - 단일 월드(방) 기준: 모든 플레이어가 한 방에 참여.
 * - players, foods, ais 를 Map/Object 로 관리.
 * - DB 없이 프로세스 재시작 시 초기화된다.
 */

const {
  SPECIES,
  randomSpeciesByTier,
  canEat,
  nutritionOf,
  radiusOf,
  speedOf,
  getSpecies,
  MAX_TIER,
} = require("./species");

const WORLD = {
  width: 4000,
  height: 4000,
};

const INITIAL_ENERGY = 100;
const MAX_ENERGY = 100;
const MAX_SATIETY = 100;
const DAMAGE_PER_TICK_FROM_PREDATOR = 0.6; // 상위 포식자와 겹쳐있을 때 틱당 감소
const HEAL_ON_EAT = 8;
const SPAWN_MARGIN = 80;
const MAX_LEVEL = 60;
const FOOD_DECAY_MS = 45_000; // 오랫동안 먹히지 않으면 부패

/**
 * @typedef {Object} Player
 * @property {string} id  socket id
 * @property {string} nickname
 * @property {number} speciesId
 * @property {number} tier
 * @property {number} level
 * @property {number} x
 * @property {number} y
 * @property {number} vx
 * @property {number} vy
 * @property {number} energy
 * @property {number} satiety
 * @property {number} score    누적 점수(리더보드)
 * @property {number} joinedAt
 * @property {boolean} alive
 */

const state = {
  players: new Map(), // id -> Player
  foods: new Map(), // foodId -> Food  (tier 0 생산자 — 정적)
  ais: new Map(), // aiId -> AI (tier >=1 AI 생물)
  hunters: new Map(), // hunterId -> Hunter (이벤트성 NPC 사냥꾼)
  bullets: new Map(), // bulletId -> Bullet
  nextEntityId: 1,
};

function nextId(prefix) {
  return `${prefix}_${state.nextEntityId++}`;
}

function randomSpawnPos() {
  return {
    x: SPAWN_MARGIN + Math.random() * (WORLD.width - 2 * SPAWN_MARGIN),
    y: SPAWN_MARGIN + Math.random() * (WORLD.height - 2 * SPAWN_MARGIN),
  };
}

function tierByLevel(level) {
  if (level <= 15) return 1; // 1차 소비자
  if (level <= 30) return 2; // 2차 소비자
  if (level <= 45) return 3; // 3차 소비자
  return 4; // 4차 소비자
}

function levelsInTier(_tier) {
  return 15;
}

function tierStartLevel(tier) {
  if (tier === 1) return 1;
  if (tier === 2) return 16;
  if (tier === 3) return 31;
  if (tier === 4) return 46;
  return 1;
}

/**
 * 레벨→종 매핑 규칙
 * - 같은 tier(구간) 안에서 해당 tier 생물들을 "크기(반지름)" 오름차순으로 정렬
 * - 레벨이 올라갈수록 더 큰 생물이 되도록 인덱스를 증가시킨다
 */
function speciesForLevel(level) {
  const tier = tierByLevel(level);
  const span = levelsInTier(tier);
  const start = tierStartLevel(tier);
  const offset = Math.max(0, Math.min(span - 1, level - start)); // 0~14

  // tier 4는 종 데이터상 tier 3 풀을 재사용한다 (server/species.js에서 BY_TIER[4]=BY_TIER[3]).
  const speciesTier = tier === 4 ? 3 : tier;
  const list = SPECIES.filter((s) => s.tier === speciesTier).slice();
  list.sort((a, b) => radiusOf(a) - radiusOf(b));
  if (list.length === 0) return { tier, species: null };

  // 구간(15레벨) 안에서 list를 고르게 샘플링 (단조 증가, 사실상 중복 없이)
  const step = list.length / span;
  const idx = Math.min(list.length - 1, Math.floor(offset * step));
  return { tier, species: list[idx] || list[list.length - 1] };
}

function clampWorld(obj) {
  const r = obj.radius ?? 16;
  if (obj.x < r) obj.x = r;
  if (obj.y < r) obj.y = r;
  if (obj.x > WORLD.width - r) obj.x = WORLD.width - r;
  if (obj.y > WORLD.height - r) obj.y = WORLD.height - r;
}

// ============== Player ==============

function addPlayer(socketId, nickname) {
  const level = 1;
  const mapped = speciesForLevel(level);
  const tier = mapped.tier;
  const species = mapped.species || randomSpeciesByTier(tier);
  const pos = randomSpawnPos();
  const player = {
    id: socketId,
    nickname: (nickname || "익명").slice(0, 12),
    speciesId: species.id,
    tier,
    level,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    radius: radiusOf(species),
    speed: speedOf(tier),
    energy: INITIAL_ENERGY,
    satiety: 0,
    score: 0,
    joinedAt: Date.now(),
    alive: true,
    isAI: false,
  };
  state.players.set(socketId, player);
  return player;
}

function removePlayer(socketId) {
  state.players.delete(socketId);
}

function getPlayer(socketId) {
  return state.players.get(socketId);
}

/**
 * 플레이어의 입력(이동 방향)을 반영한다.
 * input.dx, input.dy 는 -1~1 정규화된 방향 벡터.
 */
function applyInput(socketId, input) {
  const p = state.players.get(socketId);
  if (!p || !p.alive) return;
  const dx = Math.max(-1, Math.min(1, Number(input?.dx) || 0));
  const dy = Math.max(-1, Math.min(1, Number(input?.dy) || 0));
  const len = Math.hypot(dx, dy);
  if (len > 0) {
    p.vx = (dx / len) * p.speed;
    p.vy = (dy / len) * p.speed;
  } else {
    p.vx = 0;
    p.vy = 0;
  }
}

/** 플레이어 성장: 레벨 1~60. 레벨 구간에 따라 1~4차 소비자 단계(tier)가 결정된다. */
function evolvePlayer(p) {
  const prevLevel = p.level || 1;

  if (prevLevel >= MAX_LEVEL) {
    // 레벨 60에서 포만감 가득 채우면 보너스만 주고 포만감 리셋
    p.score += 200;
    p.satiety = 0;
    return;
  }

  const nextLevel = prevLevel + 1;
  const mapped = speciesForLevel(nextLevel);
  const nextTier = mapped.tier;
  const nextSpecies = mapped.species;

  p.level = nextLevel;
  p.tier = nextTier;

  // 레벨업할 때마다 "크기 순서"에 맞는 다른 생물로 변경
  if (nextSpecies) {
    p.speciesId = nextSpecies.id;
    p.radius = radiusOf(nextSpecies);
  } else {
    const cur = getSpecies(p.speciesId);
    if (cur) p.radius = radiusOf(cur);
  }

  p.speed = speedOf(nextTier);
  p.satiety = 0;
  p.energy = MAX_ENERGY;
  p.score += 10 * nextLevel;
}

/**
 * 플레이어가 먹이를 먹었을 때.
 *
 * 티어 차이에 따른 포만감 페널티:
 *   predator 의 tier 보다 2단계 이상 낮은 먹이를 먹으면 포만감 획득량이 1/5.
 *   (예: tier 3 사자가 tier 1 토끼를 먹으면 1/5 만 획득.
 *        tier 3 사자가 tier 2 여우를 먹으면 정상 획득.)
 *   바로 아래 티어(diff == 1) 및 tier 0 생산자를 tier 1 이 먹는 정상 경우는 전액.
 */
function feedPlayer(p, preySpeciesId) {
  const preySpecies = getSpecies(preySpeciesId);
  const baseGain = nutritionOf(preySpeciesId);
  const tierDiff =
    preySpecies != null ? p.tier - preySpecies.tier : 1;
  // 2단계 이상 차이나는 하위 먹이는 포만감 이득을 1/5 로 감소
  const satietyGain = tierDiff > 1 ? baseGain / 5 : baseGain;

  p.satiety = Math.min(MAX_SATIETY, p.satiety + satietyGain);
  p.energy = Math.min(MAX_ENERGY, p.energy + HEAL_ON_EAT);
  p.score += baseGain;
  if (p.satiety >= MAX_SATIETY) {
    evolvePlayer(p);
  }
}

// ============== Food (tier 0 생산자) ==============

function spawnFood() {
  // 티어 0 (생산자) 전체 풀에서 무작위 추출 — 새 식물 추가 시 자동 포함
  const species = randomSpeciesByTier(0);
  if (!species) return null;
  const pos = randomSpawnPos();
  const food = {
    id: nextId("f"),
    speciesId: species.id,
    tier: 0,
    x: pos.x,
    y: pos.y,
    radius: radiusOf(species),
    spawnedAt: Date.now(),
    decayed: false,
  };
  state.foods.set(food.id, food);
  return food;
}

function removeFood(id) {
  state.foods.delete(id);
}

function updateFoodDecay(now = Date.now()) {
  for (const f of state.foods.values()) {
    if (f.decayed) continue;
    const age = now - (f.spawnedAt || now);
    if (age >= FOOD_DECAY_MS) f.decayed = true;
  }
}

function canEatFood(predatorSpeciesId, food) {
  // 지렁이(28)는 부패한 생산자를 모두 먹을 수 있다
  if (predatorSpeciesId === 28 && food?.tier === 0 && food?.decayed) return true;
  return canEat(predatorSpeciesId, food?.speciesId);
}

// ============== AI ==============

function spawnAI(tier) {
  const species = randomSpeciesByTier(tier);
  if (!species) return null;
  const pos = randomSpawnPos();
  const ai = {
    id: nextId("a"),
    nickname: species.name,
    speciesId: species.id,
    tier: species.tier,
    x: pos.x,
    y: pos.y,
    vx: 0,
    vy: 0,
    radius: radiusOf(species),
    speed: speedOf(species.tier) * 0.75, // AI 는 살짝 느리게
    energy: 100,
    satiety: 0,
    score: 0,
    alive: true,
    isAI: true,
    // AI 내부 상태
    _targetX: pos.x,
    _targetY: pos.y,
    _nextRethink: 0,
  };
  state.ais.set(ai.id, ai);
  return ai;
}

function removeAI(id) {
  state.ais.delete(id);
}

// ============== 조회 ==============

function getSnapshot() {
  return {
    world: WORLD,
    players: Array.from(state.players.values()).map(serializeEntity),
    ais: Array.from(state.ais.values()).map(serializeEntity),
    foods: Array.from(state.foods.values()).map(serializeFood),
    hunters: Array.from(state.hunters.values()).map(serializeHunter),
    bullets: Array.from(state.bullets.values()).map(serializeBullet),
    t: Date.now(),
  };
}

function serializeHunter(h) {
  return {
    id: h.id,
    x: Math.round(h.x),
    y: Math.round(h.y),
    radius: h.radius,
    heading: Number(h.heading.toFixed(3)),
    shooting: !!h.shooting,
    expiresAt: h.expiresAt,
  };
}

function serializeBullet(b) {
  return {
    id: b.id,
    x: Math.round(b.x),
    y: Math.round(b.y),
    vx: Math.round(b.vx),
    vy: Math.round(b.vy),
    radius: b.radius,
  };
}

function serializeEntity(e) {
  return {
    id: e.id,
    nickname: e.nickname,
    speciesId: e.speciesId,
    tier: e.tier,
    level: e.level ?? 0,
    x: Math.round(e.x),
    y: Math.round(e.y),
    radius: e.radius,
    energy: Math.round(e.energy),
    satiety: Math.round(e.satiety),
    score: Math.round(e.score),
    alive: e.alive,
    isAI: !!e.isAI,
  };
}

function serializeFood(f) {
  return {
    id: f.id,
    speciesId: f.speciesId,
    tier: 0,
    x: Math.round(f.x),
    y: Math.round(f.y),
    radius: f.radius,
    decayed: !!f.decayed,
  };
}

function getLeaderboard(limit = 10) {
  const entries = [];
  for (const p of state.players.values()) {
    entries.push({
      id: p.id,
      nickname: p.nickname,
      speciesId: p.speciesId,
      tier: p.tier,
      level: p.level ?? 0,
      score: Math.round(p.score),
      alive: p.alive,
      isAI: false,
    });
  }
  // AI 는 리더보드에 표시하지 않음 (플레이어 중심)
  entries.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    return b.score - a.score;
  });
  return entries.slice(0, limit);
}

module.exports = {
  WORLD,
  INITIAL_ENERGY,
  MAX_ENERGY,
  MAX_SATIETY,
  DAMAGE_PER_TICK_FROM_PREDATOR,
  state,
  addPlayer,
  removePlayer,
  getPlayer,
  applyInput,
  evolvePlayer,
  feedPlayer,
  spawnFood,
  removeFood,
  updateFoodDecay,
  canEatFood,
  spawnAI,
  removeAI,
  getSnapshot,
  getLeaderboard,
  clampWorld,
  canEat,
  getSpecies,
  radiusOf,
  speedOf,
  randomSpawnPos,
};
