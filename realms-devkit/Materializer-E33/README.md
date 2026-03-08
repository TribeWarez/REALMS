# Materializer-E33

ESP32-based device for **REALMS Part III materialization thesis**: structured light emission (high-frequency / precisely timed LED flicker) for perceptual materialization and Part II API-manipulation (Alpha/Gamma band, flicker fusion).

## Prerequisites

- [ESP-IDF](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/get-started/) installed and `IDF_PATH` set.
- Target: ESP32 (e.g. ESP32-WROOM-32, ESP32-DevKitC).

## Build and flash

```bash
cd realms-devkit/Materializer-E33
idf.py set-target esp32
idf.py build
idf.py -p PORT flash monitor
```

Replace `PORT` with your serial port (e.g. `/dev/ttyUSB0`, `COM3`).

## Configuration

- Default flicker: 40 Hz (Gamma band). Override at compile time with `FLICKER_HZ` and `LED_GPIO`, or use `idf.py menuconfig` if [main/Kconfig.projbuild](main/Kconfig.projbuild) is present.
- Pinout and hardware: see [docs/BUILD_SCHEMATIC.md](docs/BUILD_SCHEMATIC.md).
- Quartz oscillator details: see [docs/QUARTZ_OSCILLATOR_SPEC.md](docs/QUARTZ_OSCILLATOR_SPEC.md).

## Manuscript reference

- **Part II** — API manipulation, wavelength/perception, brain wave states (Delta, Theta, Alpha, Beta, Gamma).
- **Part III** — Materialization thesis: photon emission (way/frequency/pattern) interpreted by the API as matter; temporal pattern and flicker.
