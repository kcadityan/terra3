import Phaser from "phaser";

import type { WorldSnapshot } from "../shared/world";
import { WorldClient } from "./core";

export class WorldScene extends Phaser.Scene {
  private readonly worldClient: WorldClient;
  private readonly tileSize: number;
  private unsubscribe: (() => void) | undefined;
  private graphics: Phaser.GameObjects.Graphics | undefined;

  constructor(worldClient: WorldClient, tileSize = 32) {
    super({ key: "WorldScene" });
    this.worldClient = worldClient;
    this.tileSize = tileSize;
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.unsubscribe = this.worldClient.onWorldUpdate((snapshot) => this.drawGrid(snapshot));
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

  private drawGrid(snapshot: WorldSnapshot): void {
    if (!this.graphics) return;

    const { width, height, cells } = snapshot;
    const g = this.graphics;
    g.clear();
    g.lineStyle(1, 0x444444, 0.8);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const cell = cells[y]?.[x];
        const color = this.terrainColor(cell?.terrain ?? "Empty");
        g.fillStyle(color, 0.6);
        g.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        g.strokeRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
      }
    }
  }

  private terrainColor(terrain: string): number {
    switch (terrain) {
      case "Dirt":
      default:
        return 0x6b4f2a;
    }
  }
}

export function createWorldGame(worldClient: WorldClient, parent: HTMLElement | string): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 10 * 32,
    height: 10 * 32,
    parent,
    scene: new WorldScene(worldClient)
  });
}
