import * as vscode from "vscode";
import { ItemType, SpotifyClient } from "../spotify-client";
import { debounce } from "../utils/debounce";

export class PlayerController {
  public constructor(private readonly client: SpotifyClient) {}

  public async getCurrentlyPlaying(): Promise<void> {
    try {
      const playbackState = await this.client.player.getPlaybackState();

      if (!playbackState.isPlaying) {
        await vscode.window.showInformationMessage("Spotify is not playing");
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

  // TODO: Search history
  public async searchAndPlaySong(): Promise<void> {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = "Spotify search";
    quickPick.placeholder = "What do you want to play?";
    quickPick.ignoreFocusOut = false;
    quickPick.matchOnDescription = false;
    quickPick.matchOnDetail = false;
    quickPick.canSelectMany = false;

    /**
     * cancelRequest will hold an AbortController so we can abort
     * some requests and avoid race conditions.
     *
     * If we don't use a request cancellation strategy, requests made before
     * the last search can finish being processed after it.
     */
    let cancelRequest: AbortController | undefined;

    const debounceSearch = debounce(async (value) => {
      try {
        if (cancelRequest !== undefined) {
          cancelRequest.abort();
        }

        cancelRequest = new AbortController();

        console.log(`Searching for ${value}`);

        const result = await this.client.library.search(
          value,
          ItemType.track,
          cancelRequest.signal
        );

        if (result.tracks.items && result.tracks.total > 0) {
          console.log(`Found ${result.tracks.total} results for \`${value}\``);
        }

        quickPick.items = result.tracks.items.map((track) => ({
          label: track.name,
          description: track.artists.map((a) => a.name).join(", "),
          alwaysShow: true,
        }));
      } catch (err: any) {
        console.error(`Error fetching \`${value}\``, err);
      } finally {
        quickPick.busy = false;
      }
    }, 300);

    quickPick.onDidChangeValue(async (value) => {
      quickPick.busy = true;

      // search only if more than 3 characters were typed
      if (value.length < 3 || !value.trim()) {
        quickPick.busy = false;
        quickPick.items = [];
        return;
      }

      await debounceSearch(value);
    });

    quickPick.onDidAccept(async () => {
      const selected = quickPick.selectedItems[0];
      if (selected) {
        const { detail } = selected;
        await this.client.player.play(detail as string);
      }
      quickPick.hide();
    });

    quickPick.onDidHide(() => quickPick.dispose());

    quickPick.show();
  }
}
