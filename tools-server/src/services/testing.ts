
import { Index, logE, logI } from '../../../kit/src/core';
import { configurable } from '../../../gserver/src/core/config';
import { ServiceMetadata } from '../../../gserver/src/core/schema';

@configurable()
export class Settings {
    static cfgBoolTest1 = true;
    static cfgBoolTest2 = true;
   // @configurable({ encrypted: true }) static reverToken = '';
    static cfgStringTest1 = 'cfgStringTest1_default';
    static cfgStringTest2 = 'cfgStringTest2_default';
    static cfgStringTest3 = 'cfgStringTest3_default';

    static cfgNumTest1 = 11;
    static cfgNumTest2 = 22;
    static cfgNumTest3 = 33;

    @configurable({ encrypted: true }) static cfgEncryptedTest = 'blabla_ENCRYPTED_DEFAULT_blabla';
    @configurable({ encrypted: true })static someSecretBoo = 'bobobobo';

    static cfgMapIndexNumberTest: {[key: string]: number} = {
        k1: 101,
        k2: 102,
        k3: 103,
    };


    // static cfgMapIndexNumberTest: Index<number> = {
    //     k1: 101,
    //     k2: 102,
    //     k3: 103,
    // };
}


helloWorld.metadata = { authorization: 'none', method: 'ANY' } as ServiceMetadata;
export async function helloWorld(req: string, context?: any/*ToolsServiceContext*/): Promise<any> {
    logI(`cfgBoolTest1 = [${Settings.cfgBoolTest1}]\ncfgBoolTest2 = [${Settings.cfgBoolTest2}]\ncfgStringTest1 = [${Settings.cfgStringTest2}]\ncfgStringTest3 = [${Settings.cfgStringTest3}]\ncfgNumTest1 = [${Settings.cfgNumTest1}]\ncfgNumTest2 = [${Settings.cfgNumTest2}]\ncfgNumTest3 = [${Settings.cfgNumTest3}]`);
    let tmp = Settings;
    logI(`${JSON.stringify(tmp)}`);
    _somePrivateFuncToTestLoader();
    return {result: 'HelloWorld', from: req};
}


_somePrivateFuncToTestLoader.metadata = { authorization: 'none'} as ServiceMetadata;
async function _somePrivateFuncToTestLoader() {
    logI('does nothing');
}

helloWorld2.metadata = { authorization: 'none', method: 'ANY' } as ServiceMetadata;
export async function helloWorld2(req: string, context?: any/*ToolsServiceContext*/): Promise<any> {
    logI(`cfgBoolTest1 = [${Settings.cfgBoolTest1}]\ncfgBoolTest2 = [${Settings.cfgBoolTest2}]\ncfgStringTest1 = [${Settings.cfgStringTest2}]\ncfgStringTest3 = [${Settings.cfgStringTest3}]\ncfgNumTest1 = [${Settings.cfgNumTest1}]\ncfgNumTest2 = [${Settings.cfgNumTest2}]\ncfgNumTest3 = [${Settings.cfgNumTest3}]`);
    let tmp = Settings;
    logI(`${JSON.stringify(tmp)}`);
    _somePrivateFuncToTestLoader();
    return {result: 'HelloWorld', from: req};
}
