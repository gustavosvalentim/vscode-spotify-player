import { generateCodeChallenge, generateCodeVerifier } from "../utils/encoding";

export type AuthenticationConfig = {
  clientId: string;
  redirectUri: string;
  accountsUrl: string;
};

export type AuthorizeEndpointConfiguration = {
  url: string;
  codeVerifier: string;
};

export type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  error?: string;
};

export class AuthService {
  public constructor(public readonly config: AuthenticationConfig) {}

  public async getAuthorizeEndpointConfiguration(): Promise<AuthorizeEndpointConfiguration> {
    const codeVerifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(codeVerifier);
    const urlParams = new URLSearchParams({
      code_challenge_method: "S256",
      code_challenge: challenge,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: "user-modify-playback-state user-read-playback-state",
    });
    return {
      codeVerifier,
      url: this.config.accountsUrl + "/authorize?" + urlParams.toString(),
    };
  }

  public async getToken(
    code: string,
    codeVerifier: string
  ): Promise<TokenResponse> {
    const response = await fetch(this.config.accountsUrl + "/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        redirect_uri: this.config.redirectUri,
        grant_type: "authorization_code",
        code_verifier: codeVerifier || "",
        code: code || "",
      }),
    });
    return (await response.json()) as TokenResponse;
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(this.config.accountsUrl + "/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        grant_type: "refresh_token",
      }),
    });
    return (await response.json()) as TokenResponse;
  }
}
