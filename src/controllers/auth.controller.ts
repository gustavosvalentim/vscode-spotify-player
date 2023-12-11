import * as vscode from "vscode";
import { ISecretsManager } from "../secrets";
import { AuthService } from "../services/auth.service";

export class AuthController {
  public constructor(
    private readonly secretsManager: ISecretsManager,
    private readonly authService: AuthService
  ) {}

  public async signIn(): Promise<void> {
    const authorizeEndpointConfig =
      await this.authService.getAuthorizeEndpointConfiguration();

    const shouldOpenBrowser = await vscode.window.showInformationMessage(
      "Sign in with Spotify",
      "Open in browser"
    );
    if (shouldOpenBrowser) {
      await this.secretsManager.set(
        "code_verifier",
        authorizeEndpointConfig.codeVerifier
      );
      await vscode.env.openExternal(
        vscode.Uri.parse(authorizeEndpointConfig.url)
      );
    }
  }

  public async getToken(uri: vscode.Uri): Promise<void> {
    const queryParams = new URLSearchParams(uri.query);
    const code = queryParams.get("code");
    const codeVerifier = await this.secretsManager.get("code_verifier");

    if (!code || !codeVerifier) {
      console.error("null code %d or code verifier %d", code, codeVerifier);
      throw new Error("undefined authorization code or code verifier");
    }

    const response = await this.authService.getToken(code, codeVerifier);

    if (response.error) {
      console.error("getToken error", response.error);
      throw new Error("could not get token");
    }

    await this.secretsManager.set("access_token", response.access_token);
    await this.secretsManager.set("refresh_token", response.refresh_token);
    await this.secretsManager.set(
      "expires_on",
      (response.expires_in * 1000 + Date.now()).toString()
    );
  }

  public async refreshToken(): Promise<void> {
    const refreshToken = await this.secretsManager.get("refresh_token");

    if (!refreshToken) {
      console.error("refresh token is undefined", refreshToken);
      throw new Error("refresh token is undefined");
    }

    const response = await this.authService.refreshToken(refreshToken);

    if (response.error) {
      console.error("refreshToken error", response.error);
      throw new Error("could not refresh token");
    }

    await this.secretsManager.set("access_token", response.access_token);
    await this.secretsManager.set("refresh_token", response.refresh_token);
    await this.secretsManager.set(
      "expires_on",
      (response.expires_in * 1000 + Date.now()).toString()
    );
  }
}
