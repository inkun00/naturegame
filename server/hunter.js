/**
 * 사냥꾼(Hunter) 이벤트 시스템.
 *
 * - 일정 주기로 맵 가장자리에서 사냥꾼이 스폰된다.
 * - 사냥꾼은 가장 가까운 동물(AI 또는 플레이어)을 찾아 이동하며,
 *   사정거리에 들어오면 총알을 발사한다.
 * - 총알은 직선으로 날아가며, 동물/플레이어와 충돌 시 데미지 적용.
 * - 지정된 수명(초)이 지나면 사냥꾼은 사라진다.
 *
 * NPC 이므로 리더보드/먹이그물에 참여하지 않는다.
 */

const { state, WORLD, clampWorld } = require("./gameState");

const HUNTER_RADIUS = 28;
const HUNTER_SPEED = 145;
const HUNTER_LIFESPAN_MS = 45_000; // 45 초 머무른 뒤 사라짐
const HUNTER_MAX_CONCURRENT = 2;
const HUNTER_SPAWN_MIN_MS = 60_000; // 최소 60 초 간격
const HUNTER_SPAWN_MAX_MS = 120_000; // 최대 120 초 간격
const HUNTER_FIRE_COOLDOWN_MS = 1400;
const HUNTER_FIRE_RANGE = 700;
const HUNTER_IDEAL_DIST = 360;
const HUNTER_SIGHT_RANGE = 950;
const HUNTER_SHOOTING_FLASH_MS = 180;

const BULLET_SPEED = 1200;
const BULLET_LIFETIME_MS = 900;
const BULLET_RADIUS = 5;
const BULLET_DAMAGE_PLAYER = 55;

let nextHunterSpawnAt = 0;

function nextId(prefix) {
  return `${prefix}_${state.nextEntityId++}`;
}

function spawnHunter() {
  // 월드 가장자리에서 등장
  const edge = Math.floor(Math.random() * 4);
  let x;
  let y;
  const margin = 80;
  if (edge === 0) {
    x = margin;
    y = margin + Math.random() * (WORLD.height - margin * 2);
  } else if (edge === 1) {
    x = WORLD.width - margin;
    y = margin + Math.random() * (WORLD.height - margin * 2);
  } else if (edge === 2) {
    x = margin + Math.random() * (WORLD.width - margin * 2);
    y = margin;
  } else {
    x = margin + Math.random() * (WORLD.width - margin * 2);
    y = WORLD.height - margin;
  }

  const now = Date.now();
  const hunter = {
    id: nextId("h"),
    x,
    y,
    vx: 0,
    vy: 0,
    radius: HUNTER_RADIUS,
    heading: 0,
    lastShotAt: 0,
    shootingFlashUntil: 0,
    shooting: false,
    spawnedAt: now,
    expiresAt: now + HUNTER_LIFESPAN_MS,
  };
  state.hunters.set(hunter.id, hunter);
  return hunter;
}

