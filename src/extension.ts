import * as vscode from "vscode";
import { SpotifyAuthenticationState, SpotifyClient } from "./spotify-client";

export function activate(context: vscode.ExtensionContext) {
  const persistenceKey = "vscode-spotify-player.authentication.tokens";

  const spotify = new SpotifyClient(
    {
      clientId: "",
      redirectUri: "vscode://gustavosvalentim.vscode-spotify-player",
      authorizeEndpoint: "https://accounts.spotify.com/authorize",
      tokenEndpoint: "https://accounts.spotify.com/api/token",
      scopes: ["user-modify-playback-state", "user-read-playback-state"],
    },
    async () => {
      return context.globalState.get(persistenceKey) as
        | SpotifyAuthenticationState
        | undefined;
    }
  );

  spotify.onUpdateAuthenticationState((newState) => {
    context.globalState.update(persistenceKey, newState);
  });

  const getAuthenticationUrlCommand = vscode.commands.registerCommand(
    "vscode-spotify-player.authenticationUrl",
    async () => {
      const shouldOpenWithBrowser = await vscode.window.showInformationMessage(
        "Login with Spotify",
        "Open with browser"
      );

      if (shouldOpenWithBrowser) {
        await vscode.env.openExternal(
          vscode.Uri.parse(await spotify.getAuthorizeEndpoint())
        );
      }
    }
  );

  const getPlaybackState = vscode.commands.registerCommand(
    "vscode-spotify-player.getCurrentlyPlaying",
    async () => {
      try {
        const playbackState = await spotify.player.getPlaybackState();

        if (!playbackState.isPlaying) {
          return;
        }

        await vscode.window.showInformationMessage(
          `Currently playing ${playbackState.song?.artist} - ${playbackState.song?.name} on ${playbackState.device?.name}`
        );
      } catch (e) {
        await vscode.window.showErrorMessage((e as Error).message);
      }
    }
  );

  const playNextCommand = vscode.commands.registerCommand(
    "vscode-spotify-player.playNext",
    async () => {
      try {
        await spotify.player.playNext();
      } catch (e) {
        await vscode.window.showErrorMessage((e as Error).message);
      }
    }
  );

  const handleAuthenticate = vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri): vscode.ProviderResult<void> {
      console.debug(`New login ${uri}`);

      const parsedParams = new URLSearchParams(uri.query);
      spotify
        .authenticate(parsedParams.get("code")!)
        .then(() =>
          vscode.window.showInformationMessage("Spotify authentication OK")
        )
        .catch((err) => vscode.window.showErrorMessage((err as Error).message));
    },
  });

  context.subscriptions.push(
    handleAuthenticate,
    getAuthenticationUrlCommand,
    getPlaybackState,
    playNextCommand
  );
}

export function deactivate() {
  // TODO: clean up globalState
}
