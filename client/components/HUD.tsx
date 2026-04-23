import type { EntityState } from "../lib/types";
import {
  speciesEmoji,
  speciesName,
  preyListOf,
  TIER_LABEL,
} from "../lib/species";

interface Props {
  me: EntityState | null;
}

export default function HUD({ me }: Props) {
  if (!me) return null;
  const satiety = Math.max(0, Math.min(100, me.satiety));
  const energy = Math.max(0, Math.min(100, me.energy));
  const preyIds = preyListOf(me.speciesId);

  return (
    <div className="hud">
      <div className="hud-row">
        <span className="hud-emoji">{speciesEmoji(me.speciesId)}</span>
        <div>
          <div className="hud-name">
            {me.nickname || "나"} · {speciesName(me.speciesId)}
          </div>
          <div className="hud-tier">
            Lv {me.level} · Tier {me.tier} · {TIER_LABEL[me.tier] || "-"}
          </div>
        </div>
      </div>

      <div>
        <div className="bar-label">
          <span>에너지</span>
          <span>{Math.round(energy)} / 100</span>
        </div>
        <div className="bar-wrap">
          <div
            className="bar-fill"
            style={{
              width: energy + "%",
              background:
                energy > 50
                  ? "linear-gradient(90deg,#22c55e,#16a34a)"
                  : energy > 25
                  ? "linear-gradient(90deg,#fbbf24,#f59e0b)"
                  : "linear-gradient(90deg,#ef4444,#dc2626)",
            }}
          />
        </div>
      </div>

      <div>
        <div className="bar-label">
          <span>포만감 (레벨업까지)</span>
          <span>{Math.round(satiety)} / 100</span>
        </div>
        <div className="bar-wrap">
          <div
            className="bar-fill"
            style={{
              width: satiety + "%",
              background: "linear-gradient(90deg,#38bdf8,#0ea5e9)",
            }}
          />
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#cbd5e1" }}>
        점수: <b style={{ color: "#fbbf24" }}>{Math.round(me.score)}</b>
      </div>

      {preyIds.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 4,
            flexWrap: "wrap",
            alignItems: "center",
            fontSize: 11,
            color: "#94a3b8",
            paddingTop: 2,
          }}
          title="내가 먹을 수 있는 종"
        >
          <span>🍽️ 먹이:</span>
          {preyIds.map((id) => (
            <span key={id} style={{ fontSize: 16 }} title={speciesName(id)}>
              {speciesEmoji(id)}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
