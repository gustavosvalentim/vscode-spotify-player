import * as vscode from "vscode";
import { AuthController } from "./controllers/auth.controller";
import { PlayerController } from "./controllers/player.controller";
import { VSCodeSecretsManager, formatSecretKeyName } from "./secrets";
import { config, extensionName } from "./constants";
import { AuthService } from "./services/auth.service";
import { HttpClient, SpotifyClient } from "./spotify-client";

const spotifyHttpClient = new HttpClient("https://api.spotify.com");

export async function activate(context: vscode.ExtensionContext) {
  const secretsManager = new VSCodeSecretsManager(
    context.secrets,
    formatSecretKeyName("auth", extensionName)
  );

  const authService = new AuthService(config);
  const authController = new AuthController(secretsManager, authService);

  const oauthToken = await secretsManager.get("access_token");
  spotifyHttpClient.config.headers = {
    Authorization: `Bearer ${oauthToken}`,
  };

  spotifyHttpClient.onError = async (
    response: Response,
    client: HttpClient
  ) => {
    if (response.status === 401) {
      try {
        await authController.refreshToken();
      } catch (err) {
        await authController.signIn();
      }
    }

    const oauthToken = await secretsManager.get("access_token");
    client.config.headers = {
      ...client.config.headers,
      Authorization: `Bearer ${oauthToken}`,
    };
  };
  const spotifyClient = new SpotifyClient(spotifyHttpClient);
  const playerController = new PlayerController(spotifyClient);

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri: (uri: vscode.Uri) => authController.getToken(uri),
    }),
    vscode.commands.registerCommand("vscode-spotify-player.searchAndPlay", () =>
      playerController.searchAndPlaySong()
    ),
    vscode.commands.registerCommand("vscode-spotify-player.playNext", () =>
      playerController.playNext()
    ),
    vscode.commands.registerCommand(
      "vscode-spotify-player.getCurrentlyPlaying",
      () => playerController.getCurrentlyPlaying()
    ),
    vscode.commands.registerCommand("vscode-spotify-player.signIn", () =>
      authController.signIn()
    )
  );
}

export function deactivate() {
  // TODO: clean up globalState
}
