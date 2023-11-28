import { OAuth2Client } from "./oauth2/client";
import { generateCodeChallenge, generateCodeVerifier } from "./oauth2/encoding";
import { OAuth2Config } from "./oauth2/types";

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
  codeVerifier?: string;
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
  private readonly authClient: OAuth2Client;
  private readonly httpClient: HttpClient;
  private readonly apiUrl: string = "https://api.spotify.com";

  private authenticationState: SpotifyAuthenticationState | undefined;
  private onUpdateAuthenticationStateHandlers: ((
    newState: SpotifyAuthenticationState
  ) => Promise<void> | void)[] = [];

  public readonly player: SpotifyPlayerClient;

  public constructor(
    authConfig: OAuth2Config,
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
    this.authClient = new OAuth2Client(authConfig);
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

  public async getAuthorizeEndpoint(): Promise<string> {
    if (!this.authenticationState) {
      this.authenticationState = {
        accessToken: "",
        expiresAt: 0,
      };
    }

    const codeVerifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(codeVerifier);

    this.authenticationState.codeVerifier = codeVerifier;

    return this.authClient.getAuthorizeEndpoint({
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
  }

  public async authenticate(code?: string): Promise<void> {
    let authResponse: TokenEndpointResponse;
    if (code) {
      // authorization code flow
      if (!code) {
        throw new Error("missing parameter code");
      }
      authResponse = await this.authClient.exchangeCode(code, {
        codeVerifier: this.authenticationState!.codeVerifier,
      });
    } else {
      // refresh token
      if (!this.authenticationState) {
        return;
      }
      authResponse = await this.authClient.refreshToken(
        this.authenticationState.refreshToken!
      );
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
