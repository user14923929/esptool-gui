# esptool-gui

A modern, cross-platform GUI for [esptool](https://github.com/espressif/esptool) — built with Tauri 2 + React.

![Build](https://github.com/user14923929/esptool-gui/actions/workflows/build.yml/badge.svg)

## Features

- **Write Flash** — flash multiple `.bin` files at custom addresses
- **Read Flash** — dump flash to a file with custom address/size range
- **Erase Flash** — full chip erase with confirmation
- **Chip Info** — read chip ID, MAC, flash size, crystal frequency
- **Port Monitor** — *(v0.2 — coming soon)*
- Live streaming output with color-coded log levels
- Progress bar for flash/read operations
- CLI preview — copy the raw `esptool.py` command
- System theme (auto light/dark)
- Persistent chip/port/baud settings

## Requirements

- [esptool](https://docs.espressif.com/projects/esptool/en/latest/esp32/installation.html) in your `PATH`:
  ```bash
  pip install esptool
  ```
- Linux: udev rules for USB serial access:
  ```bash
  sudo usermod -aG dialout $USER
  # or use udev rules — see https://github.com/user14923929/microbit-udev
  ```

## Development

```bash
# Install deps
npm install

# Dev mode (hot-reload)
npm run tauri dev

# Build release
npm run tauri build
```

### Stack

- **Frontend**: React 18 + TypeScript + Vite + Zustand
- **Backend**: Rust + Tauri 2
- **Serial port enumeration**: `serialport` crate
- **esptool**: called as subprocess from PATH

## Project structure

```
esptool-gui/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/useEsptool.ts # Tauri invoke + event wiring
│   ├── store/              # Zustand global state
│   └── styles/             # Global CSS + design tokens
└── src-tauri/
    └── src/
        └── lib.rs          # Tauri commands (list_ports, flash, read_flash, …)
```

## License

MIT
