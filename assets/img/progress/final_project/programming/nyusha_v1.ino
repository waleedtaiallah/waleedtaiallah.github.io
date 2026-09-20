
//#include <Arduino.h>
#include <U8g2lib.h>

U8G2_MAX7219_32X8_1_4W_HW_SPI u8g2(U8G2_R0, /* cs=*/ 6, /* dc=*/ U8X8_PIN_NONE, /* reset=*/ U8X8_PIN_NONE);
uint32_t last_refresh_time = 0;
uint32_t last_sample_time = 0;

uint16_t samples[32] = {0};

int8_t samples_index = 31;


#define REFRESH_PER 32000
#define SAMPLE_PER  1000

void setup() {
  //Serial.begin(115200);
  u8g2.begin();
  last_sample_time = micros();
  last_refresh_time = micros();
}

void loop() {
  if ((micros() - last_sample_time) >= SAMPLE_PER && samples_index >= 0) {
    last_sample_time = micros();
    int16_t sample = analogRead(A4);
    uint16_t sample_off = (sample - 512 < 0) ? 0 : sample - 512;
    samples[samples_index] = (sample_off) / 16;
    //Serial.printf("%d, %d/n", sample, samples[samples_index]);
    //Serial.printf("%d\n", sample);
    samples_index = (samples_index - 1);
  }


  if ( (micros() - last_refresh_time) >=  REFRESH_PER && samples_index == -1) {
    u8g2.clearBuffer();        // clear the internal memory
    for (int i = 0; i < 32; i++) {
      u8g2.drawVLine(i, 8 - samples[i], samples[i]);    // write something to the internal memory
    }
    u8g2.sendBuffer();
    samples_index = 31;
    last_refresh_time = micros();
  }
}
