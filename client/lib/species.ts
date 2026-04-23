import type { Species } from "./types";

/**
 * 81종 생물 먹이그물 데이터 (서버 `species.js` 와 동일 구조).
 * 실제 생태계 천적관계 기반: predator 가 prey 를 먹을 수 있는지는
 * `PREY[predatorId]` 에 prey id 가 포함되어 있는지로 판정한다.
 */
export const SPECIES: Species[] = [
  { id: 1, name: "연꽃", emoji: "🪷", tier: 0 },
  { id: 2, name: "소나무", emoji: "🌲", tier: 0 },
  { id: 3, name: "참나무", emoji: "🌳", tier: 0 },
  { id: 4, name: "사과나무", emoji: "🍎", tier: 0 },
  { id: 5, name: "귤나무", emoji: "🍊", tier: 0 },
  { id: 6, name: "바나나나무", emoji: "🍌", tier: 0 },
  { id: 7, name: "잔디", emoji: "🌱", tier: 0 },
  { id: 8, name: "갈대", emoji: "🌾", tier: 0 },
  { id: 9, name: "억새", emoji: "🌾", tier: 0 },
  { id: 10, name: "토끼풀", emoji: "🍀", tier: 0 },
  { id: 11, name: "민들레", emoji: "🌼", tier: 0 },
  { id: 12, name: "무궁화", emoji: "🌺", tier: 0 },
  { id: 13, name: "해바라기", emoji: "🌻", tier: 0 },
  { id: 14, name: "이끼", emoji: "🟢", tier: 0 },
  { id: 15, name: "벼", emoji: "🌾", tier: 0 },
  { id: 16, name: "밀", emoji: "🌾", tier: 0 },
  { id: 17, name: "옥수수", emoji: "🌽", tier: 0 },
  { id: 18, name: "배추", emoji: "🥬", tier: 0 },
  { id: 19, name: "무", emoji: "🥗", tier: 0 },
  { id: 20, name: "당근", emoji: "🥕", tier: 0 },
  { id: 21, name: "고구마", emoji: "🍠", tier: 0 },

  { id: 22, name: "메뚜기", emoji: "🦗", tier: 1 },
  { id: 23, name: "여치", emoji: "🦗", tier: 1 },
  { id: 24, name: "나비", emoji: "🦋", tier: 1 },
  { id: 25, name: "꿀벌", emoji: "🐝", tier: 1 },
  { id: 26, name: "진딧물", emoji: "🐛", tier: 1 },
  { id: 27, name: "달팽이", emoji: "🐌", tier: 1 },
  { id: 28, name: "지렁이", emoji: "🪱", tier: 1 },
  { id: 29, name: "송사리", emoji: "🐟", tier: 1 },
  { id: 30, name: "쥐", emoji: "🐭", tier: 1 },
  { id: 31, name: "토끼", emoji: "🐰", tier: 1 },
  { id: 32, name: "다람쥐", emoji: "🐿️", tier: 1 },
  { id: 33, name: "청설모", emoji: "🐿️", tier: 1 },
  { id: 34, name: "소", emoji: "🐄", tier: 1 },
  { id: 35, name: "말", emoji: "🐎", tier: 1 },
  { id: 36, name: "양", emoji: "🐑", tier: 1 },
  { id: 37, name: "염소", emoji: "🐐", tier: 1 },
  { id: 38, name: "기린", emoji: "🦒", tier: 1 },
  { id: 39, name: "코끼리", emoji: "🐘", tier: 1 },
  { id: 40, name: "얼룩말", emoji: "🦓", tier: 1 },
  { id: 41, name: "사슴", emoji: "🦌", tier: 1 },
  { id: 42, name: "노루", emoji: "🦌", tier: 1 },
  { id: 43, name: "고라니", emoji: "🦌", tier: 1 },
  { id: 44, name: "하마", emoji: "🦛", tier: 1 },
  { id: 45, name: "코뿔소", emoji: "🦏", tier: 1 },
  { id: 46, name: "캥거루", emoji: "🦘", tier: 1 },
  { id: 47, name: "코알라", emoji: "🐨", tier: 1 },

  { id: 48, name: "개구리", emoji: "🐸", tier: 2 },
  { id: 49, name: "두꺼비", emoji: "🐸", tier: 2 },
  { id: 50, name: "도마뱀", emoji: "🦎", tier: 2 },
  { id: 51, name: "카멜레온", emoji: "🦎", tier: 2 },
  { id: 52, name: "소형뱀", emoji: "🐍", tier: 2 },
  { id: 53, name: "참새", emoji: "🐦", tier: 2 },
  { id: 54, name: "제비", emoji: "🐦", tier: 2 },
  { id: 55, name: "비둘기", emoji: "🕊️", tier: 2 },
  { id: 56, name: "까마귀", emoji: "🐦‍⬛", tier: 2 },
  { id: 57, name: "딱따구리", emoji: "🐦", tier: 2 },
  { id: 58, name: "오리", emoji: "🦆", tier: 2 },
  { id: 59, name: "닭", emoji: "🐔", tier: 2 },
  { id: 60, name: "고양이", emoji: "🐱", tier: 2 },
  { id: 61, name: "미어캣", emoji: "🐾", tier: 2 },
  { id: 62, name: "수달", emoji: "🦦", tier: 2 },
  { id: 63, name: "너구리", emoji: "🦝", tier: 2 },
  { id: 64, name: "여우", emoji: "🦊", tier: 2 },
  { id: 65, name: "오소리", emoji: "🦡", tier: 2 },
  { id: 66, name: "거미", emoji: "🕷️", tier: 2 },

  { id: 67, name: "사자", emoji: "🦁", tier: 3 },
  { id: 68, name: "호랑이", emoji: "🐅", tier: 3 },
  { id: 69, name: "표범", emoji: "🐆", tier: 3 },
  { id: 70, name: "치타", emoji: "🐆", tier: 3 },
  { id: 71, name: "재규어", emoji: "🐆", tier: 3 },
  { id: 72, name: "늑대", emoji: "🐺", tier: 3 },
  { id: 73, name: "불곰", emoji: "🐻", tier: 3 },
  { id: 74, name: "북극곰", emoji: "🐻‍❄️", tier: 3 },
  { id: 75, name: "독수리", emoji: "🦅", tier: 3 },
  { id: 76, name: "매", emoji: "🦅", tier: 3 },
  { id: 77, name: "부엉이", emoji: "🦉", tier: 3 },
  { id: 78, name: "올빼미", emoji: "🦉", tier: 3 },
  { id: 79, name: "아나콘다", emoji: "🐍", tier: 3 },
  { id: 80, name: "코모도왕도마뱀", emoji: "🦎", tier: 3 },
  { id: 81, name: "악어", emoji: "🐊", tier: 3 },

  { id: 82, name: "딸기", emoji: "🍓", tier: 0 },
  { id: 83, name: "포도", emoji: "🍇", tier: 0 },
  { id: 84, name: "수박", emoji: "🍉", tier: 0 },
  { id: 85, name: "토마토", emoji: "🍅", tier: 0 },
  { id: 86, name: "버섯", emoji: "🍄", tier: 0 },
  { id: 87, name: "대나무", emoji: "🎋", tier: 0 },
  { id: 88, name: "선인장", emoji: "🌵", tier: 0 },

  { id: 89, name: "판다", emoji: "🐼", tier: 1 },
  { id: 90, name: "원숭이", emoji: "🐒", tier: 1 },
  { id: 91, name: "고릴라", emoji: "🦍", tier: 1 },
  { id: 92, name: "낙타", emoji: "🐫", tier: 1 },
  { id: 93, name: "비버", emoji: "🦫", tier: 1 },
  { id: 94, name: "멧돼지", emoji: "🐗", tier: 1 },
  { id: 95, name: "잉어", emoji: "🐠", tier: 1 },

  { id: 96, name: "사마귀", emoji: "🦗", tier: 2 },
  { id: 97, name: "박쥐", emoji: "🦇", tier: 2 },
  { id: 98, name: "고슴도치", emoji: "🦔", tier: 2 },
  { id: 99, name: "스컹크", emoji: "🦨", tier: 2 },
  { id: 100, name: "무당벌레", emoji: "🐞", tier: 2 },
  { id: 101, name: "전갈", emoji: "🦂", tier: 2 },

  { id: 102, name: "하이에나", emoji: "🐺", tier: 3 },
  { id: 103, name: "스라소니", emoji: "🐆", tier: 3 },
  { id: 104, name: "퓨마", emoji: "🐆", tier: 3 },
];