function findNearestTarget(hunter) {
  let best = null;
  let bestDist = HUNTER_SIGHT_RANGE;

  for (const a of state.ais.values()) {
    const d = Math.hypot(a.x - hunter.x, a.y - hunter.y);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  for (const p of state.players.values()) {
    if (!p.alive) continue;
    const d = Math.hypot(p.x - hunter.x, p.y - hunter.y);
    if (d < bestDist) {
      bestDist = d;
      best = p;
    }
  }
  return best;
}

function fireBullet(hunter, target) {
  const dx = target.x - hunter.x;
  const dy = target.y - hunter.y;
  const d = Math.hypot(dx, dy);
  if (d < 1) return;
  const ux = dx / d;
  const uy = dy / d;
  const now = Date.now();
  const bullet = {
    id: nextId("b"),
    x: hunter.x + ux * (hunter.radius + 6),
    y: hunter.y + uy * (hunter.radius + 6),
    vx: ux * BULLET_SPEED,
    vy: uy * BULLET_SPEED,
    spawnedAt: now,
    expiresAt: now + BULLET_LIFETIME_MS,
    radius: BULLET_RADIUS,
    ownerId: hunter.id,
  };
  state.bullets.set(bullet.id, bullet);

  hunter.lastShotAt = now;
  hunter.shootingFlashUntil = now + HUNTER_SHOOTING_FLASH_MS;
}

function stepHunter(hunter, dt, now) {
  const target = findNearestTarget(hunter);
  hunter.shooting = now < hunter.shootingFlashUntil;

  if (target) {
    const dx = target.x - hunter.x;
    const dy = target.y - hunter.y;
    const d = Math.hypot(dx, dy);
    if (d > 0) hunter.heading = Math.atan2(dy, dx);

    if (d > HUNTER_IDEAL_DIST) {
      hunter.vx = (dx / d) * HUNTER_SPEED;
      hunter.vy = (dy / d) * HUNTER_SPEED;
    } else {
      hunter.vx = 0;
      hunter.vy = 0;
    }
    hunter.x += hunter.vx * dt;
    hunter.y += hunter.vy * dt;
    clampWorld(hunter);

    if (
      d <= HUNTER_FIRE_RANGE &&
      now - hunter.lastShotAt >= HUNTER_FIRE_COOLDOWN_MS
    ) {
      fireBullet(hunter, target);
    }
  } else {
    hunter.vx = 0;
    hunter.vy = 0;
  }
}

/**
 * @param {number} dt
 * @param {(player: any, hunter: any) => void} onHitPlayer  플레이어 피격 콜백
 * @param {(ai: any) => void} onHitAI  AI 사살 콜백 (1발 1킬)
 */
function stepHunters(dt, onHitPlayer, onHitAI) {
  const now = Date.now();

  // 스폰 타이머 초기화
  if (nextHunterSpawnAt === 0) {
    nextHunterSpawnAt =
      now +
      HUNTER_SPAWN_MIN_MS +
      Math.random() * (HUNTER_SPAWN_MAX_MS - HUNTER_SPAWN_MIN_MS);
  }

  if (
    now >= nextHunterSpawnAt &&
    state.hunters.size < HUNTER_MAX_CONCURRENT
  ) {
    spawnHunter();
    nextHunterSpawnAt =
      now +
      HUNTER_SPAWN_MIN_MS +
      Math.random() * (HUNTER_SPAWN_MAX_MS - HUNTER_SPAWN_MIN_MS);
  }

  // 수명 만료된 사냥꾼 제거
  for (const h of Array.from(state.hunters.values())) {
    if (now >= h.expiresAt) {
      state.hunters.delete(h.id);
      continue;
    }
    stepHunter(h, dt, now);
  }

  // 총알 진행 및 충돌 처리
  for (const b of Array.from(state.bullets.values())) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (
      now > b.expiresAt ||
      b.x < -20 ||
      b.y < -20 ||
      b.x > WORLD.width + 20 ||
      b.y > WORLD.height + 20
    ) {
      state.bullets.delete(b.id);
      continue;
    }

    let consumed = false;

    for (const a of state.ais.values()) {
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < a.radius + b.radius) {
        onHitAI(a);
        consumed = true;
        break;
      }
    }
    if (consumed) {
      state.bullets.delete(b.id);
      continue;
    }

    for (const p of state.players.values()) {
      if (!p.alive) continue;
      const d = Math.hypot(p.x - b.x, p.y - b.y);
      if (d < p.radius + b.radius) {
        const hunter = state.hunters.get(b.ownerId) || null;
        onHitPlayer(p, hunter);
        consumed = true;
        break;
      }
    }
    if (consumed) {
      state.bullets.delete(b.id);
    }
  }
}

module.exports = {
  stepHunters,
  BULLET_DAMAGE_PLAYER,
};
