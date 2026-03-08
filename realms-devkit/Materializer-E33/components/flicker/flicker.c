/**
 * Materializer-E33 flicker component — LED flicker driver
 * Uses esp_timer + GPIO; no external oscillator in this implementation.
 */

#include "flicker.h"
#include "driver/gpio.h"
#include "esp_timer.h"
#include "esp_log.h"

static const char *TAG = "flicker";

static int s_gpio = -1;
static bool s_led_state;
static esp_timer_handle_t s_timer;
static bool s_running;

static void flicker_cb(void *arg)
{
    (void)arg;
    if (s_gpio < 0) return;
    s_led_state = !s_led_state;
    gpio_set_level(s_gpio, s_led_state ? 1 : 0);
}

bool flicker_start(int gpio_num, uint32_t freq_hz)
{
    if (gpio_num < 0 || gpio_num > 33 || freq_hz == 0 || freq_hz > 1000) {
        ESP_LOGE(TAG, "invalid args: gpio=%d freq_hz=%lu", gpio_num, (unsigned long)freq_hz);
        return false;
    }

    flicker_stop();

    gpio_config_t io = {
        .pin_bit_mask = (1ULL << gpio_num),
        .mode = GPIO_MODE_OUTPUT,
        .pull_up_en = GPIO_PULLUP_DISABLE,
        .pull_down_en = GPIO_PULLDOWN_DISABLE,
        .intr_type = GPIO_INTR_DISABLE,
    };
    if (gpio_config(&io) != ESP_OK) {
        ESP_LOGE(TAG, "gpio_config failed");
        return false;
    }
    gpio_set_level(gpio_num, 0);
    s_gpio = gpio_num;
    s_led_state = false;

    uint32_t half_period_us = 1000000 / (2 * freq_hz);
    esp_timer_create_args_t args = {
        .callback = &flicker_cb,
        .arg = NULL,
        .dispatch_method = ESP_TIMER_TASK,
        .name = "flicker",
    };
    if (esp_timer_create(&args, &s_timer) != ESP_OK) {
        ESP_LOGE(TAG, "esp_timer_create failed");
        s_gpio = -1;
        return false;
    }
    if (esp_timer_start_periodic(s_timer, half_period_us) != ESP_OK) {
        esp_timer_delete(s_timer);
        s_timer = NULL;
        s_gpio = -1;
        return false;
    }

    s_running = true;
    ESP_LOGI(TAG, "started %lu Hz on GPIO %d", (unsigned long)freq_hz, gpio_num);
    return true;
}

void flicker_stop(void)
{
    if (!s_running) return;
    if (s_timer) {
        esp_timer_stop(s_timer);
        esp_timer_delete(s_timer);
        s_timer = NULL;
    }
    if (s_gpio >= 0) {
        gpio_set_level(s_gpio, 0);
        s_gpio = -1;
    }
    s_running = false;
    ESP_LOGI(TAG, "stopped");
}

bool flicker_is_running(void)
{
    return s_running;
}
