import * as vscode from "vscode";
import { generateCodeChallenge, generateCodeVerifier } from "../utils/encoding";
import { config } from "../constants";

export type TokenEndpointResponse = {
  token_type: "bearer";
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
};

export class AuthController {
  public constructor(private readonly secretsStorage: vscode.SecretStorage) {}

  public async getSignInUrl(): Promise<void> {
    const codeVerifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(codeVerifier);
    const urlParams = new URLSearchParams({
      code_challenge_method: "S256",
      code_challenge: challenge,
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      scope: "user-modify-playback-state user-read-playback-state",
    });
    const selection = await vscode.window.showInformationMessage(
      "Sign in with Spotify",
      "Open in browser"
    );

    await this.secretsStorage.store(
      "vscode-spotify-player.auth.code_verifier",
      codeVerifier
    );

    if (selection) {
      await vscode.env.openExternal(
        vscode.Uri.parse(
          config.accountsUrl + "/authorize?" + urlParams.toString()
        )
      );
    }
  }

  public async getToken(uri: vscode.Uri): Promise<void> {
    const queryParams = new URLSearchParams(uri.query);
    const code = queryParams.get("code");
    const codeVerifier = await this.secretsStorage.get(
      "vscode-spotify-player.auth.code_verifier"
    );
    const urlParams = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: codeVerifier || "",
      code: code || "",
    });
    const response = await fetch(config.accountsUrl + "/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlParams,
    });
    const responseBody = (await response.json()) as {
      access_token: string;
      refresh_token: string;
    };

    await this.secretsStorage.store(
      "vscode-spotify-player.auth.access_token",
      responseBody.access_token
    );
    await this.secretsStorage.store(
      "vscode-spotify-player.auth.refresh_token",
      responseBody.refresh_token as string
    );
  }
}
