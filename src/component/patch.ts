import {Extension} from "..";
import {Reporter} from "../report";
import {ServiceLookup} from "../service";

import {
    ComponentDefinitionPropertyNames,
    PropertyDefinition,
} from ".";

import {
    generalize,
    GenericComponentDefinition,
    GenericComponentLookup,
} from "./generic";

interface ComponentValidationError extends Error {
    services?: string[];
}

function validate(component: GenericComponentDefinition<unknown>, services: ServiceLookup): Error | null {
    if (component.services) {
        const unfulfilled = component.services.filter(s => !services[s]);
        if (unfulfilled.length) {
            const err = new Error("Component has unfulfilled service dependencies") as ComponentValidationError;
            err.services = unfulfilled;
            return err;
        }
    }

    return null;
}

export class Patch<Ext extends Extension> {
    private readonly newComponents = {} as {   
        [K in ComponentDefinitionPropertyNames<Ext>]
            : Array<GenericComponentDefinition<unknown>>
    };

    constructor(
        private readonly definitions: ReadonlyArray<PropertyDefinition<Ext>>,
    ) {
        for (let n = definitions.length; n --> 0;)
            this.newComponents[definitions[n].name] = [];
    }

    public add(extension: Ext): void {
        for (let p = this.definitions.length; p --> 0;) {
            const {name: propertyName, mapper} = this.definitions[p];
            const container = this.newComponents[propertyName];

            const property = extension[propertyName];
            if (Array.isArray(property))
                for (const elem of property)
                    container.push(generalize(elem, extension.namespace, mapper));
        }
    }

    public validate(services: ServiceLookup, reporter: Reporter): void {
        for (let n = this.definitions.length; n --> 0;) {
            const {name: componentName} = this.definitions[n];
            const components = this.newComponents[componentName];
            for (let c = components.length; c --> 0;) {
                const component = components[c];
                const err = validate(component, services);
                if (err)
                    reporter.add(component.id, err);
            }
        }
    }

    public combine(other: GenericComponentLookup<Ext>): GenericComponentLookup<Ext> {
        for (let n = this.definitions.length; n --> 0;) {
            const {name: componentName} = this.definitions[n];
            this.newComponents[componentName] = other[componentName].concat(this.newComponents[componentName]);
        }

        return Object.freeze(this.newComponents);
    }
}