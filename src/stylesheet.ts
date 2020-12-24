import {Extension, Loader} from "./types";

/**
 * Manges stylesheets loaded by extensions
 */
export class Stylesheets {
    constructor(
        private readonly document: HTMLDocument,
        private loader: Loader<Extension>,
    ) {}

    public createPatch(): Patch {
        return new Patch();
    }

    public commit(patch: Patch): void {
        patch.commit(this.document, this.loader);
    }
}

class Patch {
    private extensions = new Array<Extension>();

    public add(extension: Extension) {
        if (Array.isArray(extension.stylesheets))
            this.extensions.push(extension);
    }

    public commit(document: HTMLDocument, loader: Loader<Extension>) {
        const fragment = document.createDocumentFragment();

        for (const extension of this.extensions)
        for (let url of extension.stylesheets as ReadonlyArray<URL>) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";

            if (url.protocol !== "http:" && url.protocol !== "https:")
                url = new URL(`${url.toString()}?namespace=${extension.namespace}`);

            link.href = loader.resolve(url);
            fragment.append(link);
        }

        document.head.appendChild(fragment);
    }
}