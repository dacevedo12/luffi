/**
 * Core FFI types supported across all runtimes
 */
export const types = {
    bool: "bool",
    char: "char",
    double: "double",
    float: "float",
    int: "int",
    int16T: "int16T",
    int32T: "int32T",
    int64T: "int64T",
    int8T: "int8T",
    intptrT: "intptrT",
    long: "long",
    longLong: "longLong",
    short: "short",
    sizeT: "sizeT",
    uint16T: "uint16T",
    uint32T: "uint32T",
    uint64T: "uint64T",
    uint8T: "uint8T",
    uintptrT: "uintptrT",
    unsignedChar: "unsignedChar",
    unsignedInt: "unsignedInt",
    unsignedLong: "unsignedLong",
    unsignedLongLong: "unsignedLongLong",
    unsignedShort: "unsignedShort",
    void: "void",
    wcharT: "wcharT",
} as const;

export type BaseType = keyof typeof types;
export type CType = BaseType | `${BaseType}*`;

export type ForeignFunction = (...args: any[]) => any;

/**
 * Symbol definition for FFI functions
 */
export interface FFISymbol {
    /** Return type of the function */
    result: CType;
    /** Parameter types of the function */
    parameters: CType[];
}


export interface FFILibrary<T> {
    symbols: Record<keyof T, ForeignFunction>;
    dlclose: () => void;
}

/**
 * Interface that must be implemented by each runtime-specific FFI implementation
 */
export interface FFIBackend {
    /**
     * Core FFI types supported by this backend
     */
    readonly types: typeof types;

    /**
     * Load a native library and return its symbols
     */
    dlopen<T extends Record<string, FFISymbol>>(path: string, symbols: T): FFILibrary<T>;

    /**
     * Create a pointer type
     */
    pointer(type: BaseType): `${BaseType}*`;
}
