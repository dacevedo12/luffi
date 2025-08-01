import type {
  CType,
  FFIBackend,
  FFILibrary,
  FFISymbol,
  ForeignFunction,
  NativeObject,
} from "../types.ts";
import type { IKoffiCType } from "koffi";
import koffi from "koffi";
import { types } from "../types.ts";

const TYPE_MAP: Record<CType, string> = {
  bool: "bool",
  char: "char",
  double: "double",
  float: "float",
  int: "int",
  int16T: "int16_t",
  int32T: "int32_t",
  int64T: "int64_t",
  int8T: "int8_t",
  intptrT: "intptr_t",
  long: "long",
  longLong: "long long",
  short: "short",
  sizeT: "size_t",
  uint16T: "uint16_t",
  uint32T: "uint32_t",
  uint64T: "uint64_t",
  uint8T: "uint8_t",
  uintptrT: "uintptr_t",
  unsignedChar: "unsigned char",
  unsignedInt: "unsigned int",
  unsignedLong: "unsigned long",
  unsignedLongLong: "unsigned long long",
  unsignedShort: "unsigned short",
  void: "void",
  wcharT: "wchar_t",
};

function mapType(type: CType | NativeObject): string | IKoffiCType {
  if (typeof type === "string") {
    return TYPE_MAP[type];
  }
  return type.native;
}

export const NodeBackend: FFIBackend = {
  dlopen: <T extends Record<string, FFISymbol>>(
    path: string,
    symbols: T,
  ): FFILibrary<T> => {
    const lib = koffi.load(path);
    const luffiSymbols = Object.entries(symbols).reduce(
      (acc, [name, symbol]) => ({
        ...acc,
        [name]: lib.func(
          name,
          mapType(symbol.result),
          symbol.parameters.map(mapType),
        ),
      }),
      {} as Record<keyof T, ForeignFunction>,
    );

    return {
      symbols: luffiSymbols,
      dlclose: () => lib.unload(),
    };
  },

  out: (type) => ({ native: koffi.out(mapType(type)) }),

  pointer: (type) => ({ native: koffi.pointer(mapType(type)) }),

  struct: (definition) => ({
    native: koffi.struct(
      Object.fromEntries(
        definition.map(([name, type]) => [name, mapType(type)]),
      ),
    ),
  }),

  types,
};
