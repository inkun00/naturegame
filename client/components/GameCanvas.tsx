import { useEffect, useRef } from "react";
import type {
  BulletState,
  EntityState,
  FoodState,
  HunterState,
  Snapshot,
  World,
} from "../lib/types";
import { getSpecies, canEat } from "../lib/species";

interface Props {
  snapshot: Snapshot | null;
  myId: string | null;
  world: World | null;
}

/**
 * 2D 탑다운 캔버스 렌더러.
 * - 서버로부터 받은 스냅샷을 보간(interpolation) 하여 부드럽게 그린다.
 * - 카메라는 내 플레이어를 중심으로 고정.
 * - 먹이그물 규칙에 따라 아이콘 주변에 색 링을 그려 시각적 피드백 제공
 *   (초록: 먹을 수 있음 / 빨강: 위험한 포식자 / 회색: 동등/무관)
 */
export default function GameCanvas({ snapshot, myId, world }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const snapshotRef = useRef<Snapshot | null>(null);
  const prevSnapshotRef = useRef<Snapshot | null>(null);
  const snapshotTimeRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  // 렌더 루프는 mount 시 1회만 등록되므로, 최신 props 는 ref 로 참조한다.
  const myIdRef = useRef<string | null>(myId);
  const worldRef = useRef<World | null>(world);
  // 카메라 부드러움 (lerp) 용 현재 위치
  const camRef = useRef<{ x: number; y: number } | null>(null);

  // 스냅샷 최신화
  useEffect(() => {
    if (!snapshot) return;
    prevSnapshotRef.current = snapshotRef.current;
    snapshotRef.current = snapshot;
    snapshotTimeRef.current = performance.now();
  }, [snapshot]);

  useEffect(() => {
    myIdRef.current = myId;
  }, [myId]);
  useEffect(() => {
    worldRef.current = world;
  }, [world]);

  // 렌더 루프
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const loop = () => {
      draw(ctx, canvas);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function interpEntity(
    curr: EntityState,
    prev: EntityState | undefined,
    alpha: number
  ): { x: number; y: number } {
    if (!prev) return { x: curr.x, y: curr.y };
    return {
      x: prev.x + (curr.x - prev.x) * alpha,
      y: prev.y + (curr.y - prev.y) * alpha,
    };
  }

  function draw(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const snap = snapshotRef.current;
    const prev = prevSnapshotRef.current;
    const worldInfo = snap?.world || worldRef.current;
    const currentMyId = myIdRef.current;

    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, 0, w, h);

    if (!snap || !worldInfo) return;

    // 보간 계수 (30Hz 기준 약 33ms)
    const dt = performance.now() - snapshotTimeRef.current;
    const alpha = Math.max(0, Math.min(1, dt / 33));

    // 내 플레이어 위치도 이전↔현재 스냅샷 사이에서 보간 →
    // 카메라가 부드럽게 따라온다
    const me = snap.players.find((p) => p.id === currentMyId);
    const mePrev = prev
      ? prev.players.find((p) => p.id === currentMyId)
      : undefined;
    let targetX = worldInfo.width / 2;
    let targetY = worldInfo.height / 2;
    if (me && me.alive) {
      const interp = interpEntity(me, mePrev, alpha);
      targetX = interp.x;
      targetY = interp.y;
    }

    // 카메라 lerp: 목표점을 부드럽게 쫓아간다
    if (!camRef.current) {
      camRef.current = { x: targetX, y: targetY };
    } else {
      const smoothing = 0.18;
      camRef.current.x += (targetX - camRef.current.x) * smoothing;
      camRef.current.y += (targetY - camRef.current.y) * smoothing;
    }
    const camX = camRef.current.x;
    const camY = camRef.current.y;

    ctx.save();
    ctx.translate(w / 2 - camX, h / 2 - camY);

    drawGrid(ctx, worldInfo, camX, camY, w, h);
    drawWorldBorder(ctx, worldInfo);

    // 이전 스냅샷 맵 (보간용)
    const prevById = new Map<string, EntityState>();
    if (prev) {
      for (const e of prev.players) prevById.set(e.id, e);
      for (const e of prev.ais) prevById.set(e.id, e);
    }
    const prevFoodById = new Map<string, FoodState>();
    if (prev) for (const f of prev.foods) prevFoodById.set(f.id, f);

    // 생산자 (food) 렌더
    for (const f of snap.foods) {
      const pf = prevFoodById.get(f.id);
      const x = pf ? pf.x + (f.x - pf.x) * alpha : f.x;
      const y = pf ? pf.y + (f.y - pf.y) * alpha : f.y;
      drawCreature(ctx, x, y, f.radius, f.speciesId, undefined, me, false);
    }

    // AI 렌더
    for (const a of snap.ais) {
      const pa = prevById.get(a.id);
      const { x, y } = interpEntity(a, pa, alpha);
      drawCreature(ctx, x, y, a.radius, a.speciesId, undefined, me, true);
    }

    // 사냥꾼 (NPC) 렌더 — 동물보다 위에
    const prevHunterById = new Map<string, HunterState>();
    if (prev?.hunters) for (const h of prev.hunters) prevHunterById.set(h.id, h);
    if (snap.hunters) {
      for (const h of snap.hunters) {
        const ph = prevHunterById.get(h.id);
        const hx = ph ? ph.x + (h.x - ph.x) * alpha : h.x;
        const hy = ph ? ph.y + (h.y - ph.y) * alpha : h.y;
        drawHunter(ctx, hx, hy, h);
      }
    }

    // 총알 렌더
    if (snap.bullets) {
      for (const b of snap.bullets) {
        drawBullet(ctx, b, alpha);
      }
    }

    // 플레이어 렌더
    for (const p of snap.players) {
      if (!p.alive) continue;
      const pp = prevById.get(p.id);
      const { x, y } = interpEntity(p, pp, alpha);
      drawCreature(
        ctx,
        x,
        y,
        p.radius,
        p.speciesId,
        p.nickname,
        me,
        false,
        p.id === myId,
        p.heading
      );
    }

    ctx.restore();

    // 방향 미니맵 (월드 대비 내 위치)
    if (me) drawMinimap(ctx, worldInfo, me, w, h);
  }

  function drawGrid(
    ctx: CanvasRenderingContext2D,
    worldInfo: World,
    camX: number,
    camY: number,
    w: number,
    h: number
  ) {
    const step = 200;
    const left = Math.max(0, camX - w / 2);
    const right = Math.min(worldInfo.width, camX + w / 2);
    const top = Math.max(0, camY - h / 2);
    const bottom = Math.min(worldInfo.height, camY + h / 2);

    ctx.strokeStyle = "rgba(148,163,184,0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const startX = Math.floor(left / step) * step;
    const startY = Math.floor(top / step) * step;
    for (let x = startX; x <= right; x += step) {
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
    }
    for (let y = startY; y <= bottom; y += step) {
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
    }
    ctx.stroke();
  }

  function drawWorldBorder(ctx: CanvasRenderingContext2D, worldInfo: World) {
    ctx.strokeStyle = "rgba(34,197,94,0.35)";
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, worldInfo.width, worldInfo.height);
  }

  function drawCreature(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    speciesId: number,
    nickname: string | undefined,
    me: EntityState | undefined,
    isAI: boolean,
    isMe = false,
    heading?: number
  ) {
    const sp = getSpecies(speciesId);
    if (!sp) return;

    // 관계 색 링
    let ringColor: string | null = null;
    if (me && me.speciesId !== speciesId && me.alive) {
      if (canEat(me.speciesId, speciesId)) {
        ringColor = "rgba(34,197,94,0.85)"; // 먹을 수 있음
      } else if (canEat(speciesId, me.speciesId)) {
        ringColor = "rgba(239,68,68,0.9)"; // 위험
      }
    }

    // 배경 원
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = isMe
      ? "rgba(251,191,36,0.22)"
      : isAI
      ? "rgba(148,163,184,0.15)"
      : sp.tier === 0
      ? "rgba(34,197,94,0.12)"
      : "rgba(59,130,246,0.12)";
    ctx.fill();

    if (ringColor) {
      ctx.strokeStyle = ringColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (isMe) {
      ctx.strokeStyle = "rgba(251,191,36,0.9)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // 이모지 (플레이어는 이동 방향대로 회전)
    const emojiSize = radius * 1.6;
    ctx.font = `${emojiSize}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (nickname && typeof heading === "number") {
      ctx.save();
      ctx.translate(x, y + 1);
      // 이모지 기본 방향이 체감상 반대로 보여 180도 보정
      ctx.rotate(heading + Math.PI);
      ctx.fillText(sp.emoji, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(sp.emoji, x, y + 1);
    }

    // 종 이름표 (모든 생물에 표시)
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    const nameFont = "600 11px system-ui, -apple-system, 'Segoe UI', sans-serif";
    ctx.font = nameFont;
    const nameY = y - radius - 6;
    const nameText = sp.name;
    const nameMetrics = ctx.measureText(nameText);
    const padX = 5;
    const padY = 3;
    const bgW = nameMetrics.width + padX * 2;
    const bgH = 14;
    // 이름표 배경 (가독성용 반투명 박스)
    ctx.fillStyle = isMe
      ? "rgba(120,70,10,0.78)"
      : ringColor === "rgba(34,197,94,0.85)"
      ? "rgba(20,80,40,0.75)"
      : ringColor === "rgba(239,68,68,0.9)"
      ? "rgba(90,20,25,0.8)"
      : "rgba(15,23,42,0.72)";
    roundRect(ctx, x - bgW / 2, nameY - bgH + padY, bgW, bgH, 4);
    ctx.fill();
    // 이름 텍스트
    ctx.fillStyle = isMe
      ? "#fde68a"
      : sp.tier === 0
      ? "#bbf7d0"
      : sp.tier === 1
      ? "#e0f2fe"
      : sp.tier === 2
      ? "#fde68a"
      : "#fecaca";
    ctx.font = nameFont;
    ctx.fillText(nameText, x, nameY);

    // 닉네임 (플레이어만, 종 이름 위에 추가 표시)
    if (nickname) {
      ctx.font = "bold 12px system-ui, -apple-system, sans-serif";
      ctx.fillStyle = isMe ? "#fbbf24" : "#f1f5f9";
      ctx.textAlign = "center";
      ctx.fillText(nickname, x, nameY - bgH - 2);
    }
  }

  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
  }

  function drawHunter(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    h: HunterState
  ) {
    const r = h.radius;

    // 경고 링 (맥동)
    const t = (performance.now() / 300) % (Math.PI * 2);
    const pulse = 0.7 + 0.3 * Math.sin(t);
    ctx.beginPath();
    ctx.arc(x, y, r + 10 + pulse * 3, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(239,68,68,${0.35 + pulse * 0.25})`;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 몸통 배경
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(120,53,15,0.85)"; // 짙은 갈색
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.9)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 사냥꾼 이모지
    ctx.font = `${r * 1.5}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🧑‍🌾", x, y + 1);

    // 총(조준 방향 표시)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(h.heading);
    const gunLen = r + 14;
    // 총열
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(r - 4, -3, gunLen - (r - 4), 6);
    // 총구 발광
    if (h.shooting) {
      ctx.beginPath();
      ctx.arc(gunLen + 2, 0, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,191,36,0.95)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(gunLen + 2, 0, 14, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(251,146,60,0.5)";
      ctx.fill();
    }
    ctx.restore();

    // 이름표
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "center";
    const nameY = y - r - 8;
    const nameText = "사냥꾼";
    ctx.font = "700 12px system-ui, -apple-system, 'Segoe UI', sans-serif";
    const m = ctx.measureText(nameText);
    const padX = 6;
    const bgW = m.width + padX * 2;
    const bgH = 16;
    ctx.fillStyle = "rgba(127,29,29,0.9)";
    roundRect(ctx, x - bgW / 2, nameY - bgH + 3, bgW, bgH, 4);
    ctx.fill();
    ctx.fillStyle = "#fecaca";
    ctx.fillText(nameText, x, nameY);

    // 잔여 시간 작은 바
    const now = performance.now();
    // expiresAt 는 Date.now() 기준이지만 매 프레임에서 수명 감소 느낌용
    // 간단히 고정 폭 ‘머무는 중’ 표시만 추가
    void now;
  }

  function drawBullet(
    ctx: CanvasRenderingContext2D,
    b: BulletState,
    alpha: number
  ) {
    // 간단한 직선 보간: (b.x - b.vx * (1-alpha) * dt)는 복잡하므로,
    // 현재 위치만 표시하고 뒤에 모션 트레일을 그린다.
    const speed = Math.hypot(b.vx, b.vy) || 1;
    const tailLen = 18;
    const tx = b.x - (b.vx / speed) * tailLen;
    const ty = b.y - (b.vy / speed) * tailLen;

    // 트레일
    const grad = ctx.createLinearGradient(tx, ty, b.x, b.y);
    grad.addColorStop(0, "rgba(251,191,36,0)");
    grad.addColorStop(1, "rgba(254,240,138,0.95)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // 총알 헤드
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fillStyle = "#fde68a";
    ctx.fill();
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    void alpha;
  }

  function drawMinimap(
    ctx: CanvasRenderingContext2D,
    worldInfo: World,
    me: EntityState,
    w: number,
    h: number
  ) {
    const mw = 140;
    const mh = (mw * worldInfo.height) / worldInfo.width;
    const pad = 16;
    const x0 = w - mw - pad;
    const y0 = h - mh - pad;

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(15,23,42,0.7)";
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.lineWidth = 1;
    ctx.fillRect(x0, y0, mw, mh);
    ctx.strokeRect(x0, y0, mw, mh);

    // 내 위치
    const mx = x0 + (me.x / worldInfo.width) * mw;
    const my = y0 + (me.y / worldInfo.height) * mh;
    ctx.beginPath();
    ctx.arc(mx, my, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
    ctx.restore();
  }

  return <canvas ref={canvasRef} className="game-canvas" />;
}
