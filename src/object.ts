export function keys(obj) {
  if (typeof obj.keys === 'function') {
    return obj.keys();
  }

  return Object.keys(obj);
}

export function values(obj) {
  if (typeof obj.values === 'function') {
    return obj.values();
  }

  return Object.values(obj);
}

export function entries(obj) {
  if (typeof obj.entries === 'function') {
    return obj.entries();
  }

  return Object.entries(obj);
}
