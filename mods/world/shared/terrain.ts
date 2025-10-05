export type TerrainId = string;

export interface TerrainDefinition {
  id: TerrainId;
  name: string;
  texturePath: string;
  color: number;
}

export class TerrainRegistry {
  private readonly definitions = new Map<TerrainId, TerrainDefinition>();

  register(definition: TerrainDefinition): void {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Terrain '${definition.id}' already registered`);
    }
    this.definitions.set(definition.id, definition);
  }

  get(id: TerrainId): TerrainDefinition | undefined {
    return this.definitions.get(id);
  }

  require(id: TerrainId): TerrainDefinition {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error(`Terrain '${id}' is not registered`);
    }
    return def;
  }

  all(): TerrainDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export function createTerrainRegistry(): TerrainRegistry {
  return new TerrainRegistry();
}
