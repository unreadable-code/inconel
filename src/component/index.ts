import type {DerivativePropertyNames, Extension} from "../types";
import type {Service} from "../service";

export type SelectedServices<ServiceNames extends string> = {
    readonly [K in ServiceNames]: Service;
}

/**
 * A React component that has service dependencies
 */
export interface ComponentDefinition<
    ServiceNames extends string,
    SpecificProps,
> {
    /**
     * The identifier of the component, unique to the namespace of its extension
     */
    readonly id: string;

    /**
     * The ReactJS component that will be embedded
     */
    readonly component: React.ComponentType<
        SpecificProps & SelectedServices<ServiceNames>>;

    /**
     * The names of services that will be passed through the `services` prop
     */
    readonly services?: ReadonlyArray<ServiceNames>;
}

/**
 * The most general possible description of any possible component definition
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyComponentDefinition = ComponentDefinition<string, any>;

/**
 * Given an extension, get the names of properties that contains component definitions
 */
export type ComponentDefinitionPropertyNames<Ext extends Extension>
    = DerivativePropertyNames<Ext, ReadonlyArray<AnyComponentDefinition> | undefined>;

/**
 * A mapper of component props
 */
export type PropsMapper<
    FromProps,
    ToProps,
    Def extends ComponentDefinition<string, ToProps>,
> = (def: Def, props: FromProps) => ToProps;

/**
 * The most general possible description of any props mapper function
 */
export type AnyPropsMapper
    = PropsMapper<unknown, unknown, AnyComponentDefinition>;

export type ComponentDefsType<T>
    = T extends (undefined | ReadonlyArray<infer C>)
        ? ([C] extends [AnyComponentDefinition]
            ? C
            : never
        ) : never;

export type SpecificProps<Component>
    = Component extends ComponentDefinition<string, infer SP>
        ? SP
        : never;

/**
 * A config value that designates an extension property as a source of component
 * definitions
 */
export type PropertyDefinition<
    Ext extends Extension,
    PropertyName extends keyof Ext = ComponentDefinitionPropertyNames<Ext>,
> = {
    name: PropertyName,
    mapper: AnyPropsMapper,
    builtin?: ReadonlyArray<ComponentDefsType<Ext[PropertyName]>>,
};

export type {Collection} from "./collection";
export type {GenericComponentLookup} from "./generic";
export {create as createCollection} from "./collection";