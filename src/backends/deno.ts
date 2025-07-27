import type {
  CType,
  FFIBackend,
  FFILibrary,
  FFISymbol,
  ForeignFunction,
  NativeObject,
} from "../types.ts";
import { types } from "../types.ts";

const TYPE_MAP: Record<CType, Deno.NativeType | Deno.NativeVoidType> = {
  bool: "bool",
  char: "i8",
  double: "f64",
  float: "f32",
  int: "i32",
  int16T: "i16",
  int32T: "i32",
  int64T: "i64",
  int8T: "i8",
  intptrT: "pointer",
  long: "i64",
  longLong: "i64",
  short: "i16",
  sizeT: "isize",
  uint16T: "u16",
  uint32T: "u32",
  uint64T: "u64",
  uint8T: "u8",
  uintptrT: "pointer",
  unsignedChar: "u8",
  unsignedInt: "u32",
  unsignedLong: "u64",
  unsignedLongLong: "u64",
  unsignedShort: "u16",
  void: "void",
  wcharT: "u16",
};

function mapType(type: CType | NativeObject): Deno.NativeResultType {
  if (typeof type === "string") {
    return TYPE_MAP[type];
  }
  return type.native;
}

export const DenoBackend: FFIBackend = {
  dlopen: <T extends Record<string, FFISymbol>>(
    path: string,
    symbols: T,
  ): FFILibrary<T> => {
    const denoSymbols = Object.entries(symbols).reduce<
      Record<string, Deno.ForeignFunction>
    >((acc, [name, symbol]) => {
      const denoSymbol = {
        parameters: symbol.parameters.map(mapType).filter((param) =>
          param !== "void"
        ),
        result: mapType(symbol.result),
      };

      return { ...acc, [name]: denoSymbol };
    }, {});

    const library = Deno.dlopen(path, denoSymbols);

    // Wrap each function to handle string parameters
    const luffiSymbols = Object.entries(library.symbols).reduce(
      (acc, [name, symbol]) => {
        return {
          ...acc,
          [name]: (...args: any[]) => {
            const mappedArgs = args.map((arg) => {
              if (typeof arg === "string") {
                return new TextEncoder().encode(arg + "\0");
              }
              return arg;
            });
            return symbol(...mappedArgs);
          },
        };
      },
      {} as Record<keyof T, ForeignFunction>,
    );

    return {
      symbols: luffiSymbols,
      dlclose: () => library.close(),
    };
  },

  out: (type) => ({ native: type }),

  pointer: () => ({ native: "buffer" }),

  struct: (definition) => {
    return {
      native: {
        struct: definition.map(([, type]) => mapType(type)).filter((type) =>
          type !== "void"
        ),
      },
    };
  },

  types,
};
