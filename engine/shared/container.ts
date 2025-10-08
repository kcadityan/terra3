export type Token<T> = symbol & { readonly __cap?: T };

export const token = <T>(description: string): Token<T> => {
  if (!description) {
    throw new Error("Token description must be a non-empty string");
  }
  return Symbol.for(description) as Token<T>;
};

export class Container {
  private readonly providers = new Map<Token<unknown>, unknown>();

  provide<T>(key: Token<T>, value: T): void {
    this.providers.set(key, value);
  }

  has<T>(key: Token<T>): boolean {
    return this.providers.has(key);
  }

  get<T>(key: Token<T>): T {
    if (!this.providers.has(key)) {
      throw new Error(`Missing dependency: ${String(key.description ?? key.toString())}`);
    }
    return this.providers.get(key) as T;
  }

  with<T>(key: Token<T>, fn: (value: T) => void): void {
    fn(this.get(key));
  }
}
