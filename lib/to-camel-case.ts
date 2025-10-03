type SnakeToCamelCase<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamelCase<U>>}`
  : S;

type CamelizeKeys<T> = T extends readonly unknown[]
  ? { [K in keyof T]: CamelizeKeys<T[K]> }
  : T extends object
    ? {
        [K in keyof T as SnakeToCamelCase<K & string>]: CamelizeKeys<T[K]>;
      }
    : T;

/**
 * Converts snake_case keys to camelCase in an object or array of objects.
 *
 * @param {T} obj - The object, array, or string to convert. (required)
 * @returns {T} The converted object, array, or string.
 */
export const convertSnakeToCamelCase = <T>(obj: T): CamelizeKeys<T> => {
  if (Array.isArray(obj)) {
    return obj.map(item => convertSnakeToCamelCase(item)) as CamelizeKeys<T>;
  }

  if (obj !== null && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelCaseKey = toCamelCase(key);
      (acc as Record<string, unknown>)[camelCaseKey] = convertSnakeToCamelCase(
        (obj as Record<string, unknown>)[key],
      );
      return acc;
    }, {} as CamelizeKeys<T>);
  }

  return obj as CamelizeKeys<T>;
};

const toCamelCase = (str: string) => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};
