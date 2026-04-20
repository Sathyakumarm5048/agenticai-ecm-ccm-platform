export const isDefined = <T>(value: T | null | undefined): value is T => {
  return value !== null && value !== undefined;
};

export const isEmpty = (value: any): boolean => {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
};

export const safeGet = <T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | null => {
  return obj ? obj[key] : null;
};