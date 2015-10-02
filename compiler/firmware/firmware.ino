#include "Quirkbot.h"

Wave wave1;
Wave wave2;
Wave wave3;
Wave wave4;
Led led1;
Led led2;
Led led3;
Led led4;
ServoMotor servoMotor1;
ServoMotor servoMotor2;

void start(){

  wave1.length = 0.8;
  wave1.type = WAVE_SINE;
  wave1.min = 0.25;
  wave1.max = 0.75;

  wave2.length = 0.4;
  wave2.type = WAVE_SINE;
  wave2.min = 0.25;
  wave2.max = 0.75;

  wave3.length = 0.8;
  wave3.type = WAVE_SINE;

  wave4.length = 0.4;
  wave4.type = WAVE_SINE;

  led1.light.connect(wave3.out);
  led1.place = LE;

  led2.light.connect(wave4.out);
  led2.place = RE;

  led3.light.connect(wave3.out);
  led3.place = LM;

  led4.light.connect(wave4.out);
  led4.place = RM;

  servoMotor1.position.connect(wave1.out);
  servoMotor1.place = SERVO_BP1;

  servoMotor2.position.connect(wave2.out);
  servoMotor2.place = SERVO_BP2;

}
