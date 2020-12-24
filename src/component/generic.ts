import * as React from "react";
import {Extension} from "..";
import {Service, ServiceLookup} from "../service";

import {
    ComponentDefinition,
    ComponentDefinitionPropertyNames,
    PropsMapper,
    SelectedServices,
} from ".";

/**
 * Base props of components required by all generalized components
 */
interface CommonGenericProps {
    readonly services: ServiceLookup;
}

/**
 * The definition of a "generalized" component is one that accepts a predictable
 * set of props.
 * 
 * Simplest example this is a component that accepts only the services lookup.
 */
export type GenericComponentDefinition<Props> = {
    readonly id: string;
    readonly component: React.ComponentType<CommonGenericProps & Props>;
    readonly services?: ReadonlyArray<string>;
}

/**
 * Assuming that all component definition compatible properties are registered
 * this type captures what the equivalent component snapshot would look like
 */
export type GenericComponentLookup<Ext extends Extension> = {
    // Do not attempt to remove the "unknown" from the below, as the mapper
    // function needed to derive the actual outer layer generic props is not
    // staticly derivable from the extension interface
    [K in ComponentDefinitionPropertyNames<Ext>]
        : ReadonlyArray<GenericComponentDefinition<unknown>>
};

export function generalize<Defs, GenericProps, SpecificProps, ServiceNames extends string>(
    definition: ComponentDefinition<ServiceNames, SpecificProps> & Defs,
    namespace: string,
    mapProps: PropsMapper<GenericProps, SpecificProps, ComponentDefinition<ServiceNames, SpecificProps> & Defs>,
): Defs & GenericComponentDefinition<GenericProps> {
    if (!definition.id)
        throw new Error("Component definition missing an ID");

    if (!definition.component)
        throw new Error("Missing valid React component");

    const servicesRequested = definition.services
        || ([] as ReadonlyArray<ServiceNames>);

    const component = React.memo(definition.component) as unknown as
        React.ComponentType<SelectedServices<ServiceNames> & SpecificProps>;

    const result = Object.create(definition);
    result.id = `${namespace}.${result.id}`;
    result.component = ({
        services: allServices,
        ...props
    }: GenericProps & CommonGenericProps) => {
        const specific = mapProps(result, props as unknown as GenericProps) as
            SelectedServices<ServiceNames> & SpecificProps;

        for (let i = servicesRequested.length; i --> 0;) {
            const serviceName = servicesRequested[i];
            (specific[serviceName] as Service) = allServices[serviceName];
        }

        return React.createElement(component, specific, null);
    };

    return result;
}
