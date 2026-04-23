export interface Species {
  id: number;
  name: string;
  emoji: string;
  tier: 0 | 1 | 2 | 3;
}

export interface World {
  width: number;
  height: number;
}

export interface EntityState {
  id: string;
  nickname?: string;
  speciesId: number;
  tier: number;
  level: number;
  x: number;
  y: number;
  radius: number;
  energy: number;
  satiety: number;
  score: number;
  alive: boolean;
  isAI: boolean;
}

export interface FoodState {
  id: string;
  speciesId: number;
  tier: 0;
  x: number;
  y: number;
  radius: number;
}

export interface HunterState {
  id: string;
  x: number;
  y: number;
  radius: number;
  heading: number; // radians
  shooting: boolean;
  expiresAt: number;
}

export interface BulletState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Snapshot {
  world: World;
  players: EntityState[];
  ais: EntityState[];
  foods: FoodState[];
  hunters?: HunterState[];
  bullets?: BulletState[];
  t: number;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  speciesId: number;
  tier: number;
  level: number;
  score: number;
  alive: boolean;
  isAI: boolean;
}

export interface GameOverResult {
  nickname: string;
  speciesId: number;
  tier: number;
  level: number;
  score: number;
  survivalMs: number;
  killedBy: { nickname: string; speciesId: number } | null;
}

export interface JoinedPayload {
  id: string;
  player: EntityState;
  world: World;
}

export interface InputPacket {
  dx: number;
  dy: number;
}
