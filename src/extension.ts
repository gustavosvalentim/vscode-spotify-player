import * as vscode from "vscode";
import { AuthController } from "./controllers/authController";
import { SpotifyClient } from "./spotify-client";
import { PlayerController } from "./controllers/playerController";

export function activate(context: vscode.ExtensionContext) {
  const spotifyClient = new SpotifyClient(
    async () =>
      await context.secrets.get("vscode-spotify-player.auth.access_token")
  );
  const authController = new AuthController(context.secrets);
  const playerController = new PlayerController(spotifyClient);

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "vscode-spotify-player.authenticationUrl",
      () => authController.getSignInUrl()
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
      handleUri: async (uri: vscode.Uri) => authController.getToken(uri),
    })
  );
}

export function deactivate() {
  // TODO: clean up globalState
}
