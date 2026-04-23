import { useRouter } from "next/router";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSocket, disconnectSocket } from "../lib/socket";
import type {
  EntityState,
  GameOverResult,
  JoinedPayload,
  LeaderboardEntry,
  Snapshot,
  World,
} from "../lib/types";
import HUD from "../components/HUD";
import Leaderboard from "../components/Leaderboard";
import ResultModal from "../components/ResultModal";

// Canvas 는 SSR 시 window 접근이 필요하므로 client-only 로 렌더
const GameCanvas = dynamic(() => import("../components/GameCanvas"), {
  ssr: false,
});

export default function GamePage() {
  const router = useRouter();
  const nick = (router.query.nick as string) || "익명";

  const [myId, setMyId] = useState<string | null>(null);
  const [world, setWorld] = useState<World | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [gameOver, setGameOver] = useState<GameOverResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [hunterAlert, setHunterAlert] = useState<number>(0);

  const inputRef = useRef({ up: false, down: false, left: false, right: false });
  const lastSentRef = useRef({ dx: 0, dy: 0, t: 0 });
  const knownHuntersRef = useRef<Set<string>>(new Set());

  // 내 엔티티 추출
  const me = useMemo<EntityState | null>(() => {
    if (!snapshot || !myId) return null;
    return snapshot.players.find((p) => p.id === myId) ?? null;
  }, [snapshot, myId]);

  // ===== 소켓 연결 & 이벤트 =====
  useEffect(() => {
    if (!router.isReady) return;
    const socket = getSocket();

    const handleConnect = () => {
      setConnected(true);
      socket.emit("join", { nickname: nick });
    };
    const handleDisconnect = () => {
      setConnected(false);
    };
    const handleJoined = (payload: JoinedPayload) => {
      setMyId(payload.id);
      setWorld(payload.world);
      setGameOver(null);
    };
    const handleState = (data: {
      snapshot: Snapshot;
      leaderboard: LeaderboardEntry[];
    }) => {
      setSnapshot(data.snapshot);
      setLeaderboard(data.leaderboard);

      // 새 사냥꾼 감지 → 경고 토스트 표시
      const hunters = data.snapshot.hunters || [];
      const currentIds = new Set(hunters.map((h) => h.id));
      let fresh = false;
      for (const id of currentIds) {
        if (!knownHuntersRef.current.has(id)) fresh = true;
      }
      knownHuntersRef.current = currentIds;
      if (fresh) {
        setHunterAlert(Date.now() + 4000);
      }
    };
    const handleGameOver = (res: GameOverResult) => {
      setGameOver(res);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("joined", handleJoined);
    socket.on("state", handleState);
    socket.on("gameOver", handleGameOver);

    if (socket.connected) handleConnect();

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("joined", handleJoined);
      socket.off("state", handleState);
      socket.off("gameOver", handleGameOver);
    };
  }, [router.isReady, nick]);

  // ===== 입력 =====
  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") inputRef.current.up = true;
      else if (k === "arrowdown" || k === "s") inputRef.current.down = true;
      else if (k === "arrowleft" || k === "a") inputRef.current.left = true;
      else if (k === "arrowright" || k === "d") inputRef.current.right = true;
      else return;
      e.preventDefault();
    };
    const keyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") inputRef.current.up = false;
      else if (k === "arrowdown" || k === "s") inputRef.current.down = false;
      else if (k === "arrowleft" || k === "a") inputRef.current.left = false;
      else if (k === "arrowright" || k === "d") inputRef.current.right = false;
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, []);

  // 입력 전송 루프 (30Hz, 변화 있을 때만)
  useEffect(() => {
    const socket = getSocket();
    const interval = setInterval(() => {
      const i = inputRef.current;
      let dx = 0;
      let dy = 0;
      if (i.left) dx -= 1;
      if (i.right) dx += 1;
      if (i.up) dy -= 1;
      if (i.down) dy += 1;

      const now = performance.now();
      const last = lastSentRef.current;
      const changed =
        last.dx !== dx || last.dy !== dy || now - last.t > 400;
      if (changed) {
        socket.emit("input", { dx, dy });
        lastSentRef.current = { dx, dy, t: now };
      }
    }, 1000 / 30);
    return () => clearInterval(interval);
  }, []);

  // 언마운트 시 소켓 유지 (페이지 이동 중에만). 로비 이동 시 명시적으로 끊음
  const onRespawn = () => {
    const socket = getSocket();
    setGameOver(null);
    socket.emit("respawn");
  };
  const onQuit = () => {
    disconnectSocket();
    router.push("/");
  };

  return (
    <div className="game-wrap">
      <GameCanvas snapshot={snapshot} myId={myId} world={world} />

      <HUD me={me} />
      <Leaderboard entries={leaderboard} myId={myId} />

      {!connected && <div className="toast">서버에 연결 중...</div>}
      {connected && !me && !gameOver && (
        <div className="toast">생태계에 참여하는 중...</div>
      )}

      {hunterAlert > Date.now() && (
        <div className="hunter-alert">
          <span className="ha-icon">⚠️</span>
          <span>사냥꾼이 나타났다! 도망쳐!</span>
        </div>
      )}

      <div className="hint-bar">방향키 / WASD 로 이동 · 초록 링 = 먹이 · 빨강 링 = 포식자 · 🧑‍🌾 = 사냥꾼</div>

      {gameOver && (
        <ResultModal
          result={gameOver}
          onRespawn={onRespawn}
          onQuit={onQuit}
        />
      )}
    </div>
  );
}
