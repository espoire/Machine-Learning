/** Enhanced debugging log statement.
 * Exposes a value to the global scope,
 * and prints a message notifying a
 * power user that this variable is
 * available.
 * 
 * @param {string | any} label
 * @param {any} [value]
 *  If provided, this value will be
 *    exposed to the global scope, and
 *    the global variable's name will
 *    be the first parameter's value.
 *  Otherwise, the first parameter
 *    will be exposed to the global
 *    scope, and the global variable's
 *    name will be "exposed".
 */
export function expose(label, value) {
  if (value === undefined) {
    value = label;
    label = 'exposed';
  }

  window[label] = value;
  console.log('Exposing to global scope:');
  console.log(`window.${label} =`, value);
}