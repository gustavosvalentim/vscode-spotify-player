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

export type SpotifyAuthenticationState = {
  accessToken: string;
  expiresAt: number;
  refreshToken?: string;
  error?: Error;
};

export type TokenEndpointResponse = {
  token_type: "bearer";
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
};

export type HandlerFunc = (params: RequestInit) => Promise<RequestInit>;

export class HttpClient {
  private readonly handlers: HandlerFunc[] = [];

  public constructor(public baseUrl: string = "") {}

  public addHandler(handler: HandlerFunc): void {
    this.handlers.push(handler);
  }

  public async request(path: string, init?: RequestInit): Promise<Response> {
    let params: RequestInit = init || { method: "GET" };

    for (const handler of this.handlers) {
      params = await handler(params);
    }

    return fetch(this.baseUrl + path, params);
  }
}

export class SpotifyClient {
  private readonly httpClient: HttpClient;
  private readonly apiUrl: string = "https://api.spotify.com";

  private authenticationState: SpotifyAuthenticationState | undefined;
  private onUpdateAuthenticationStateHandlers: ((
    newState: SpotifyAuthenticationState
  ) => Promise<void> | void)[] = [];

  public readonly player: SpotifyPlayerClient;

  public constructor(
    public readonly authorizeEndpoint: string,
    public readonly tokenEndpoint: string,
    getInitialState?: () => Promise<SpotifyAuthenticationState | undefined>
  ) {
    if (getInitialState) {
      getInitialState()
        .then((state) => {
          if (state) {
            this.updateAuthenticationState(state);
          }
        })
        .catch((e) => {
          throw e;
        });
    }
    this.httpClient = new HttpClient(this.apiUrl);
    this.httpClient.addHandler(
      async (params: RequestInit): Promise<RequestInit> => {
        if (
          !this.authenticationState ||
          this.authenticationState.expiresAt > Date.now()
        ) {
          await this.authenticate();
        }

        return {
          ...params,
          headers: {
            Authorization: `Bearer ${this.authenticationState?.accessToken}`,
          },
        };
      }
    );

    this.player = new SpotifyPlayerClient(this.httpClient);
  }

  public async authenticate(code?: string): Promise<void> {
    let authResponse: TokenEndpointResponse;
    if (!this.authenticationState || code) {
      // authorization code flow
      if (!code) {
        throw new Error("missing parameter code");
      }
      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });
      authResponse = (await response.json()) as TokenEndpointResponse;
    } else {
      // refresh token
      const response = await fetch(this.tokenEndpoint, {
        method: "POST",
        body: JSON.stringify({
          refreshToken: this.authenticationState.refreshToken!,
        }),
      });
      authResponse = (await response.json()) as TokenEndpointResponse;
    }

    if (authResponse.error) {
      throw new Error(authResponse.error);
    }

    this.updateAuthenticationState({
      accessToken: authResponse.access_token,
      refreshToken: authResponse.refresh_token,
      expiresAt: Date.now() + authResponse.expires_in,
    });
  }

  protected updateAuthenticationState(newState: SpotifyAuthenticationState) {
    this.authenticationState = newState;
    Promise.all(this.onUpdateAuthenticationStateHandlers)
      .then(() => console.log("Authentication state updated"))
      .catch((e) => console.error(e));
  }

  public onUpdateAuthenticationState(
    handler: (newState: SpotifyAuthenticationState) => Promise<void> | void
  ) {
    this.onUpdateAuthenticationStateHandlers.push(handler);
  }
}

export class SpotifyPlayerClient {
  public constructor(private readonly client: HttpClient) {}

  public async getPlaybackState(): Promise<PlaybackState> {
    let response: Response;

    try {
      response = await this.client.request("/v1/me/player");
    } catch (e) {
      console.error(e);
      throw e;
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
      await this.client.request("/v1/me/player/next", {
        method: "POST",
      });
    } catch (e) {
      console.error(e);
      throw e;
    }
  }
}
