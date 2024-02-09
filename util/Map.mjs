// Helper functions for treating JS objects
// like maps/dictionaries.

/**
 * @param {object} obj 
 * @returns {boolean} True if the object has any keys, and false otherwise.
 */
export function hasAnyKeys(obj) {
  return Object.keys(obj).some(() => true);
}