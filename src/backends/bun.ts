import type { FFIBackend, FFISymbol, CType, ForeignFunction, FFILibrary, NativeObject } from '../types.ts';
import { FFIFunction, FFIType, dlopen } from "bun:ffi";
import { Buffer } from 'node:buffer';
import { types } from '../types.ts';

const TYPE_MAP: Record<CType, FFIType> = {
    bool: FFIType.bool,
    char: FFIType.char,
    double: FFIType.double,
    float: FFIType.float,
    int: FFIType.int,
    int16T: FFIType.int16_t,
    int32T: FFIType.int32_t,
    int64T: FFIType.int64_t,
    int8T: FFIType.int8_t,
    intptrT: FFIType.ptr,
    long: FFIType.i64,
    longLong: FFIType.i64,
    short: FFIType.i16,
    sizeT: FFIType.uint64_t,
    uint16T: FFIType.uint16_t,
    uint32T: FFIType.uint32_t,
    uint64T: FFIType.uint64_t,
    uint8T: FFIType.uint8_t,
    uintptrT: FFIType.ptr,
    unsignedChar: FFIType.u8,
    unsignedInt: FFIType.u32,
    unsignedLong: FFIType.u64,
    unsignedLongLong: FFIType.u64,
    unsignedShort: FFIType.u16,
    void: FFIType.void,
    wcharT: FFIType.u16,
}

function mapType(type: CType | NativeObject): FFIType {
    if (typeof type === "string") {
        return TYPE_MAP[type]
    }
    return type.native;
}


export const BunBackend: FFIBackend = {
    dlopen: <T extends Record<string, FFISymbol>>(path: string, symbols: T): FFILibrary<T> => {
        const bunSymbols = Object.entries(symbols).reduce((acc, [name, symbol]) => ({
            ...acc,
            [name]: {
                args: symbol.parameters.map(mapType),
                returns: mapType(symbol.result),
            }
        }), {} as Record<string, FFIFunction>);

        const library = dlopen(path, bunSymbols);

        // Wrap each function to handle string parameters
        const luffiSymbols = Object.entries(library.symbols).reduce((acc, [name, symbol]) => {
            return {
                ...acc,
                [name]: (...args: any[]) => {
                    const mappedArgs = args.map((arg) => {
                        if (typeof arg === "string") {
                            return Buffer.from(arg, "utf-8");
                        }
                        return arg;
                    });
                    return symbol(...mappedArgs as never);
                }
            };
        }, {} as Record<keyof T, ForeignFunction>);

        return {
            symbols: luffiSymbols,
            dlclose: () => library.close(),
        };
    },

    out: (type) => ({ native: type}),

    pointer: () => ({ native: FFIType.pointer }),

    struct: () => {
        throw new Error("Bun FFI doesn't support 'struct' types. https://github.com/oven-sh/bun/issues/6139");
    },

    types,
}; 