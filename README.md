# Quirkbot Compiler
A service that compiles queued Quirkbot programs.

The service is divided into 2 processes: a webserver and compiler worker.

## Webserver
Takes in compilation requests (as c++ source code), and queues them in a database.

After a program has been queued and is waiting for compilation, clients can check query the compilation status by providing the build id.

*The programs will only be stored in the server for 15 seconds! Clients should request the compilation and check it's status immediately after.*
## Compiler worker

Reads queued compilation requests out of a database and compiles them. It doesn't serve any content to external clients.


# Requirements
- Node.js
- NPM
- Mongo

# Supported platforms
The service is designed to run on Linux 64bits.

This is mainly because of the platform specific compilation toolchain. In case you want to run it in other platforms, simply replace the toolchain (```compiler/arduino/hardware/tools```) accordingly.

### Toolchains
- [Linux 64bits](https://github.com/Quirkbot/QuirkbotArduinoToolsLinux64) (default)
- [Mac](https://github.com/Quirkbot/QuirkbotArduinoToolsMac)

# Installation

### Clone repository, including all submodules
```
$ git clone --recursive https://github.com/Quirkbot/QuirkbotCompilerServer.git
$ cd QuirkbotCompilerServer
```

### Install node dependencies

```
$ sudo npm install
```

# Environment variables

### ```PORT```
ConfigureS in which port the server will respond to.

Defaults to ```8080```.

### ```MONGO_URL```
ConfigureS in which database the services will connect to.

Defaults to ```mongodb://localhost:27017/quirkbot-compiler```.

### ```WEB_CONCURRENCY```
The number of forks that will be spawned for each process.

On Heroku, it defaults to ```[Total available memory] / WEB_MEMEORY```
, so the best way to configure is to set ```WEB_MEMORY``` according to what is best for your dyno.

If ```WEB_CONCURRENCY``` is falsey, it will default to the number of cores of the machine.

# Initialization
### Database
If Mongo is not running, start it up with:
```
$ mongod
```
### Webserver
Start the webserver with
```
$ node server.js
```
### Compiler
Start the compiler worker
```
$ node compiler.js
```
# Updating
### Quirkbot Board
Update the submodule with:
```
$ cd compiler/arduino/hardware/arduino
$ git fetch origin
$ git merge origin/master
$ cd ..
$ git add arduino
$ git commit -m "Updated Quirkbot Arduino Hardware"
```

### Quirkbot Library
Update the submodule with:
```
$ cd compiler/arduino/libraries/Quirkbot
$ git fetch origin
$ git merge origin/master
$ cd ..
$ git add arduino
$ git commit -m "Updated Quirkbot Arduino Library"
```
