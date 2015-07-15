#!/bin/sh
# Clean build
make clean
make
# Precompile header
../arduino/hardware/tools/avr/bin/avr-g++ -ffunction-sections -fno-exceptions -fdata-sections -Os -MMD -mmcu=atmega32u4 -DF_CPU=8000000L -DARDUINO=10605 -DARDUINO_AVR_QUIRKBOT -DARDUINO_ARCH_AVR -DUSB_VID=0x2886 -DUSB_PID=0xf005 -DUSB_MANUFACTURER="Seeedstudio" -DUSB_PRODUCT="Quirkbot" -D__PROG_TYPES_COMPAT__ -I../arduino/hardware/arduino/avr/cores/arduino -I../arduino/hardware/arduino/avr/variants/quirkbot -I../arduino/libraries/Quirkbot ../arduino/libraries/Quirkbot/Quirkbot.h -o build-quirkbot/libs/Quirkbot/Quirkbot.h.gch
