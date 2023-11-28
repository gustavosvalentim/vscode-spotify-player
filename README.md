# vscode-spotify-player

## Setup

### Backend

#### Environment variables

AWS SAM uses a JSON file to load environment variables locally. There is a sample of the JSON file in `apps/backend/env.sample.json`.

Below there is a list of environment variables used and how to obtain them.

- `CLIENT_ID`: Spotify application client id
- `CLIENT_SECRET`: Spotify application client secret
- `REDIRECT_URI`: Spotify application redirect URI
- `SCOPE`: Spotify scopes used by the application. Scopes MUST be separated by space.
- `AUTHORIZE_URL`: URL for the spotify authorize endpoint
- `TOKEN_URL`: URL for the spotify token API

#### Building and running locally

```sh
cd apps/backend
sam build && sam local start-api --env-vars {env-file}
```

### Running the extension

On VSCode you can run with the default debugger by pressing `F5`.
