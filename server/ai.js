/**
 * AI 생물의 간단한 AI: 주기적으로 목표지점 재설정 + 이동.
 * 서버 tick 에서 호출된다.
 */

const {
  state,
  WORLD,
  clampWorld,
  canEat,
  radiusOf,
  speedOf,
  randomSpawnPos,
  spawnAI,
  spawnFood,
  feedPlayer,
  removeFood,
  removeAI,
} = require("./gameState");
const { nutritionOf, randomSpeciesByTier, MAX_TIER } = require("./species");

// 목표 개체수 (세션 활력 유지) — 상호작용 밀도를 위해 상향
const TARGET_FOOD = 320; // 생산자 (기존의 2배)
const TARGET_AI_BY_TIER = {
  1: 40,
  2: 20,
  3: 8,
};

function ensurePopulation() {
  while (state.foods.size < TARGET_FOOD) spawnFood();
  for (const tier of [1, 2, 3]) {
    let count = 0;
    for (const a of state.ais.values()) if (a.tier === tier) count++;
    while (count < TARGET_AI_BY_TIER[tier]) {
      spawnAI(tier);
      count++;
    }
  }
}

function pickNewTarget(ai) {
  // 실제 먹이 관계(canEat) 에 해당하는 가장 가까운 대상 추적
  let target = null;
  let bestDist = Infinity;

  // 식물 (생산자) 스캔 — 내가 먹을 수 있는 종만
  for (const f of state.foods.values()) {
    if (!canEat(ai.speciesId, f.speciesId)) continue;
    const d = Math.hypot(f.x - ai.x, f.y - ai.y);
    if (d < bestDist && d < 800) {
      bestDist = d;
      target = { x: f.x, y: f.y };
    }
  }

  // 다른 AI 중 내가 사냥할 수 있는 대상
  for (const other of state.ais.values()) {
    if (other.id === ai.id) continue;
    if (!canEat(ai.speciesId, other.speciesId)) continue;
    const d = Math.hypot(other.x - ai.x, other.y - ai.y);
    if (d < bestDist && d < 900) {
      bestDist = d;
      target = { x: other.x, y: other.y };
    }
  }

  // 플레이어 중 내가 사냥할 수 있는 대상
  for (const p of state.players.values()) {
    if (!p.alive) continue;
    if (!canEat(ai.speciesId, p.speciesId)) continue;
    const d = Math.hypot(p.x - ai.x, p.y - ai.y);
    if (d < bestDist && d < 900) {
      bestDist = d;
      target = { x: p.x, y: p.y };
    }
  }

  if (!target) {
    const pos = randomSpawnPos();
    target = { x: pos.x, y: pos.y };
  }
  ai._targetX = target.x;
  ai._targetY = target.y;
  ai._nextRethink = Date.now() + 900 + Math.random() * 1800;
}

function stepAI(ai, dt) {
  if (!ai._nextRethink || Date.now() > ai._nextRethink) pickNewTarget(ai);

  const dx = ai._targetX - ai.x;
  const dy = ai._targetY - ai.y;
  const d = Math.hypot(dx, dy);
  if (d < 6) {
    ai.vx = 0;
    ai.vy = 0;
    ai._nextRethink = 0;
    return;
  }
  ai.vx = (dx / d) * ai.speed;
  ai.vy = (dy / d) * ai.speed;
  ai.x += ai.vx * dt;
  ai.y += ai.vy * dt;
  clampWorld(ai);
}

/** AI 가 생산자/다른 AI 를 먹는 처리 (충돌 검사) */
function resolveAIInteractions() {
  // AI 가 실제 먹이 관계인 식물만 섭취
  for (const ai of state.ais.values()) {
    for (const f of state.foods.values()) {
      if (!canEat(ai.speciesId, f.speciesId)) continue;
      const d = Math.hypot(f.x - ai.x, f.y - ai.y);
      if (d < ai.radius + f.radius) {
        removeFood(f.id);
        ai.energy = Math.min(100, (ai.energy || 100) + 5);
        break;
      }
    }
  }

  // AI 끼리 사냥 — 실제 먹이 관계만
  const aiList = Array.from(state.ais.values());
  for (const predator of aiList) {
    if (!state.ais.has(predator.id)) continue;
    for (const prey of aiList) {
      if (!state.ais.has(prey.id)) continue;
      if (predator.id === prey.id) continue;
      if (!canEat(predator.speciesId, prey.speciesId)) continue;
      const d = Math.hypot(predator.x - prey.x, predator.y - prey.y);
      if (d < predator.radius + prey.radius - 4) {
        removeAI(prey.id);
        predator.energy = Math.min(100, (predator.energy || 100) + 8);
      }
    }
  }
}

module.exports = {
  ensurePopulation,
  stepAI,
  resolveAIInteractions,
};
