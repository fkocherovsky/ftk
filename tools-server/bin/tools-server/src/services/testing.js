"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld2 = exports.helloWorld = exports.Settings = void 0;
const core_1 = require("../../../kit/src/core");
const config_1 = require("../../../gserver/src/core/config");
let Settings = class Settings {
};
Settings.cfgBoolTest1 = true;
Settings.cfgBoolTest2 = true;
Settings.cfgStringTest1 = 'cfgStringTest1_default';
Settings.cfgStringTest2 = 'cfgStringTest2_default';
Settings.cfgStringTest3 = 'cfgStringTest3_default';
Settings.cfgNumTest1 = 11;
Settings.cfgNumTest2 = 22;
Settings.cfgNumTest3 = 33;
Settings.cfgEncryptedTest = 'blabla_ENCRYPTED_DEFAULT_blabla';
Settings.someSecretBoo = 'bobobobo';
Settings.cfgMapIndexNumberTest = {
    k1: 101,
    k2: 102,
    k3: 103,
};
__decorate([
    (0, config_1.configurable)({ encrypted: true }),
    __metadata("design:type", Object)
], Settings, "cfgEncryptedTest", void 0);
__decorate([
    (0, config_1.configurable)({ encrypted: true }),
    __metadata("design:type", Object)
], Settings, "someSecretBoo", void 0);
Settings = __decorate([
    (0, config_1.configurable)()
], Settings);
exports.Settings = Settings;
helloWorld.metadata = { authorization: 'none', method: 'ANY' };
async function helloWorld(req, context) {
    (0, core_1.logI)(`cfgBoolTest1 = [${Settings.cfgBoolTest1}]\ncfgBoolTest2 = [${Settings.cfgBoolTest2}]\ncfgStringTest1 = [${Settings.cfgStringTest2}]\ncfgStringTest3 = [${Settings.cfgStringTest3}]\ncfgNumTest1 = [${Settings.cfgNumTest1}]\ncfgNumTest2 = [${Settings.cfgNumTest2}]\ncfgNumTest3 = [${Settings.cfgNumTest3}]`);
    let tmp = Settings;
    (0, core_1.logI)(`${JSON.stringify(tmp)}`);
    _somePrivateFuncToTestLoader();
    return { result: 'HelloWorld', from: req };
}
exports.helloWorld = helloWorld;
_somePrivateFuncToTestLoader.metadata = { authorization: 'none' };
async function _somePrivateFuncToTestLoader() {
    (0, core_1.logI)('does nothing');
}
helloWorld2.metadata = { authorization: 'none', method: 'ANY' };
async function helloWorld2(req, context) {
    (0, core_1.logI)(`cfgBoolTest1 = [${Settings.cfgBoolTest1}]\ncfgBoolTest2 = [${Settings.cfgBoolTest2}]\ncfgStringTest1 = [${Settings.cfgStringTest2}]\ncfgStringTest3 = [${Settings.cfgStringTest3}]\ncfgNumTest1 = [${Settings.cfgNumTest1}]\ncfgNumTest2 = [${Settings.cfgNumTest2}]\ncfgNumTest3 = [${Settings.cfgNumTest3}]`);
    let tmp = Settings;
    (0, core_1.logI)(`${JSON.stringify(tmp)}`);
    _somePrivateFuncToTestLoader();
    return { result: 'HelloWorld', from: req };
}
exports.helloWorld2 = helloWorld2;
//# sourceMappingURL=testing.js.map