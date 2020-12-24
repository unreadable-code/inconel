export type {ComponentDefinition} from "./component";
export type {ServiceClass, Service, ServiceLookup} from "./service";
export type {Extension, Host, Loader, LoadResult} from "./types";

export {Builder as HostBuilder} from "./host";

/**
 * The namespace reserved for special "builtin" services and components exposed
 * by the host application itself
 */
export const BuiltinNamespace = "_builtin";