export type SpotifyClientConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

export type PlaybackStateResponse = {
  item: { artists: { name: string }[]; name: string; duration_ms: number };
  progress_ms: number;
  device: { id: string; name: string };
  is_playing: boolean;
};

export type PlaybackState = {
  song?: { name: string; artist: string; duration: number };
  device?: { id: string; name: string };
  progress?: number;
  isPlaying: boolean;
};

export type RequestFunc = (
  url: string,
  config?: RequestInit
) => Promise<Response>;

export class SpotifyClient {
  public readonly player: SpotifyPlayer;

  public constructor(
    private readonly getToken: () => Promise<string | undefined>
  ) {
    this.player = new SpotifyPlayer(this.request.bind(this));
  }

  private async request(path: string, config?: RequestInit): Promise<Response> {
    const token = await this.getToken();
    console.log("token", token);
    return fetch("https://api.spotify.com" + path, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export class SpotifyPlayer {
  public constructor(private readonly request: RequestFunc) {}

  public async getPlaybackState(): Promise<PlaybackState> {
    let response: Response;

    try {
      response = await this.request("/v1/me/player");
    } catch (e) {
      console.error(e);
      throw e;
    }

    if (200 !== response.status) {
      console.error("status is not 200", response.status);
      throw new Error("could not get player data");
    }

    const { item, device, progress_ms, is_playing } =
      (await response.json()) as PlaybackStateResponse;

    return {
      song: {
        name: item.name,
        artist: item.artists[0]?.name,
        duration: item.duration_ms,
      },
      device,
      progress: progress_ms,
      isPlaying: is_playing,
    };
  }

  public async playNext(): Promise<void> {
    try {
      await this.request("/v1/me/player/next", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
