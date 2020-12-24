import {BuiltinNamespace, Extension} from "..";

import {ComponentDefinitionPropertyNames, PropertyDefinition} from ".";
import {generalize, GenericComponentLookup} from "./generic";
import {Patch} from "./patch";

export interface Collection<Ext extends Extension> {
    components: GenericComponentLookup<Ext>;
    createPatch(): Patch<Ext>;
    commit(patch: Patch<Ext>): void;
}

export function create<Ext extends Extension>(
    definitions: ReadonlyArray<PropertyDefinition<Ext, ComponentDefinitionPropertyNames<Ext>>>,
): Collection<Ext> {
    let components = {} as GenericComponentLookup<Ext>;
    for (let n = definitions.length; n --> 0;) {
        const def = definitions[n];
        components[def.name] = def.builtin
            ? def.builtin.map(b => generalize(b, BuiltinNamespace, def.mapper))
            : [];
    }

    const result = Object.defineProperties({} as Collection<Ext>, {
        components: {
            configurable: false,
            enumerable: true,
            get: () => components,
        }
    });

    result.createPatch = function createPatch(): Patch<Ext> {
        return new Patch<Ext>(definitions);
    };

    result.commit = function commit(patch: Patch<Ext>): void {
        components = patch.combine(components);
    };

    return result;
}