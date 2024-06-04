import { ServiceMetadata } from "../core/schema";
export declare function ping(): Promise<{
    reply: string;
}>;
export declare namespace ping {
    var metadata: ServiceMetadata;
}
