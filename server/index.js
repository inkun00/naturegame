/**
 * EcoEvolution 실시간 멀티플레이 서버.
 * - 단일 룸(월드) 기반, 모든 플레이어가 한 월드에 접속
 * - 30Hz tick 으로 스냅샷 브로드캐스팅
 * - DB 없음 (인메모리)
 */

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const {
  state,
  addPlayer,
  removePlayer,
  getPlayer,
  applyInput,
  feedPlayer,
  evolvePlayer,
  spawnFood,
  removeFood,
  removeAI,
  getSnapshot,
  getLeaderboard,
  clampWorld,
  canEat,
  DAMAGE_PER_TICK_FROM_PREDATOR,
  WORLD,
} = require("./gameState");
const { ensurePopulation, stepAI, resolveAIInteractions } = require("./ai");
const { stepHunters, BULLET_DAMAGE_PLAYER } = require("./hunter");
const { getSpecies } = require("./species");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "EcoEvolution socket server",
    world: WORLD,
    players: state.players.size,
    ais: state.ais.size,
    foods: state.foods.size,
    uptime: process.uptime(),
  });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// ===== Tick / 루프 =====

const TICK_HZ = 30;
const TICK_MS = 1000 / TICK_HZ;
let lastTick = Date.now();

// 먹이(생산자) 흡입(자석) 효과
const FOOD_SUCTION_RANGE = 220; // 이 거리 안이면 빨려 들어감
const FOOD_SUCTION_SPEED = 520; // world unit / sec

function tick() {
  const now = Date.now();
  const dt = Math.min(0.1, (now - lastTick) / 1000);
  lastTick = now;

  // 1. 플레이어 이동 적용 (서버 권위)
  for (const p of state.players.values()) {
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    clampWorld(p);
  }

  // 2. AI 이동
  for (const a of state.ais.values()) stepAI(a, dt);

  // 3. AI 간 상호작용 (생산자 섭취, AI 끼리 사냥)
  resolveAIInteractions();

  // 4. 플레이어와 먹이/AI 충돌 처리
  for (const p of state.players.values()) {
    if (!p.alive) continue;

    // 생산자(foods) 섭취 — 실제 먹이 관계인 경우에만
    for (const f of state.foods.values()) {
      let dx = p.x - f.x;
      let dy = p.y - f.y;
      let d = Math.hypot(dx, dy);

      // 가까운 먹이는 플레이어 쪽으로 끌려온다 (먹을 수 있는 경우에만)
      if (d > 0 && d < FOOD_SUCTION_RANGE && canEat(p.speciesId, f.speciesId)) {
        const step = Math.min(d, FOOD_SUCTION_SPEED * dt);
        f.x += (dx / d) * step;
        f.y += (dy / d) * step;
        clampWorld(f);
        dx = p.x - f.x;
        dy = p.y - f.y;
        d = Math.hypot(dx, dy);
      }
      if (d < p.radius + f.radius - 2) {
        if (canEat(p.speciesId, f.speciesId)) {
          feedPlayer(p, f.speciesId);
          removeFood(f.id);
        }
      }
    }

    // AI 와의 상호작용
    for (const a of state.ais.values()) {
      const d = Math.hypot(p.x - a.x, p.y - a.y);
      if (d < p.radius + a.radius - 4) {
        if (canEat(p.speciesId, a.speciesId)) {
          // 플레이어가 AI 를 잡아먹음
          feedPlayer(p, a.speciesId);
          removeAI(a.id);
        } else if (canEat(a.speciesId, p.speciesId)) {
          // AI 가 상위 포식자 → 플레이어 에너지 감소
          p.energy -= DAMAGE_PER_TICK_FROM_PREDATOR;
        }
      }
    }

    // 플레이어 vs 플레이어
    for (const q of state.players.values()) {
      if (q.id === p.id) continue;
      if (!q.alive) continue;
      const d = Math.hypot(p.x - q.x, p.y - q.y);
      if (d < p.radius + q.radius - 4) {
        if (canEat(p.speciesId, q.speciesId)) {
          // p 가 q 를 먹음: q 사망, p 포만감 증가
          feedPlayer(p, q.speciesId);
          killPlayer(q, p);
        }
      }
    }

    // 사망 체크
    if (p.energy <= 0) {
      killPlayer(p, null);
    }
  }

  // 5. 사냥꾼 이벤트 진행 (스폰/이동/사격/총알 처리)
  stepHunters(
    dt,
    (victim) => {
      victim.energy -= BULLET_DAMAGE_PLAYER;
      if (victim.energy <= 0) {
        killPlayer(victim, { nickname: "사냥꾼", speciesId: -1 });
      }
    },
    (ai) => {
      state.ais.delete(ai.id);
    }
  );

  // 6. 개체 유지
  ensurePopulation();

  // 6. 스냅샷 브로드캐스트
  const snapshot = getSnapshot();
  const leaderboard = getLeaderboard(10);
  io.emit("state", { snapshot, leaderboard });
}

function killPlayer(p, killer) {
  if (!p.alive) return;
  p.alive = false;
  p.energy = 0;
  const survivalMs = Date.now() - p.joinedAt;
  const result = {
    nickname: p.nickname,
    speciesId: p.speciesId,
    tier: p.tier,
    level: p.level ?? 0,
    score: Math.round(p.score),
    survivalMs,
    killedBy: killer
      ? { nickname: killer.nickname, speciesId: killer.speciesId }
      : null,
  };
  io.to(p.id).emit("gameOver", result);
}

setInterval(tick, TICK_MS);

// ===== Socket 이벤트 =====

io.on("connection", (socket) => {
  console.log(`[conn] ${socket.id}`);

  socket.on("join", (payload) => {
    const nickname = (payload && payload.nickname) || "익명";
    const player = addPlayer(socket.id, nickname);
    socket.emit("joined", {
      id: socket.id,
      player,
      world: WORLD,
    });
    console.log(`[join] ${player.nickname} (${player.speciesId})`);
  });

  socket.on("input", (input) => {
    applyInput(socket.id, input);
  });

  socket.on("respawn", () => {
    const prev = getPlayer(socket.id);
    const nickname = prev ? prev.nickname : "익명";
    if (prev) removePlayer(socket.id);
    const player = addPlayer(socket.id, nickname);
    socket.emit("joined", {
      id: socket.id,
      player,
      world: WORLD,
    });
  });

  socket.on("disconnect", () => {
    console.log(`[disc] ${socket.id}`);
    removePlayer(socket.id);
  });
});

// 초기 개체군 생성
ensurePopulation();

server.listen(PORT, () => {
  console.log(`EcoEvolution server listening on :${PORT}`);
});
