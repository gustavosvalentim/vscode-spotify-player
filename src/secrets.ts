import * as vscode from "vscode";

export type ISecretsManager = {
  set(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | undefined>;
};

export const formatSecretKeyName = (key: string, prefix?: string) =>
  [prefix, key].join(".");

export class VSCodeSecretsManager implements ISecretsManager {
  public prefix: string;

  private readonly storage: vscode.SecretStorage;

  public constructor(storage: vscode.SecretStorage, prefix: string = "") {
    this.storage = storage;
    this.prefix = prefix;
  }

  public async set(key: string, value: string): Promise<void> {
    return this.storage.store(formatSecretKeyName(key, this.prefix), value);
  }

  public async get(key: string): Promise<string | undefined> {
    return this.storage.get(formatSecretKeyName(key, this.prefix));
  }
}
