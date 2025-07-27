import { CurrentOS, OperatingSystem } from "@cross/runtime";
import { luffi } from "./index.ts";

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

const systemLibrary = getSystemLibrary();
const libc = luffi.dlopen(systemLibrary, {
    printf: {
        result: luffi.types.int,
        parameters: [luffi.pointer(luffi.types.char)]
    },
    usleep: {
        result: luffi.types.int,
        parameters: [luffi.types.unsignedInt]
    }
});

// ANSI color codes for a light show
const colors = [
    "\x1b[31m", // red
    "\x1b[32m", // green
    "\x1b[34m", // blue
    "\x1b[33m", // yellow
    "\x1b[35m", // magenta
    "\x1b[36m", // cyan
];

// Create a flashy effect
for (let i = 0; i < 20; i++) {
    const color = colors[i % colors.length];
    const message = `${color}★ FLASH ${i + 1}! \x07\x1b[0m\n`;
    libc.symbols.printf(message); // \x07 is the bell character
    libc.symbols.usleep(200000); // 200ms delay
}

console.log("Show's over! 🎉");