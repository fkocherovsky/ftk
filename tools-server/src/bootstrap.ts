// import { bootstrapServer } from 'gserver/bootstrap';
import { bootstrapServer } from '../../gserver/src/core/bootstrap'; //'../../gserver/bootstrap';
// NOTE: any additional startup logic must be implemented in relevant onServerStart callbacks
// tslint:disable-next-line: no-floating-promises // TODO: switch tsconfig: target from 'es2017' to 'esnext' and put 'await' here instead of disabling tslint rule
bootstrapServer();
