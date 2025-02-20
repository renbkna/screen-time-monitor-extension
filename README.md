# Screen Time Manager Plus

Screen Time Manager Plus is a modern, feature-rich browser extension designed to help you track, manage, and optimize your online time. With real-time tracking, customizable time limits, and detailed analytics, you can take control of your productivity and build healthier online habits.

## Features

- **Time Limit Management**  
  Set daily time limits for specific websites and receive alerts when you approach or exceed those limits.

- **Real-Time Tracking**  
  Monitor your active time on different websites using background tracking and idle detection.

- **Customizable Categories**  
  Organize websites into custom or preset categories (e.g., Work, Social, Entertainment) with color coding.

- **Break Reminders**  
  Get notified when you’ve been active for too long, encouraging you to take healthy breaks.

- **Detailed Analytics**  
  View daily, weekly, and monthly usage statistics with beautiful charts and summaries.

- **Dark Mode & Accessibility**  
  Enjoy automatic theme switching based on your system preferences and a responsive design built with TailwindCSS.

## Installation

### From Chrome Web Store

1. Visit the [Chrome Web Store page](#) for Screen Time Manager Plus.
2. Click **Add to Chrome**.
3. Confirm the installation in the popup.

### For Development

1. Clone the repository:

    ```bash
    git clone https://github.com/renbkna/screen-time-monitor-extension.git
    ```

2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right.
4. Click **Load unpacked** and select the extension directory.

## Usage

### Setting Time Limits

1. Click the extension icon in your browser toolbar.
2. Open **Settings** (gear icon) and navigate to the **Time Limits** tab.
3. Click **Add Website Limit**, enter the domain (e.g., `youtube.com`), and set your desired daily time limit.
4. Click **Save Settings**.

### Viewing Statistics

- Open the extension popup to see your current site’s usage and today’s summary.
- For more details, click **Dashboard** to view comprehensive analytics.

### Managing Categories

- In **Settings**, navigate to the **Categories** tab.
- Create or edit categories to organize your websites.

### Break Reminders & Notifications

- Enable notifications in the **Notifications** tab.
- Customize the reminder interval to receive timely prompts to take breaks.

## Technical Details

- **Manifest V3** for modern Chrome extensions
- **JavaScript (ES6+)** with a module-based structure
- **TailwindCSS** for rapid UI development
- **Chrome Storage API** for data persistence and privacy

## Contributing

1. Fork the repository.
2. Create your feature branch:  

    ```bash
    git checkout -b feature/YourFeature
    ```

3. Commit your changes:  

    ```bash
    git commit -m 'Add some amazing feature'
    ```

4. Push to the branch:  

    ```bash
    git push origin feature/YourFeature
    ```

5. Open a Pull Request with a clear description of your changes.

## License

Screen Time Manager Plus is released under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support & Contact

For issues, questions, or suggestions, please open an issue on the [GitHub repository](https://github.com/renbkna/screen-time-monitor-extension) or contact the maintainer.
