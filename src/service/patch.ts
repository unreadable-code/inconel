import {ServiceClass, ServiceLookup} from ".";
import {Extension} from "..";
import {Reporter} from "../report";

class ServiceDefinitionError extends Error {
    constructor(
        public readonly service: string,
        message: string,
    ) {
        super(message);
    }
}

class ServiceDependencyError extends Error {
    constructor (
        public readonly service: string,
        public readonly path: string[],
        message: string,
    ) {
        super(message);
    }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function isServiceDependencyError(o: any): o is ServiceDependencyError {
    return o && o.service && o.path;
}

interface ServiceClassLookup {
    [id: string]: ServiceClass
}

export class Patch {
    private readonly definitions = {} as ServiceClassLookup;

    constructor(private services: ServiceLookup) {}

    public add(extension: Extension): void {
        if (!extension.services)
            return;

        for (let n = 0; n < extension.services.length; ++n) {
            const Type = extension.services[n] as ServiceClass;
            const id = `${extension.namespace}.${Type.shortName}`;

            if (!Type.shortName)
                throw new ServiceDefinitionError(id, "Missing \"shortName\" property on service definition");

            if (this.services[id] || this.definitions[id])
                throw new ServiceDefinitionError(id, "Service with duplicate identifier");

            this.definitions[id] = Type;
        }
    }

    private sortServices(
        serviceId: string,
        ready: Array<string>,
        path: Array<string>,
        requested: ServiceClassLookup,
        instantiated: ServiceLookup,
    ): void {
        path.push(serviceId);

        const dependencies = requested[serviceId].dependencies || [];
        for (let d = dependencies.length; d --> 0;) {
            const depId = dependencies[d];

            // Filter out dependencies that are or can be instantiated
            if (instantiated[depId] || ready.indexOf(depId) >= 0)
                continue;

            if (!requested[depId])
                throw new ServiceDependencyError(depId, path, "Undefined service");

            if (path.indexOf(depId) >= 0)
                throw new ServiceDependencyError(serviceId, path, "Cyclic service dependency");

            this.sortServices(depId, ready, path, requested, instantiated);
        }

        path.pop();
        ready.push(serviceId);
    }

    public compile(reporter: Reporter): void {
        const instantiationOrder = new Array<string>();

        for (const id in this.definitions) {
            if (!Object.hasOwnProperty.call(this.definitions, id) || instantiationOrder.indexOf(id) >= 0)
                continue;

            try {
                this.sortServices(id, instantiationOrder, [], this.definitions, this.services);
            } catch (e) {
                if (isServiceDependencyError(e))
                    reporter.add(e.service, e);
                else
                    reporter.add("ServiceGraph", e as Error);
            }
        }

        if (reporter.success) {
            this.services = Object.assign({}, this.services);
            for (let n = 0; n < instantiationOrder.length; ++n) {
                const id = instantiationOrder[n];
                const Type = this.definitions[id];

                const dependencies = (Type.dependencies || []).map(i => this.services[i]);
                this.services[id] = new Type(dependencies);
            }
        }
    }

    public merge(): Readonly<ServiceLookup> {
        return Object.freeze(this.services);
    }
}