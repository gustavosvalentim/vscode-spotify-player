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

export type Track = {
  album: { type: "album" | "single" | "compilation"; name: string };
  artists: { name: string }[];
  name: string;
  uri: string;
};

export type Tracks = {
  next?: string;
  previous?: string;
  total: number;
  items: Track[];
};

export enum ItemType {
  album,
  artist,
  playlist,
  track,
  show,
  episode,
  audiobook,
}

export type SearchResult = {
  tracks: Tracks;
};

export class HttpClient {
  public baseUrl?: string;
  public config: RequestInit;

  public onError?: (response: Response, client: HttpClient) => Promise<void>;

  public constructor(baseUrl?: string, config?: RequestInit) {
    this.baseUrl = baseUrl ?? "";
    this.config = { ...config };
  }

  public async request(url: string, config?: RequestInit): Promise<Response> {
    const response = await fetch(this.baseUrl + url, {
      ...this.config,
      ...config,
    });

    if (!response.ok && this.onError) {
      await this.onError(response, this);
    }

    return response;
  }
}

export class SpotifyClient {
  private readonly _httpClient: HttpClient;

  public readonly player: SpotifyPlayer;
  public readonly library: SpotifyLibrary;

  public constructor(httpClient: HttpClient) {
    this._httpClient = httpClient;
    this.player = new SpotifyPlayer(this._httpClient);
    this.library = new SpotifyLibrary(this._httpClient);
  }
}

export class SpotifyPlayer {
  public constructor(private readonly httpClient: HttpClient) {}

  public async getPlaybackState(): Promise<PlaybackState> {
    let response: Response;

    try {
      response = await this.httpClient.request("/v1/me/player");
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

  public async play(uri: string): Promise<void> {
    try {
      await this.httpClient.request("/v1/me/player/play", {
        method: "PUT",
        body: JSON.stringify({
          uris: [uri],
        }),
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  public async playNext(): Promise<void> {
    try {
      await this.httpClient.request("/v1/me/player/next", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}

export class SpotifyLibrary {
  public constructor(private readonly httpClient: HttpClient) {}

  /**
   * TODO: Add pagination
   */
  public async search(
    query: string,
    type?: ItemType,
    signal?: AbortSignal
  ): Promise<SearchResult> {
    const queryParams = new URLSearchParams({
      q: query,
      type: type ? ItemType[type] : ItemType[ItemType.track],
    });

    try {
      const response = await this.httpClient.request(
        "/v1/search?" + queryParams.toString(),
        {
          method: "GET",
          signal,
        }
      );
      const responseBody = await response.json();
      return responseBody as SearchResult;
    } catch (e) {
      console.error(`Error searching for query \`${query}\``, e);
    }

    return {
      tracks: {
        total: 0,
        items: [],
      },
    };
  }
}
