import {Extension, Loader, LoadResult, Host as Interface} from ".";
import {
    AnyPropsMapper,
    ComponentDefsType,
    SpecificProps,
    createCollection as createComponents,
} from "./component";
import {Reporter} from "./report";
import {ServiceGraph, ServiceLookup} from "./service";
import {Stylesheets} from "./stylesheet";

import type {
    Collection as ComponentCollection,
    ComponentDefinitionPropertyNames,
    GenericComponentLookup,
    PropsMapper,
    PropertyDefinition,
} from "./component";

export class Builder<Ext extends Extension> {
    private services?: ServiceGraph;
    private componentProperties = new Array<PropertyDefinition<Ext, ComponentDefinitionPropertyNames<Ext>>>();

    constructor(
        private readonly loader: Loader<Ext>,
        private readonly document: HTMLDocument,
    ) {}

    public withBuiltinServices(builtinServices: Readonly<ServiceLookup>): Builder<Ext> {
        this.services = new ServiceGraph(builtinServices);
        return this;
    }

    public withReactComponents<
        FromProps,
        PropertyName extends ComponentDefinitionPropertyNames<Ext>,
    >(
        propertyName: PropertyName,
        mapper: PropsMapper<
            FromProps,
            SpecificProps<ComponentDefsType<Ext[PropertyName]>>,
            ComponentDefsType<Ext[PropertyName]>
        >,
        builtin?: ReadonlyArray<ComponentDefsType<Ext[PropertyName]>>,
    ): Builder<Ext> {
        this.componentProperties.push({
            name: propertyName,
            mapper: mapper as AnyPropsMapper,
            builtin,
        });
        return this;
    }

    public build(): Interface<Ext> {
        return new Host(
            this.loader,
            this.services || new ServiceGraph(),
            createComponents<Ext>(this.componentProperties),
            new Stylesheets(this.document, this.loader),
        );
    }
}

/**
 * The extension host that manages the lifespan of all extensions
 */
export class Host<Ext extends Extension> implements Interface<Ext> {
    public get components(): GenericComponentLookup<Ext> {
        return this.componentsCollection.components;
    }

    public get services(): ServiceLookup {
        return this.serviceGraph.services;
    }

    constructor(
        private readonly loader: Loader<Ext>,
        private readonly serviceGraph: ServiceGraph,
        private readonly componentsCollection: ComponentCollection<Ext>,
        private readonly stylesheets: Stylesheets,
    ) {}

    public async load(...references: string[]): Promise<LoadResult> {
        const status = new Reporter();

        const loadTasks = await Promise.allSettled(
            references.map(r => this.loader.load(r)));

        const newComponents = this.componentsCollection.createPatch();
        const newServices = this.serviceGraph.createPatch();
        const newStyles = this.stylesheets.createPatch();

        for (let n = 0; n < loadTasks.length; ++n) {
            const extensionRefName = references[n];
            const tr = loadTasks[n];
            if (tr.status !== "fulfilled") {
                status.add(extensionRefName, tr.reason);
                continue;
            }
    
            const extension = tr.value;
            if (!extension.namespace) {
                status.add(extensionRefName, new Error("Missing namespace property on extension"));
                continue;
            }

            try {
                newServices.add(extension);
                newComponents.add(extension);
                newStyles.add(extension);
            } catch (e) {
                status.add(extensionRefName, e);
            }
        }

        newServices.compile(status);

        if (status.success)
            newComponents.validate(newServices.merge(), status);

        const result = status.get();
        if (result.success) {
            this.serviceGraph.commit(newServices);
            this.componentsCollection.commit(newComponents);
            this.stylesheets.commit(newStyles);
        }

        return result;
    }
}