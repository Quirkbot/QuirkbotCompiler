#!/bin/sh
set -e

>firmware.hex
>compileoutput
#>sizeoutput

#compile
../compiler/arduino/hardware/tools/avr/bin/avr-g++ \
-w \
-x c++ \
-c \
-ffunction-sections -fno-exceptions -fdata-sections \
-Os \
-MMD \
-mmcu=atmega32u4 \
-DF_CPU=8000000L -DARDUINO=163 -DARDUINO_ARCH_AVR -D__PROG_TYPES_COMPAT__ \
-I../compiler/firmware/build-quirkbot/libs/Quirkbot \
-DUSB_VID=0xF055 -DUSB_PID=0x0001 \
firmware.ino -o firmware.o \
>>compileoutput 2>&1

#link
../compiler/arduino/hardware/tools/avr/bin/avr-gcc \
-mmcu=atmega32u4 \
-Wl,--gc-sections \
-Os \
-o firmware.elf firmware.o \
../compiler/firmware/build-quirkbot/libcore.a  \
-lc -lm \
>>compileoutput 2>&1

#copy
../compiler/arduino/hardware/tools/avr/bin/avr-objcopy \
-O \
ihex \
-R .eeprom \
firmware.elf firmware.hex \
>>compileoutput 2>&1

#size
#../arduino/hardware/tools/avr/bin/avr-size \
#--mcu=atmega32u4 \
#-C \
#--format=avr \
#firmware.elf \
#>sizeoutput 2>&1


# If there are errors, go through clang
#if [[ -s compileoutput ]]
#then
#	../compiler/arduino/hardware/tools/avr/clang/bin/clang++ -w -x c++ -fsyntax-only  -ffunction-sections -fno-exceptions -fdata-sections -Os -MMD -DF_CPU=8000000L -#DARDUINO=163 -DARDUINO_ARCH_AVR -D__PROG_TYPES_COMPAT__ -I../compiler/arduino/hardware/tools/avr/avr/include -I../compiler/arduino/hardware/tools/avr/clang/#include -I../compiler/arduino/hardware/arduino/avr/cores/arduino -I../compiler/arduino/hardware/arduino/avr/variants/quirkbot -I../compiler/arduino/libraries/#Quirkbot  -Wno-unknown-attributes -Wno-attributes  firmware.ino  >>compileoutput 2>&1
#fi