
#include <U8g2lib.h>

U8G2_MAX7219_32X8_1_4W_HW_SPI u8g2(U8G2_R0, /* cs=*/ 6, /* dc=*/ U8X8_PIN_NONE, /* reset=*/ U8X8_PIN_NONE);

void setup(void) {
  u8g2.begin();
}

void loop(void) {
  u8g2.clearBuffer();					// clear the internal memory
  u8g2.setFont(u8g2_font_ncenB08_tr);	// choose a suitable font
  u8g2.drawStr(0,8,"Hello World!");	// write something to the internal memory
  u8g2.sendBuffer();					// transfer internal memory to the display
  delay(1000);  
}
