export function expose(label, value) {
  if (value === undefined) {
    value = label;
    label = 'exposed';
  }

  window[label] = value;
  console.log('Exposing to global scope:');
  console.log(`window.${label} =`, value);
}