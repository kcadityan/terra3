import Phaser from "phaser";

import type { WorldStateView } from "../shared/world";
import { WORLD_WIDTH, WORLD_HEIGHT } from "../shared/world";
import { WorldClient } from "./core";

export class WorldScene extends Phaser.Scene {
  private readonly worldClient: WorldClient;
  private readonly tileSize: number;
  private unsubscribe: (() => void) | undefined;
  private graphics: Phaser.GameObjects.Graphics | undefined;
  private paletteColors = new Map<string, number>();

  constructor(worldClient: WorldClient, tileSize = 32) {
    super({ key: "WorldScene" });
    this.worldClient = worldClient;
    this.tileSize = tileSize;
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.unsubscribe = this.worldClient.onWorldUpdate((snapshot) => this.drawScene(snapshot));
    this.worldClient.connect().catch((err) => {
      console.error("Failed to connect to world room", err);
    });
  }

  shutdown(): void {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    this.graphics?.destroy();
    this.graphics = undefined;
  }

  destroy(fromScene?: boolean): void {
    this.shutdown();
    super.destroy(fromScene);
  }

  private drawScene(snapshot: WorldStateView): void {
    if (!this.graphics) return;

    this.updatePalette(snapshot);

    const { width, height, cells } = snapshot;
    const g = this.graphics;
    g.clear();
    g.lineStyle(1, 0x444444, 0.8);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const terrainId = cells[y]?.[x] ?? "";
        const color = this.terrainColor(terrainId);
        g.fillStyle(color, 0.6);
        g.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        g.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }

    this.drawPlayers(g, snapshot);
  }

  private updatePalette(snapshot: WorldStateView): void {
    this.paletteColors.clear();
    snapshot.palette.forEach((entry) => {
      this.paletteColors.set(entry.id, entry.color);
    });
  }

  private terrainColor(terrainId: string): number {
    return this.paletteColors.get(terrainId) ?? 0x1e1e1e;
  }

  private drawPlayers(g: Phaser.GameObjects.Graphics, snapshot: WorldStateView): void {
    const width = this.tileSize * 0.6;
    const height = this.tileSize * 0.85;
    const halfWidth = width / 2;

    snapshot.players.forEach((player) => {
      const color = player.isJumping ? 0xffd166 : 0xffffff;
      const baseX = player.x * this.tileSize + this.tileSize / 2;
      const tileTop = player.y * this.tileSize;
      const tileBottom = tileTop + this.tileSize;
      const left = baseX - halfWidth;
      const top = tileBottom - height;

      g.fillStyle(color, 1);
      g.fillRect(left, top, width, height);
      g.lineStyle(1, 0x000000, 0.8);
      g.strokeRect(left, top, width, height);
    });
  }
}

export function createWorldGame(worldClient: WorldClient, parent: HTMLElement | string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: WORLD_WIDTH * 32,
    height: WORLD_HEIGHT * 32,
    parent,
    scene: new WorldScene(worldClient)
  });
}
