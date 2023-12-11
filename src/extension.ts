import * as vscode from "vscode";
import { AuthController } from "./controllers/auth.controller";
import { PlayerController } from "./controllers/player.controller";
import { SpotifyClient } from "./spotify-client";
import { VSCodeSecretsManager, formatSecretKeyName } from "./secrets";
import { config, extensionName } from "./constants";
import { AuthService } from "./services/auth.service";

export function activate(context: vscode.ExtensionContext) {
  const secretsManager = new VSCodeSecretsManager(
    context.secrets,
    formatSecretKeyName("auth", extensionName)
  );
  const authService = new AuthService(config);
  const getToken = async () => {
    const signIn = async () => {
      const authorizeEndpointConfig =
        await authService.getAuthorizeEndpointConfiguration();
      const signIn = await vscode.window.showInformationMessage(
        "You need to login to Spotify",
        "Sign in"
      );

      if (signIn) {
        await secretsManager.set(
          "code_verifier",
          authorizeEndpointConfig.codeVerifier
        );
        await vscode.env.openExternal(
          vscode.Uri.parse(authorizeEndpointConfig.url)
        );
        return;
      }
    };

    const expiresOn = await secretsManager.get("expires_on");
    const refreshToken = await secretsManager.get("refresh_token");

    if (!refreshToken) {
      await signIn();
      return;
    }

    if (refreshToken && expiresOn && Date.now() >= parseInt(expiresOn)) {
      const response = await authService.refreshToken(refreshToken);
      if (response.error) {
        console.error(response.error);
        await signIn();
        return;
      }
    }

    return secretsManager.get("access_token");
  };
  const spotifyClient = new SpotifyClient(getToken);
  const authController = new AuthController(secretsManager, authService);
  const playerController = new PlayerController(spotifyClient);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-spotify-player.authenticationUrl",
      () => authController.signIn()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-spotify-player.getCurrentlyPlaying",
      () => playerController.getCurrentlyPlaying()
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("vscode-spotify-player.playNext", () =>
      playerController.playNext()
    )
  );
  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri: vscode.Uri) => authController.getToken(uri),
    })
  );
}

export function deactivate() {
  // TODO: clean up globalState
}
