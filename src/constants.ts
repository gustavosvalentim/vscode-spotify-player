export const config = {
  accountsUrl: "https://accounts.spotify.com",
  redirectUri: "vscode://gustavosvalentim.vscode-spotify-player",
  clientId: process.env.SPOTIFY_CLIENT_ID || "",
};

export const extensionName = "vscode-spotify-player";
