import "./style.css";

import { WorldClient, createWorldGame } from "../../mods/world/client";

type WorldConfig = {
  endpoint: string;
};

function resolveConfig(): WorldConfig {
  const host = import.meta.env.VITE_WORLD_HOST ?? window.location.hostname;
  const port = import.meta.env.VITE_WORLD_PORT ?? "2567";
  const protocol = import.meta.env.VITE_WORLD_SECURE === "true" || window.location.protocol === "https:"
    ? "wss"
    : "ws";

  return { endpoint: `${protocol}://${host}:${port}` };
}

type HTMLElementOrNull = HTMLElement | null;

function getMountNode(): HTMLElement {
  const mount: HTMLElementOrNull = document.getElementById("app");
  if (!mount) {
    throw new Error("Missing #app mount node in index.html");
  }
  return mount;
}

function bootstrap() {
  const { endpoint } = resolveConfig();
  const worldClient = new WorldClient(endpoint);

  // Start the Phaser game which connects via the world client scene.
  createWorldGame(worldClient, getMountNode());

  const handleKeyDown = (event: KeyboardEvent) => {
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        worldClient.move(-1);
        break;
      case "ArrowRight":
      case "d":
      case "D":
        worldClient.move(1);
        break;
      case "ArrowUp":
      case "w":
      case "W":
      case " ":
        worldClient.jump();
        break;
      default:
        break;
    }
  };

  window.addEventListener("keydown", handleKeyDown);
}

bootstrap();
