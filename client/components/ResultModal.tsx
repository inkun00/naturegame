import type { GameOverResult } from "../lib/types";
import { speciesEmoji, speciesName, TIER_LABEL } from "../lib/species";

interface Props {
  result: GameOverResult;
  onRespawn: () => void;
  onQuit: () => void;
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  if (m <= 0) return `${rs}초`;
  return `${m}분 ${rs}초`;
}

export default function ResultModal({ result, onRespawn, onQuit }: Props) {
  return (
    <div className="modal-mask">
      <div className="modal">
        <div style={{ fontSize: 56, marginBottom: 4 }}>
          {speciesEmoji(result.speciesId)}
        </div>
        <h2 className="modal-title">게임 오버</h2>
        <p className="modal-sub">
          {result.killedBy
            ? result.killedBy.speciesId < 0
              ? `${result.killedBy.nickname} 의 총에 맞아 쓰러졌습니다`
              : `${result.killedBy.nickname} (${speciesName(
                  result.killedBy.speciesId
                )}) 에게 먹혔습니다`
            : "에너지가 모두 소진되었습니다"}
        </p>

        <div className="modal-stats">
          <div className="stat-cell">
            <div className="stat-label">최종 레벨</div>
            <div className="stat-value">Lv {result.level}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">최종 진화 단계</div>
            <div className="stat-value">
              {TIER_LABEL[result.tier] || `Tier ${result.tier}`}
            </div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">종</div>
            <div className="stat-value">{speciesName(result.speciesId)}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">생존 시간</div>
            <div className="stat-value">
              {formatDuration(result.survivalMs)}
            </div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">점수</div>
            <div className="stat-value" style={{ color: "#fbbf24" }}>
              {result.score}
            </div>
          </div>
        </div>

        <button className="modal-btn" onClick={onRespawn}>
          다시 시작
        </button>
        <button className="modal-btn secondary" onClick={onQuit}>
          로비로
        </button>
      </div>
    </div>
  );
}
