# Quirkbot Compiler: Worker
A service that compiles queued Quirkbot programs.

This service reads queued compilation requests out of a database and compiles them. It doesn't serve any content to external clients, that is done by the [Quirkbot Compiler: Server](https://github.com/Quirkbot/QuirkbotCompilerServer).

The code is optimized to run on a multi core machine. One compilation worker will be spawned for each core.

# Requirements
- Node.js
- NPM
- Mongo

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

#### ```PORT```
ConfigureS in which port the server will respond to.
Defaults to ```8080```.

#### ```MONGO_URL```
ConfigureS in which database the services will connect to.
Defaults to ```mongodb://localhost:27017/quirkbot-compiler```.

#### ```TOOLCHAIN_OS```
Configures which OS specific toochain will be used in the compilation process.

Possible values are ```mac``` or ```linux```. Defaults to ```linux```.

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
