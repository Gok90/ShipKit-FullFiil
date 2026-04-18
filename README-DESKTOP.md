# ShipKit Desktop Application

A local, production-ready fulfillment operations app. Everything runs on your machine - no cloud, no subscriptions.

## Quick Start

### Windows
```batch
run.bat
```

### macOS / Linux
```bash
bash run.sh
```

## Development Setup

### Prerequisites
- Python 3.9+ (download from python.org)
- Node.js 18+ (download from nodejs.org)
- Windows 10+ (for native windowed app)

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd ShipKit
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Install Node dependencies**
   ```bash
   npm install
   ```

4. **Run development mode**
   - **Windows:** Double-click `run.bat`
   - **macOS/Linux:** `bash run.sh`

The app will:
- Start FastAPI backend on `http://127.0.0.1:8000`
- Launch PyWebView native window
- Open React UI inside the window

## Build for Windows

### Create Executable

```bash
python build.py
```

Output: `dist/ShipKit/ShipKit.exe`

### Create Installer

Requires Inno Setup (free download: jrsoftware.org)

The build script will automatically create:
- `Output/ShipKit-Setup.exe` - Windows installer

## Features

### Local First
- All data stored locally in SQLite database
- Files organized by date/batch on your disk
- No cloud dependencies
- Works offline

### Organized File Storage
```
uploads/
  2026-04-16/
    batch-001/
      shipping-labels.pdf
      manifest.csv
      usps-slip.pdf
    batch-002/
      ...
```

### Audio Feedback
- **Zone detection:** Plays different tones for each zone (Manifest 1, 2, 3... and Clerk Counter)
- **Multiple modes:** Tones or voice announcements
- **Configurable:** Volume control and mute button

### Error Handling
- All errors show as toast notifications
- No silent failures
- Clear user-friendly messages
- Retry buttons for network issues

### Database Structure
- Settings (user configuration)
- Inventory (colors & pack types with real-time stock)
- Batches (scanning sessions)
- Manifest zones (dynamic per upload)
- Scans (package tracking)
- CSV orders (manifest data for lookups)
- Hold queue (on-hold packages)
- Upload history

## Folder Structure

```
ShipKit/
├── main.py                 # Entry point
├── backend/
│   ├── api.py              # FastAPI routes
│   ├── database.py         # SQLite setup
│   └── file_manager.py     # File organization
├── frontend/               # React build output
├── lib/
│   ├── api-client.ts       # Local API client
│   ├── audio-system.ts     # Zone cues
│   ├── toast.ts            # Error notifications
│   └── shipkit-context.tsx # State management
├── components/             # React components
├── data/
│   └── shipkit.db          # SQLite database (auto-created)
├── uploads/                # User files organized by date
├── requirements.txt        # Python dependencies
├── package.json            # Node dependencies
├── run.bat                 # Windows starter
├── run.sh                  # Unix starter
└── build.py                # Build script for EXE
```

## Configuration

User settings are stored in the app and saved to the local database:

- **Store Name** - Your business name
- **Zone Names** - Customize manifest zone labels
- **Carrier Close Times** - Set SLA times for your carrier
- **Travel Time** - Minutes from warehouse to carrier drop-off
- **Low Stock Threshold** - Alert when inventory drops below
- **Audio Mode** - Tones or voice announcements
- **Printer Format** - Label printer settings (thermal_4x6, inkjet_8.5x11, etc.)

## Troubleshooting

### App won't start
1. Make sure Python 3.9+ is installed
2. Run `pip install -r requirements.txt`
3. Run `npm install`
4. Check Windows Firewall - allow localhost connections

### Files not uploading
1. Check `data/shipkit.db` exists
2. Check `uploads/` folder has write permissions
3. Check console for error messages

### Audio not playing
1. Check volume settings in app
2. Verify speakers are connected
3. Try different audio mode (Tones vs Voice)

### Database issues
1. Close the app completely
2. Delete `data/shipkit.db` (it will recreate)
3. Restart the app

## Support

For issues, check:
1. Console output in the terminal window
2. Toast error messages in the app
3. Database logs in `data/`

## License

Internal use only. Built for solo sellers and small operations.
