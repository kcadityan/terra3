export type PlayerId = string;

export interface PlayerSnapshot {
  id: PlayerId;
  name: string;
  x: number;
  y: number;
  isJumping: boolean;
  facing: "left" | "right";
}
