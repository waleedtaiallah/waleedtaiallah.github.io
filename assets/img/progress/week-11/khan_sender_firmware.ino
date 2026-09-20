#include <SPI.h>
#include <mcp2515.h>
struct can_frame canMsg1;
struct can_frame canMsg2;

#define pin 4

void setup() {
  pinMode(pin, OUTPUT);
  digitalWrite(pin, HIGH);
  MCP2515 mcp2515(23);
  delay(5000);
  digitalWrite(pin, LOW);
  mcp2515.reset();
  mcp2515.setBitrate(CAN_125KBPS);
  mcp2515.setLoopbackMode();
  delay(1000);

//  
  canMsg1.can_id  = 0x0F6;
  canMsg1.can_dlc = 8;
  canMsg1.data[0] = 0x8E;
  canMsg1.data[1] = 0x87;
  canMsg1.data[2] = 0x32;
  canMsg1.data[3] = 0xFA;
  canMsg1.data[4] = 0x26;
  canMsg1.data[5] = 0x8E;
  canMsg1.data[6] = 0xBE;
  canMsg1.data[7] = 0x86;

  canMsg2.can_id  = 0x036;
  canMsg2.can_dlc = 8;
  canMsg2.data[0] = 0x0E;
  canMsg2.data[1] = 0x00;
  canMsg2.data[2] = 0x00;
  canMsg2.data[3] = 0x08;
  canMsg2.data[4] = 0x01;
  canMsg2.data[5] = 0x00;
  canMsg2.data[6] = 0x00;
  canMsg2.data[7] = 0xA0;

  mcp2515.reset();
  mcp2515.setBitrate(CAN_125KBPS);
  mcp2515.setNormalMode();
  while(true){
    digitalWrite(4, HIGH);
    mcp2515.sendMessage(&canMsg1);
    mcp2515.sendMessage(&canMsg2);   
    delay(1000);
    digitalWrite(4, LOW);
    delay(1000);
  }
}

void loop() {


//  digitalWrite(4, HIGH);
//  delay(1000);
//  digitalWrite(4, LOW);
//  delay(1000);
}
