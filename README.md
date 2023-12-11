# VSCode Spotify Player

VSCode Spotify Player is a Visual Studio Code extension that enables you to control your Spotify directly within the VSCode environment.

## Features

- **Get Currently Playing Song:** Retrieve information about the currently playing song.
- **Play the Next Song:** Skip to the next song in your Spotify queue.

## TBD

- **Search for Songs:** Search and play songs.
- **Play a Playlist:** Search and play a playlist.

## Requirements

Make sure you have the following prerequisites installed before using the extension:

- [pnpm](https://pnpm.io/) - Package manager for Node.js projects.
- [Node.js](https://nodejs.org/) - JavaScript runtime.

## Setup and Configuration

Before running the extension, you need to create a Spotify app. Follow the [official guide](https://developer.spotify.com/documentation/web-api/concepts/apps) to create your app on the Spotify Developer Dashboard.

### Configuration

1. Open `.vscode/tasks.json` in your VSCode workspace.
2. Update the following settings with your Spotify app details:

```json
{
  "SPOTIFY_CLIENT_ID": "YOUR-CLIENT-ID"
}
```

### Install dependencies

```sh
pnpm install
```

### Build

Before building, ensure you have set the required environment variables on your system. Build the extension using:

```sh
pnpm build
```

## Release Notes

### Version 0.0.1

- Initial release
