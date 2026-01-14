#  <img src="player_logo_256.png" width="32" height="32" alt="WebPlayer icon">  Custom Video Player Controls

A Chrome extension that adds custom controls, keyboard shortcuts, and enhanced features to HTML5 video players on any website.

## Features

- **Custom Control Bar** – Modern, sleek controls that overlay on videos
- **Keyboard Shortcuts** – Full keyboard control for hands-free operation
- **Configurable Skip Intervals** – Customize normal and Ctrl+skip durations
- **Progress Bar** – Visual timeline with buffering indicator and seek support
- **Volume Control** – Slider and mute toggle with visual feedback
- **Fullscreen Toggle** – Enter/exit fullscreen with a click or keyboard
- **Auto-Hide Controls** – Controls fade out during playback, appear on hover
- **Per-Site Configuration** – Enable the extension only on sites you choose
- **Customizable Appearance** – Change the progress bar color to your preference

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Skip backward |
| `→` | Skip forward |
| `Ctrl` + `←` / `→` | Long skip (configurable) |
| `↑` | Volume up |
| `↓` | Volume down |
| `M` | Mute / Unmute |
| `F` | Toggle fullscreen |

## Installation (Developer Mode)

Since this extension is not published on the Chrome Web Store, you'll need to install it manually in developer mode.

### Steps

1. **Download or clone the repository**
   ```
   git clone <repository-url>
   ```
   Or download and extract the ZIP file to a folder on your computer.

2. **Open Chrome Extensions page**
   - Open Google Chrome
   - Navigate to `chrome://extensions/` in the address bar
   - Or go to **Menu (⋮)** → **Extensions** → **Manage Extensions**

3. **Enable Developer Mode**
   - Toggle the **Developer mode** switch in the top-right corner of the page

4. **Load the extension**
   - Click the **Load unpacked** button
   - Browse to and select the folder containing the extension files (`manifest.json`, `content.js`, etc.)
   - Click **Select Folder**

5. **Verify installation**
   - The extension should now appear in your extensions list
   - You should see the "Custom Video Player Controls" icon in your Chrome toolbar

### Updating the Extension

After making changes to the extension files:
1. Go to `chrome://extensions/`
2. Find "Custom Video Player Controls"
3. Click the **Refresh** icon (↻) on the extension card

## Usage

1. **Click the extension icon** in the Chrome toolbar to open the popup
2. **Add websites** where you want the custom controls to be enabled
   - Enter the domain (e.g., `example.com`) and click **Add**
3. **Configure settings**:
   - **Normal skip**: Seconds to skip with arrow keys (default: 10s)
   - **Ctrl + skip**: Seconds to skip with Ctrl+arrow keys (default: 30s)
   - **Progress bar color**: Choose your preferred accent color
4. **Navigate to an enabled site** with a video – the custom controls will automatically appear

## Context Menu

Right-click on any video to access additional options:
- **Toggle Custom/Native Controls** – Switch between the extension's custom controls and the browser's native video controls

## Files

| File | Description |
|------|-------------|
| `manifest.json` | Extension configuration and permissions |
| `content.js` | Main script injected into web pages |
| `background.js` | Service worker for context menu and messaging |
| `popup.html` | Extension popup UI |
| `popup.js` | Popup functionality and settings management |
| `styles.css` | Styles for the custom video controls |

## Permissions

- **storage** – Save your settings and site list
- **activeTab** – Interact with the current tab
- **scripting** – Inject the custom controls into pages
- **tabs** – Access tab information
- **contextMenus** – Add right-click menu options on videos

## License

MIT License – feel free to use and modify as needed.
