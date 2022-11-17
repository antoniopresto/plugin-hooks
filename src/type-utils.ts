export const tuple = <T extends string[]>(...args: T) => args;

export type Serializable = null | undefined | Stringifiable | SerializableList;

export interface Stringifiable {
  toString(): string;
}

export interface SerializableList extends Array<Serializable> {}

export const tupleNum = <T extends number[]>(...args: T) => args;

export const tupleEnum = <T extends string[]>(
  ...values: T
): {
  readonly //
  [K in T[number]]: K;
} & (T[number] extends 'list' //
  ? {
      //
      __list: T[number][];
    }
  : {
      //
      list: T[number][];
    }) &
  (T[number] extends 'enum'
    ? {
        //
        __enum: T[number];
      }
    : {
        //
        enum: T[number];
      }) => {
  const en = values.reduce((p, n) => {
    return {
      ...p,
      [n]: n,
    };
  }, Object.create(null));

  Object.defineProperty(en, en.list !== undefined ? '__list' : 'list', {
    enumerable: false,
    value: values,
  });

  Object.defineProperty(en, en.enum !== undefined ? '__enum' : 'enum', {
    enumerable: false,
    get() {
      return values[0];
    },
  });

  return en;
};

export type IsAny<T> = 0 extends 1 & T ? true : false;

export type IsNever<T> = [T] extends [never] ? true : false;

export type IsNullable<T> = Extract<T, null | undefined> extends never
  ? false
  : true;

export type IsOptional<T> = Extract<T, undefined> extends never ? false : true;

export type IsUnknown<T> = IsNever<T> extends false
  ? T extends unknown
    ? unknown extends T
      ? IsAny<T> extends false
        ? true
        : false
      : false
    : false
  : false;

export type OnlyKnown<T> = IsAny<T> extends true
  ? never
  : IsNever<T> extends true
  ? never
  : IsUnknown<T> extends true
  ? never
  : T;

export type MaybePromise<T> = T | Promise<T>;

export type PromiseType<P> = P extends Promise<infer T> ? T : never;

export type MaybeArray<T> = T | T[];

export type ArrayType<T> = T extends Array<infer N> ? N : T;

export type AnyRecord = Record<string, any>;

export type IfExtends<Param, Type, IfTrue, IfFalse> = Param extends Type
  ? IfTrue
  : IfFalse;

export type ObjectUnion<A, B> = {
  [K in keyof (A & B)]: (A & B)[K];
};

export type Entries<T> = {
  [K in Extract<keyof T, string>]-?: [K, T[K]];
}[Extract<keyof T, string>][];

export type AnyFunction = (...args: any[]) => any;

export type Writeable<T> = {
  -readonly [P in keyof T]: T[P];
};

export type ForceString<T> = T extends string ? T : never;
export type NotString<T> = string extends T ? never : T;

export type NullableToPartial<T> = UnionToIntersection<
  | {
      [K in keyof T as IsOptional<T[K]> extends true ? never : K]-?: T[K];
    }
  | {
      [K in keyof T as IsOptional<T[K]> extends true ? K : never]?: T[K];
    }
>;

type Join<L, R> = {
  [K in keyof ({
    [K in keyof L]: L[K];
  } & {
    [K in keyof R]: R[K];
  })]: ({
    [K in keyof L]: L[K];
  } & {
    [K in keyof R]: R[K];
  })[K];
};

export type Merge<L, R> = {
  [K in keyof L]: K extends keyof R
    ? IsKnown<R[K]> extends 1
      ? never
      : L[K]
    : L[K];
} extends infer P
  ? Join<P, R>
  : never;

export type ExtendListDeep<Dest, Extends> = Extends extends []
  ? Dest
  : Extends extends [infer Item, ...infer Rest]
  ? ExtendListDeep<Merge<Dest, Item>, Rest>
  : never;

export type ExtendList<Dest extends unknown[], Extends extends unknown[]> = [
  ...Dest,
  ...Extends
];

// https://fettblog.eu/typescript-union-to-intersection/
export type UnionToIntersection<T> = (
  T extends any ? (x: T) => any : never
) extends (x: infer R) => any
  ? {
      [K in keyof R]: R[K];
    }
  : never;

export type Simplify<T> = { [KeyType in keyof T]: T[KeyType] };

export type ArrayKeys<T> = T extends any[] | ReadonlyArray<any>
  ? T extends [any, ...infer Tail]
    ? ArrayKeys<Tail> | Tail['length']
    : never
  : never;

export type DeepArrayKeys<T extends any[]> = {
  [K in keyof T]: `${Extract<K, string>}.${ObjectDotNotations<T[K]>}`;
}[number];

export type ObjectDotNotations<
  Obj,
  Level extends string[] = [],
  Limit = 3
> = Level['length'] extends Limit
  ? never
  : Obj extends { [K: string]: any }
  ? {
      [K in keyof Obj]: K extends string
        ? Obj[K] extends { [K: string]: any }
          ? Obj[K] extends any[]
            ? K | `${K}.${ArrayKeys<Obj[K]>}` | `${K}.${DeepArrayKeys<Obj[K]>}`
            : K | `${K}.${ObjectDotNotations<Obj[K], [...Level, K]>}`
          : K
        : never; // not string (never))
    }[keyof Obj]
  : never;

export type TypeLike<T, Level extends ReadonlyArray<number> = [0]> = T extends {
  [K: string]: any;
}
  ? {
      [K in keyof T]: T[K] extends { [K: string]: any }
        ? Level['length'] extends 2
          ? any
          : T[K] extends AnyFunction
          ? AnyFunction
          : TypeLike<T[K], [...Level, 0]>
        : any;
    }
  : any;

export type IsKnown<T> = IsAny<T> extends true
  ? 0
  : IsNever<T> extends true
  ? 0
  : IsUnknown<T> extends true
  ? 0
  : 1;

export type BinKnown<T, True, False> = {
  0: False;
  1: True;
}[IsKnown<T>];

export type BinAny<T, True, False> = {
  0: False;
  1: True;
}[IsAny<T> extends true ? 0 : 1];
