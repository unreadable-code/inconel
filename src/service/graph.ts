import {ServiceLookup} from ".";
import {Patch} from "./patch";

/**
 * Builds services given their definitions & dependencies
 */
export class ServiceGraph {
    private lookup: Readonly<ServiceLookup>;

    public get services(): Readonly<ServiceLookup> {
        return this.lookup;
    }

    /**
     * @param builtins
     *      A list of services assumed initialized (with resolved dependencies)
     */
    constructor(builtins?: ServiceLookup) {
        const services = builtins ? Object.assign({}, builtins) : {};
        this.lookup = Object.freeze(services);
    }

    public createPatch(): Patch {
        return new Patch(this.services);
    }

    public commit(patch: Patch): void {
        this.lookup = patch.merge();
    }
}