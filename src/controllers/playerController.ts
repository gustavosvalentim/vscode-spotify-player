import * as vscode from "vscode";
import { SpotifyClient } from "../spotify-client";

export class PlayerController {
  public constructor(private readonly client: SpotifyClient) {}

  public async getCurrentlyPlaying(): Promise<void> {
    try {
      const playbackState = await this.client.player.getPlaybackState();

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

  public async playNext(): Promise<void> {
    try {
      await this.client.player.playNext();
    } catch (e) {
      await vscode.window.showErrorMessage((e as Error).message);
    }
  }
}
