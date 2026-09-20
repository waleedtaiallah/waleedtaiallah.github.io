#include <SPI.h>
#include <mcp2515.h>

struct can_frame canMsg;

#define pin 4

void setup() {
  pinMode(pin, OUTPUT); 
  digitalWrite(pin, HIGH);
  MCP2515 mcp2515(23);
  delay(5000);
  digitalWrite(pin, LOW);
  mcp2515.reset();
  mcp2515.setBitrate(CAN_125KBPS);
  mcp2515.setNormalMode();
  while(true){
    if (mcp2515.readMessage(&canMsg) == MCP2515::ERROR_OK) {
      digitalWrite(pin, HIGH);
      delay(1000);
      
      digitalWrite(pin, LOW);
    }
  }

}

void loop() {
//  
}
