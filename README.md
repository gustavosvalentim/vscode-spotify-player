# VSCode Spotify Player

Control your Spotify using VSCode.

## Features

- Get the currently playing song
- Play the next song

### TBD

- Search for songs
- Play a playlist

## Requirements

- [pnpm]()
- [NodeJS]()

## Setup and configuration

Before running the extension, you will need to create an app on Spotify. If you need help with creating an app on Spotify, you can follow this [guide](https://developer.spotify.com/documentation/web-api/concepts/apps).

### Configuration

To run the extension on VSCode, change the following settings on `.vscode/tasks.json`

```json
{
  "SPOTIFY_CLIENT_ID": "YOUR-CLIENT-ID"
}
```

### Dependencies

```sh
pnpm install
```

### Build

Before building you need to set the environment variables on the system you are building.

```sh
pnpm build
```

## Release Notes

### 0.0.1

Initial release

---
