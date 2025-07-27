import { CurrentRuntime, Runtime } from "@cross/runtime";
import { FFIBackend } from "./types.ts";

export async function getFFIBackend(): Promise<FFIBackend> {
    switch (CurrentRuntime) {
        case Runtime.Bun: {
            const { BunBackend } = await import('./backends/bun.ts');
            return BunBackend;
        }
        case Runtime.Deno: {
            const { DenoBackend } = await import('./backends/deno.ts');
            return DenoBackend;
        }
        case Runtime.Node: {
            const { NodeBackend } = await import('./backends/node.ts');
            return NodeBackend;
        }
        default:
            throw new Error(`Unsupported runtime: ${CurrentRuntime}`);
    }
}

const luffi = await getFFIBackend();

export { luffi };