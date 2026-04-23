import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const NICK_KEY = "ecoevo_nick";

export default function LobbyPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NICK_KEY);
      if (saved) setNickname(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const onStart = (e?: React.FormEvent) => {
    e?.preventDefault();
    const nick = nickname.trim().slice(0, 12) || "익명";
    try {
      localStorage.setItem(NICK_KEY, nick);
    } catch {
      /* ignore */
    }
    setLoading(true);
    router.push(`/game?nick=${encodeURIComponent(nick)}`);
  };

  return (
    <div className="lobby">
      <form className="lobby-card" onSubmit={onStart}>
        <h1 className="lobby-title">🌱 EcoEvolution</h1>
        <p className="lobby-sub">
          1차 소비자에서 시작해 최상위 포식자로 진화하세요.
        </p>

        <label className="lobby-label" htmlFor="nick">
          닉네임
        </label>
        <input
          id="nick"
          className="lobby-input"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="최대 12자"
          maxLength={12}
          autoFocus
        />

        <button className="lobby-btn" type="submit" disabled={loading}>
          {loading ? "접속 중..." : "게임 시작"}
        </button>

        <p className="lobby-hint">
          · 방향키 / WASD 로 이동합니다.
          <br />· 나보다 아래 단계 생물을 먹어 포만감을 100%로 채우면 진화합니다.
          <br />· 상위 포식자와 닿으면 에너지가 깎여요!
        </p>
      </form>
    </div>
  );
}
