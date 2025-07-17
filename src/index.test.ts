import { test } from "@cross/test";
import { assertEquals, assertThrows } from "@std/assert";
import { luffi } from "./index.ts";
import { CurrentOS, OperatingSystem } from "@cross/runtime";


function getSystemLibrary(): string {
    switch (CurrentOS) {
        case OperatingSystem.Linux:
            return "libc.so.6";
        case OperatingSystem.macOS:
            return "libSystem.dylib";
        case OperatingSystem.Windows:
            return "msvcrt.dll";
        default:
            throw new Error(`Unsupported platform: ${CurrentOS}`);
    }
}

test("should load the system library", () => {
    const systemLibrary = getSystemLibrary();
    const libc = luffi.dlopen(systemLibrary, {
        printf: {
            result: luffi.types.int,
            parameters: [luffi.pointer(luffi.types.char)]
        }
    });
    const message = "Hello world!\n";
    const result = libc.symbols.printf(message);
    assertEquals(typeof result, "number");
    libc.dlclose();
});

test("should handle errors gracefully", () => {
    assertThrows(() => {
        luffi.dlopen("nonexistent_library.so", {
            someFunction: {
                result: luffi.types.int,
                parameters: []
            }
        });
    });
});