/**
 * 실제 생태계 천적관계 테이블.
 * key = predator id, value = 먹을 수 있는 prey id 배열.
 * 서버의 `species.js` 의 PREY 와 동일하게 유지해야 함.
 */
export const PREY: Record<number, number[]> = {
  22: [7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 82, 85],
  23: [7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 21, 82, 85],
  24: [4, 5, 10, 11, 12, 13, 82, 83],
  25: [1, 4, 5, 6, 10, 11, 12, 13, 82, 83],
  26: [3, 4, 5, 7, 18, 19, 20, 21, 82, 85],
  27: [7, 10, 11, 14, 18, 19, 86],
  28: [14],
  29: [1, 14],
  30: [13, 15, 16, 17, 18, 19, 20, 21, 82, 85, 86],
  31: [7, 10, 11, 13, 18, 19, 20, 82, 85],
  32: [2, 3, 4, 5, 83],
  33: [2, 3, 4, 5, 6, 83],
  34: [7, 8, 9, 10, 11],
  35: [7, 8, 9, 10, 11],
  36: [7, 8, 9, 10, 11],
  37: [2, 3, 7, 8, 9, 10, 11],
  38: [3, 4, 5, 6],
  39: [3, 6, 7, 8, 9],
  40: [7, 8, 9, 10, 11],
  41: [3, 4, 7, 10, 11, 13, 82, 83],
  42: [3, 4, 7, 10, 11, 82],
  43: [3, 4, 7, 10, 11, 82],
  44: [1, 7, 8, 9],
  45: [7, 8, 9, 10],
  46: [7, 10, 11, 13],
  47: [2, 3],
  89: [87],
  90: [4, 5, 6, 82, 83],
  91: [3, 6, 7, 82, 83, 87],
  92: [7, 88],
  93: [2, 3, 87],
  94: [3, 17, 18, 19, 20, 21, 85, 86],
  95: [1, 14, 28],

  48: [22, 23, 24, 25, 26, 27, 28, 66, 100],
  49: [22, 23, 24, 25, 26, 27, 28, 66, 100],
  50: [22, 23, 24, 25, 26, 27, 28, 66, 100],
  51: [22, 23, 24, 25, 26, 66, 100],
  52: [22, 23, 27, 29, 30, 48, 49, 50, 51, 53, 54, 66, 97],
  53: [15, 16, 22, 23, 24, 25, 26, 27, 66, 100],
  54: [22, 23, 24, 25, 26, 100],
  55: [7, 11, 13, 15, 16, 17, 26, 82],
  56: [4, 15, 16, 17, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 48, 50, 51, 53, 66, 82, 83, 85, 86, 96, 100],
  57: [22, 23, 26, 28, 66, 96, 100],
  58: [1, 14, 22, 24, 27, 28, 29, 48, 66, 95],
  59: [15, 16, 17, 22, 24, 25, 26, 27, 28, 50, 66, 100],
  60: [22, 24, 29, 30, 32, 48, 50, 51, 53, 54, 55, 66, 95, 96, 97, 100],
  61: [22, 23, 26, 27, 28, 29, 48, 50, 52, 66, 98, 100, 101],
  62: [27, 28, 29, 30, 48, 49, 66, 95],
  63: [4, 14, 17, 21, 22, 24, 25, 26, 27, 28, 29, 30, 32, 48, 50, 66, 82, 83, 85, 86, 100],
  64: [22, 26, 30, 31, 32, 33, 48, 50, 53, 54, 55, 57, 59, 66, 93, 96, 98, 100],
  65: [3, 21, 22, 26, 27, 28, 30, 33, 48, 50, 66],
  66: [22, 23, 24, 25, 26, 27, 100],
  96: [22, 23, 24, 25, 26, 27, 66, 100],
  97: [22, 23, 24, 25, 26, 100],
  98: [22, 23, 26, 27, 28, 50, 66, 100],
  99: [22, 26, 27, 28, 30, 48, 49, 50, 66],
  100: [26],
  101: [22, 23, 26, 27, 28, 30, 48, 50, 52, 66],

  67: [31, 34, 35, 36, 37, 38, 40, 41, 42, 43, 90, 92, 94],
  68: [31, 34, 35, 36, 37, 41, 42, 43, 45, 92, 94],
  69: [31, 32, 33, 41, 42, 43, 50, 52, 53, 55, 60, 63, 64, 90, 94],
  70: [31, 40, 41, 42, 43, 46],
  71: [29, 30, 31, 41, 42, 48, 49, 50, 52, 58, 66, 90, 95],
  72: [30, 31, 32, 33, 34, 36, 37, 41, 42, 43, 63, 64, 65, 93, 94],
  73: [4, 5, 15, 17, 21, 25, 29, 30, 31, 32, 33, 41, 42, 48, 63, 64, 82, 83, 86, 93, 94, 95],
  74: [29, 30, 31, 58, 62, 64, 95],
  75: [30, 31, 32, 33, 48, 50, 51, 52, 53, 55, 56, 57, 58, 59, 60, 61, 62, 93, 95, 97, 98, 99, 101],
  76: [22, 24, 30, 32, 33, 48, 50, 52, 53, 54, 55, 57, 61, 97],
  77: [30, 31, 32, 33, 48, 50, 53, 54, 55, 57, 97, 98, 99, 101],
  78: [30, 31, 32, 33, 48, 50, 53, 54, 55, 57, 97],
  79: [29, 30, 31, 32, 33, 41, 42, 48, 49, 50, 58, 59, 64, 90, 93, 94, 95],
  80: [30, 31, 34, 36, 37, 41, 42, 48, 50, 52, 58, 59],
  81: [29, 34, 35, 37, 40, 41, 42, 43, 46, 48, 52, 58, 62, 90, 92, 93, 94, 95],
  102: [22, 30, 31, 32, 33, 34, 36, 37, 41, 42, 43, 48, 50, 59, 63, 64, 65],
  103: [22, 26, 30, 31, 32, 33, 42, 43, 48, 50, 53, 55, 63, 93, 98, 100],
  104: [30, 31, 32, 33, 41, 42, 43, 46, 48, 50, 60, 63, 64, 90, 94],
};

const PREY_SET: Map<number, Set<number>> = new Map();
for (const [k, v] of Object.entries(PREY)) {
  PREY_SET.set(Number(k), new Set(v));
}

const BY_ID = new Map<number, Species>(SPECIES.map((s) => [s.id, s]));

export function getSpecies(id: number): Species | undefined {
  return BY_ID.get(id);
}

export function speciesName(id: number): string {
  return BY_ID.get(id)?.name ?? "?";
}

export function speciesEmoji(id: number): string {
  return BY_ID.get(id)?.emoji ?? "❓";
}

/** 실제 천적관계 기반 섭취 가능 여부 */
export function canEat(predatorId: number, preyId: number): boolean {
  const set = PREY_SET.get(predatorId);
  if (!set) return false;
  return set.has(preyId);
}

/** predator 의 먹이 종 id 목록 */
export function preyListOf(predatorId: number): number[] {
  return PREY[predatorId] ?? [];
}

export const TIER_LABEL: Record<number, string> = {
  0: "생산자",
  1: "1차 소비자",
  2: "2차 소비자",
  3: "3차 소비자",
  4: "4차 소비자",
};
