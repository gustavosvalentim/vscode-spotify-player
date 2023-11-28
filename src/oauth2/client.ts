import {
  AuthorizeEndpointParameters,
  GrantType,
  OAuth2Config,
  ResponseType,
  TokenEndpointAuthorizationType,
  TokenEndpointOptions,
  TokenEndpointParameters,
  TokenEndpointResponse,
} from "./types";

export class OAuth2Client {
  public constructor(private readonly config: OAuth2Config) {}

  public getAuthorizeEndpoint(
    options?: Partial<AuthorizeEndpointParameters>
  ): string {
    const searchParams = new URLSearchParams(
      this.getAuthorizeEndpointConfiguration(options)
    );
    return this.config.authorizeEndpoint + "?" + searchParams.toString();
  }

  private getAuthorizeEndpointConfiguration(
    options?: Partial<AuthorizeEndpointParameters>
  ): AuthorizeEndpointParameters {
    if (!this.config.redirectUri) {
      throw new Error("Redirect URI not configured");
    }

    const scopes = this.config.scopes || [];

    return {
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: ResponseType.Code,
      scope: scopes.join(" "),
      ...options,
    };
  }

  // TODO: This method also should accept some options like
  // {
  //    authorization: TokenAuthorization.Form | TokenAuthorization.Header | TokenAuthorization.Both,
  //    contentType: "application/x-www-form-urlencoded" | "application/json"
  // }
  private getTokenEndpointConfiguration(
    body: TokenEndpointParameters,
    options?: Partial<TokenEndpointOptions>
  ): RequestInit {
    const configuration: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };

    if (options) {
      if (options.authorization) {
        switch (options.authorization) {
          case TokenEndpointAuthorizationType.Header:
            configuration.headers = {
              Authorization: this.getBasicAuthorization(),
            };
            break;
          case TokenEndpointAuthorizationType.None:
          default:
            break;
        }
      }

      if (options.codeVerifier) {
        body.code_verifier = options.codeVerifier;
        body.client_id = this.config.clientId;
      }
    }

    configuration.body = new URLSearchParams(body);

    return configuration;
  }

  private getBasicAuthorization(): string {
    return (
      "Basic " +
      Buffer.from(
        this.config.clientId + ":" + this.config.clientSecret
      ).toString("base64")
    );
  }

  public async exchangeCode(
    code: string,
    options?: Partial<TokenEndpointOptions>
  ): Promise<TokenEndpointResponse> {
    const response = await fetch(
      this.config.tokenEndpoint,
      this.getTokenEndpointConfiguration(
        {
          grant_type: GrantType.AuthorizationCode,
          redirect_uri: this.config.redirectUri,
          code: code as string,
        },
        options
      )
    );
    return (await response.json()) as TokenEndpointResponse;
  }

  public async refreshToken(
    refreshToken: string
  ): Promise<TokenEndpointResponse> {
    const response = await fetch(
      this.config.tokenEndpoint,
      this.getTokenEndpointConfiguration({
        grant_type: GrantType.RefreshToken,
        refresh_token: refreshToken,
      })
    );
    return (await response.json()) as TokenEndpointResponse;
  }

  public async clientCredentials(): Promise<TokenEndpointResponse> {
    const scopes = this.config.scopes || [];

    const response = await fetch(
      this.config.tokenEndpoint,
      this.getTokenEndpointConfiguration({
        grant_type: GrantType.ClientCredentials,
        scope: scopes.join(" "),
      })
    );
    return (await response.json()) as TokenEndpointResponse;
  }
}
