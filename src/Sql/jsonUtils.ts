export function isNestedObject(value: any): boolean {
  return (
    typeof value === "object" &&
    !Array.isArray(value) &&
    value !== null &&
    Object.keys(value).length > 0
  );
}
