export enum GrantType {
  AuthorizationCode = "authorization_code",
  ClientCredentials = "client_credentials",
  RefreshToken = "refresh_token",
}

export enum ResponseType {
  Code = "code",
  Query = "query",
}

export type AuthorizeEndpointParameters = {
  response_type: ResponseType;
  client_id: string;
  redirect_uri: string;
  scope?: string;
  code_challenge_method?: "S256";
  code_challenge?: string;
};

export enum TokenEndpointAuthorizationType {
  Form,
  Header,
  Both,
  None,
}

export type TokenEndpointOptions = {
  authorization: TokenEndpointAuthorizationType;
  codeVerifier?: string;
};

export type TokenEndpointParameters = {
  grant_type: GrantType;
  code?: string;
  redirect_uri?: string;
  refresh_token?: string;
  scope?: string;
  code_verifier?: string;
  client_id?: string;
};

export type TokenEndpointResponse = {
  token_type: "bearer";
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  error?: string;
};

export type OAuth2Config = {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  clientId: string;
  clientSecret?: string;
  redirectUri?: string;
  scopes?: string[];
};
