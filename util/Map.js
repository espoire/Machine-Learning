export function hasAnyKeys(obj) {
  return Object.keys(obj).some(() => true);
}