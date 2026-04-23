import type { LeaderboardEntry } from "../lib/types";
import { speciesEmoji } from "../lib/species";

interface Props {
  entries: LeaderboardEntry[];
  myId: string | null;
}

export default function Leaderboard({ entries, myId }: Props) {
  return (
    <div className="leaderboard">
      <h3>🏆 실시간 랭킹</h3>
      <ul className="lb-list">
        {entries.length === 0 && (
          <li style={{ color: "#64748b", fontSize: 12 }}>
            접속한 플레이어가 없어요.
          </li>
        )}
        {entries.map((e, i) => (
          <li
            key={e.id}
            className={"lb-item" + (e.id === myId ? " me" : "")}
            title={`${e.nickname} — Lv ${e.level} / Tier ${e.tier}`}
          >
            <span className="lb-rank">{i + 1}</span>
            <span>{speciesEmoji(e.speciesId)}</span>
            <span className="lb-name">
              {e.nickname}{" "}
              <span style={{ color: "#94a3b8", fontSize: 11 }}>
                Lv{e.level} · T{e.tier}
              </span>
            </span>
            <span className="lb-score">{e.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
