/**
 * Tag type implemented by all objects offered to extensions as services
 */
export type Service = unknown;

/**
 * An array of services keyed by their short name
 */
export interface ServiceLookup {
    [K: string]: Service
}

/**
 * Class definition of a `Service` derivative
 */
export interface ServiceClass {
    /**
     * @param services
     *      The dependencies provided in the same order as `#dependencies`
     */
    new(services: ReadonlyArray<Service>): Service;

    /**
     * The name of the service, unique within the scope of the extension
     */
    readonly shortName: string;

    /**
     * The full names of services that will be passed to the constructor
     */
    readonly dependencies?: ReadonlyArray<string>;
}

export {ServiceGraph} from "./graph";