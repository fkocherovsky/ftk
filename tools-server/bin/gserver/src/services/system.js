"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
ping.metadata = { authorization: 'none', method: 'ANY', noTrafficLog: true };
async function ping() {
    return { reply: 'pong' };
}
exports.ping = ping;
//# sourceMappingURL=system.js.map