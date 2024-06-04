"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapServer = exports.appName = void 0;
const core_1 = require("../../../kit/src/core");
const config_1 = require("./config");
const server_1 = require("./server");
async function bootstrapServer() {
    let flags = (0, config_1.cfgGetStartupFlags)();
    exports.appName = flags.app;
    (0, core_1.logI)(`${process.pid}: Starting server (single-process): ` + JSON.stringify(flags));
    await (0, server_1.initializeServer)();
}
exports.bootstrapServer = bootstrapServer;
//# sourceMappingURL=bootstrap.js.map