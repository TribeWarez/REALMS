/**
 * Materializer-E33 flicker component — LED flicker driver
 * REALMS Part III materialization thesis: structured light (temporal pattern).
 */

#ifndef FLICKER_H
#define FLICKER_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Start periodic LED flicker on the given GPIO at the given frequency.
 * Configures the GPIO as output and starts an esp_timer that toggles it.
 * If flicker is already running, it is stopped and restarted with the new parameters.
 *
 * \param gpio_num  GPIO number for LED output (0–33 for output-capable pins).
 * \param freq_hz   Flicker frequency in Hz (e.g. 10 Alpha, 40 Gamma, 60–120 fusion).
 * \return true on success, false on invalid args or init failure.
 */
bool flicker_start(int gpio_num, uint32_t freq_hz);

/**
 * Stop flicker and release the timer. GPIO level is set low.
 */
void flicker_stop(void);

/**
 * Return whether flicker is currently running.
 */
bool flicker_is_running(void);

#ifdef __cplusplus
}
#endif

#endif /* FLICKER_H */
