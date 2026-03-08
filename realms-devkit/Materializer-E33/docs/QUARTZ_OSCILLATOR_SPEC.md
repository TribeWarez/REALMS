# Materializer-E33 — Quartz oscillator specification

Two roles: (1) MCU system clock (on-module); (2) optional external stimulus clock for precise flicker timing.

---

## 1. MCU system clock (on-module)

- **Part:** Integral to **ESP32-WROOM-32** / **ESP32-WROOM-32E** module.
- **Frequency:** 40.000 MHz fundamental crystal.
- **Stability:** Typical ±10 ppm.
- **Load capacitance:** Per Espressif module datasheet (e.g. 9–12 pF).
- **Sourcing:** No separate part to source; do not add a second 40 MHz crystal on the board.

---

## 2. External stimulus clock (optional)

Used to derive exact flicker rates (e.g. 10 Hz, 40 Hz) independent of CPU load.

### Option A — 1.000 MHz

| Item | Spec |
|------|------|
| **Frequency** | 1.000 000 MHz (±20 ppm or better preferred) |
| **Logic** | CMOS, 3.3 V |
| **Package** | Through-hole 4-pin (e.g. HC-49) or SMD (e.g. 3225, 4-pin) |
| **Example parts** | ECS-1000 (1 MHz, through-hole); Abracon ASE-1.000MHZ (if available); generic “1.000 MHz 3.3 V CMOS oscillator ±20 ppm” |
| **Use** | Divide in software/hardware: 1_000_000 / 100_000 = 10 Hz; 1_000_000 / 25_000 = 40 Hz |

### Option B — 10.000 MHz

| Item | Spec |
|------|------|
| **Frequency** | 10.000 000 MHz; ±20 ppm or ±10 ppm |
| **Logic** | CMOS/LVCMOS, 3.3 V |
| **Package** | SMD 3.2×2.5 mm (4-pin) or 5×3.2 mm |
| **Example parts** | Abracon **ASE-10.000MHZ** (3.3 V, ±20 ppm); Jauch **Q 10,0-JXS21-10-10/10-FU-WA-LF** (10 MHz, ±10 ppm); **SG-8002CA** 10 MHz 3.3 V |
| **Use** | 10_000_000 / 1_000_000 = 10 Hz; 10_000_000 / 250_000 = 40 Hz |

---

## 3. Spec table

| Role | Frequency | Voltage | Logic | Stability (max) | Package (example) | Example part / series |
|------|-----------|---------|--------|------------------|-------------------|------------------------|
| MCU (module) | 40.000 MHz | 3.3 V | — | ±10 ppm | On ESP32-WROOM-32 | (integral to module) |
| Stimulus (optional) | 1.000 MHz | 3.3 V | CMOS | ±20 ppm | THT 4-pin / SMD | ECS-1000 or equivalent |
| Stimulus (optional) | 10.000 MHz | 3.3 V | CMOS | ±20 ppm | SMD 3225 / 3.2×2.5 | ASE-10.000MHZ, Q 10,0-JXS21, SG-8002CA |

---

## 4. Wiring (external stimulus)

- **VCC** → 3.3 V (from same LDO as ESP32).
- **GND** → GND (common with ESP32).
- **OUT** → One GPIO configured as input (e.g. GPIO34 or GPIO35). No series resistor if output is 3.3 V and current-limited. Do not exceed 3.3 V on ESP32 pins.
- If the oscillator is 5 V logic, use a level shifter (5 V → 3.3 V) before the GPIO.
