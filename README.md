# Screen Time Manager Plus

A modern, feature-rich browser extension for managing and monitoring your screen time.

## Features

- **Time Limit Management**: Set daily time limits for specific websites
- **Real-time Tracking**: Monitor your time spent on different websites
- **Customizable Categories**: Organize websites into custom categories
- **Break Reminders**: Get notifications to take breaks during long sessions
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Detailed Analytics**: Track your daily, weekly, and monthly usage patterns

## Installation

### From Chrome Web Store

1. Visit the Chrome Web Store page (link coming soon)
2. Click "Add to Chrome"
3. Click "Add extension" in the popup

### For Development

1. Clone this repository:

```bash
git clone https://github.com/yourusername/screen-time-monitor-extension.git
```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

### Setting Time Limits

1. Click the extension icon in your browser
2. Go to Settings (gear icon)
3. Navigate to the "Time Limits" tab
4. Click "Add Website Limit"
5. Enter the domain (e.g., "youtube.com")
6. Set your desired daily time limit in minutes
7. Click Save

### Viewing Statistics

1. Click the extension icon
2. View your daily usage statistics
3. Click "View Details" for more comprehensive analytics

### Managing Categories

1. Go to Settings
2. Navigate to the "Categories" tab
3. Create custom categories with unique colors
4. Assign websites to categories for better organization

### Break Reminders

1. Go to Settings
2. Navigate to the "Notifications" tab
3. Enable break reminders
4. Set your preferred reminder interval

## Features in Detail

### Time Tracking

- Automatic tracking of active tab time
- Idle detection
- Background tab handling
- Multiple window support

### Time Limits

- Per-domain time limits
- Customizable blocking page
- Grace period notifications
- Midnight reset of limits

### Categories

- Preset categories (Work, Social, Entertainment, etc.)
- Custom category creation
- Color coding
- Automatic categorization based on keywords

### Settings

- 12/24 hour time format
- Week start day preference
- Daily productivity goals
- Break reminder intervals
- Notification preferences

## Technical Details

### Built With

- Manifest V3
- Modern JavaScript (ES6+)
- TailwindCSS for styling
- Chrome Storage API for data persistence

### Permissions Used

- `storage`: For saving settings and usage data
- `tabs`: For tracking active tabs
- `activeTab`: For accessing current tab information
- `alarms`: For scheduling notifications and updates
- `notifications`: For break reminders and alerts
- `webNavigation`: For accurate page load tracking

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Privacy

This extension:

- Does not collect any personal information
- Stores all data locally in your browser
- Does not make any external network requests
- Does not track browsing history beyond time measurements

## Troubleshooting

### Common Issues

1. **Time limits not working**

   - Ensure the domain is entered correctly (e.g., "youtube.com" not "www.youtube.com")
   - Check if the time limit is properly set and saved
   - Try reloading the extension

2. **Settings not saving**

   - Make sure to click the "Save" button after making changes
   - Check if your Chrome storage is not full
   - Try reloading the extension

3. **Notifications not showing**
   - Ensure notifications are enabled in Chrome settings
   - Check if notifications are enabled in the extension settings
   - Verify system notifications are enabled

### Reset Extension

If you encounter persistent issues:

1. Go to extension settings
2. Click "Reset extension"
3. Re-enter your preferences

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Acknowledgments

- Icons from Heroicons
- UI components from Tailwind CSS
- Chart library: Recharts

## Contact

For support or inquiries, please open an issue in the GitHub repository.

---

Made with ❤️ by [Berkan]
