import * as schema from "./schema";

/**
 * Forces TypeScript to expand types for better autocomplete
 */
type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Helpers to infer Drizzle select/insert types
 */
type InferSelect<T> = T extends { $inferSelect: infer R } ? Prettify<R> : never;
type InferInsert<T> = T extends { $inferInsert: infer R } ? Prettify<R> : never;
type InferUpdate<T> = T extends { $inferInsert: infer R }
  ? Prettify<Partial<R>>
  : never;

type InferSelectTables<T> = {
  [K in keyof T as T[K] extends { $inferSelect: unknown }
    ? K
    : never]: InferSelect<T[K]>;
};

type InferInsertTables<T> = {
  [K in keyof T as T[K] extends { $inferInsert: unknown }
    ? K
    : never]: InferInsert<T[K]>;
};

type InferUpdateTables<T> = {
  [K in keyof T as T[K] extends { $inferInsert: unknown }
    ? K
    : never]: InferUpdate<T[K]>;
};

/**
 * ✅ Main exported mapped types
 */
export type DBTables = InferSelectTables<typeof schema>;
export type DBInsertTables = InferInsertTables<typeof schema>;
export type DBUpdateTables = InferUpdateTables<typeof schema>;
export type TableName = keyof DBTables;

/**
 * Drizzle pgEnum shape
 */
type AnyPgEnum = {
  enumValues: readonly string[];
};

/**
 * Infer enum value union
 */
type InferEnum<T> = T extends { enumValues: readonly (infer V)[] } ? V : never;

/**
 * Map exported pgEnums
 */
type InferEnums<T> = {
  [K in keyof T as T[K] extends AnyPgEnum ? K : never]: InferEnum<T[K]>;
};

export type DBEnums = InferEnums<typeof schema>;
