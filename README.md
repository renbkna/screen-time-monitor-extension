# Screen Time Monitor Extension

<p align="center">
  <img src="src/assets/icon128.png" alt="Screen Time Monitor Logo">
</p>

A Chrome extension for monitoring and managing screen time with features like time tracking, website blocking, and focus mode.

## Features

- **Time Tracking**: Monitor daily and weekly screen time across different websites
- **Website Blocking**: Set up custom rules to block distracting websites
- **Focus Mode**: Stay productive with customizable focus sessions
- **Usage Analytics**: Get insights into your browsing habits
- **Privacy First**: All data is stored locally on your device

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store page](https://chrome.google.com/webstore/detail/[extension-id])
2. Click "Add to Chrome"
3. Follow the installation prompts

### Manual Installation (Development)

1. Clone the repository:
   ```bash
   git clone https://github.com/renbkna/screen-time-monitor-extension.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run build
   ```

4. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder from the project

## Development

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0

### Commands

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm run test`: Run tests
- `npm run lint`: Check code style
- `npm run format`: Format code
- `npm run analyze`: Analyze bundle size

### Project Structure

```
├── src/
│   ├── assets/          # Static assets
│   ├── background/      # Background scripts
│   ├── components/      # UI components
│   ├── content/         # Content scripts
│   ├── popup/          # Popup interface
│   ├── styles/         # Global styles
│   ├── utils/          # Utility functions
│   └── manifest.json   # Extension manifest
├── tests/              # Test files
├── dist/               # Built files
└── scripts/            # Build scripts
```

### Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

### Code Style

This project uses:
- ESLint for code linting
- Prettier for code formatting
- Jest for testing

## Privacy

This extension:
- Stores all data locally on your device
- Does not collect any personal information
- Does not send any data to external servers
- Requires minimal permissions

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Chart.js](https://www.chartjs.org/) for data visualization
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- All contributors and users of this extension

## Support

If you encounter any issues or have suggestions:
1. Check the [FAQ](docs/FAQ.md)
2. Search [existing issues](https://github.com/renbkna/screen-time-monitor-extension/issues)
3. Create a new issue

## Roadmap

See our [project board](https://github.com/renbkna/screen-time-monitor-extension/projects/1) for upcoming features and improvements.