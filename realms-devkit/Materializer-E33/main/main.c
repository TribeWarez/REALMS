/**
 * Materializer-E33 — REALMS Part III materialization thesis
 * LED flicker at configurable frequency (Alpha 10 Hz, Gamma 40 Hz, fusion 60–120 Hz).
 * Uses the flicker component for GPIO + esp_timer driven flicker.
 */

#include <stdio.h>
#include "flicker.h"

void app_main(void)
{
    const int gpio = CONFIG_MATERIALIZER_LED_GPIO;
    const int hz   = CONFIG_MATERIALIZER_FLICKER_HZ;

    printf("Materializer-E33: flicker %d Hz on GPIO %d\n", hz, gpio);
    if (!flicker_start(gpio, (uint32_t)hz)) {
        printf("Materializer-E33: flicker_start failed\n");
        return;
    }
}
