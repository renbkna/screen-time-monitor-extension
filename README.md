# Screen Time Monitor Extension

A Chrome extension for monitoring and managing screen time with features like time tracking, website blocking, and focus mode.

## Features

- Time tracking for websites
- Detailed insights and statistics
- Screen time limits
- Website blocking
- Focus mode
- Privacy-focused (all data stored locally)

## Installation

### From Source

1. Clone the repository:
```bash
git clone https://github.com/renbkna/screen-time-monitor-extension.git
cd screen-time-monitor-extension
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Build the extension:
```bash
npm run build
```

4. Load in Chrome:
- Open Chrome and go to `chrome://extensions/`
- Enable "Developer mode"
- Click "Load unpacked"
- Select the `dist` directory

## Development

1. Start development mode:
```bash
npm run dev
```

2. Make your changes
3. The extension will automatically rebuild when you make changes

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT
