import type { FFIBackend, FFISymbol, CType, BaseType, ForeignFunction, FFILibrary } from '../types.ts';
import { types } from '../types.ts';

const TYPE_MAP: Record<BaseType, Deno.NativeResultType> = {
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
}

function mapType(type: CType): Deno.NativeType {
  if (type.endsWith('*')) {
    return "buffer";
  }
  return TYPE_MAP[type as BaseType] as Deno.NativeType;
}

export const DenoBackend: FFIBackend = {
  dlopen: <T extends Record<string, FFISymbol>>(path: string, symbols: T): FFILibrary<T> => {
    const denoSymbols = Object.entries(symbols).reduce((acc, [name, symbol]) => ({
      ...acc,
      [name]: {
        parameters: symbol.parameters.map(mapType),
        result: mapType(symbol.result),
      }
    }), {} as Record<string, Deno.ForeignFunction>);
    const library = Deno.dlopen(path, denoSymbols);

    // Wrap each function to handle string parameters
    const luffiSymbols = Object.entries(library.symbols).reduce((acc, [name, symbol]) => {
      return {
        ...acc,
        [name]: (...args: any[]) => {
          const mappedArgs = args.map((arg) => {
            if (typeof arg === "string") {
              return new TextEncoder().encode(arg + '\0');
            }
            return arg;
          });
          return symbol(...mappedArgs);
        }
      };
    }, {} as Record<keyof T, ForeignFunction>);

    return {
      symbols: luffiSymbols,
      dlclose: () => library.close(),
    };
  },

  pointer: (type: BaseType) => `${type}*`,

  types,
}; 