import { ServiceMetadata } from "../core/schema";

// http://localhost/xxxserver/services/system/ping
ping.metadata = { authorization: 'none', method: 'ANY', noTrafficLog: true } as ServiceMetadata;  // 'ANY' is needed e.g. when we want to test reverse proxies for each HTTP/S method
export async function ping() {
   // return true;
   return {reply: 'pong'};
}
