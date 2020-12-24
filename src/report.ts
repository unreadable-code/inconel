import {LoadResult} from ".";

export class Reporter {
    private readonly result: LoadResult = {
        success: true,
        errors: {},
    };

    public get success(): boolean {
        return this.result.success;
    }

    public add(source: string, error: Error): void {
        this.result.success = false;
        this.result.errors[source] = error;
    }

    public get(): LoadResult {
        return this.result;
    }
}