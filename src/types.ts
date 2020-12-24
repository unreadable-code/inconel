import type {GenericComponentLookup} from "./component";
import type {ServiceClass, ServiceLookup} from "./service";

/**
 * A standard extension object that can be loaded by the loader
 */
export interface Extension {
    /**
     * The unique identifier of the extension.
     * 
     * Recommended naming convention is hyphenated reversed domains.
     * eg: de.unreadableco.example-extension
     */
    readonly namespace: string;

    /**
     * Services provided by this extension
     */
    readonly services?: ReadonlyArray<ServiceClass>;

    /**
     * URLs to stylesheets needed to present components of the extension
     */
    readonly stylesheets?: ReadonlyArray<URL>;
}

/**
 * Given a derivative of `Extension` get the names of all properties it added
 */
type AllDerivativePropertyNames<Ext extends Extension>
    = Exclude<keyof Ext, number | symbol | keyof Extension>

/**
 * Given a derivative of `Extension` get the names of all properties it added
 * whose value are compatible with a particular type
 */
export type DerivativePropertyNames<Ext extends Extension, Matching> = {
    [N in AllDerivativePropertyNames<Ext>]: Ext[N] extends Matching ? N : never
}[AllDerivativePropertyNames<Ext>];

/**
 * A loader abstracts the platform specific nature of extension loading.
 * 
 * Implementations are available via the `inconel-*-loader` packages
 */
export interface Loader<Ext extends Extension> {
    load(reference: string): Promise<Ext>;
    resolve(url: URL): string;
}

export interface LoadResult {
    success: boolean;
    errors: {[source: string]: Error};
}

/**
 * The host of extensions, performs loading & lifespan management
 */
export interface Host<Ext extends Extension> {
    /**
     * The consolidated snapshot of all available services, to be passed as-is
     * to components, or used to access the services
     */
    services: ServiceLookup;

    /**
     * The snapshot of all loaded components, keyed by the property name of the
     * extension object from which they were collected
     */
    components: GenericComponentLookup<Ext>;

    /**
     * @param references A list of identifiers understood by the loader
     * @returns The results of loading the extensions, whether the process
     *      succeeded. Note that we institute transactional semantics on error
     */
    load(...references: string[]): Promise<LoadResult>;
}