import { createTag, consumeTag, dirtyTag } from '@glimmer/validator';
import {
  createTrackedDeep,
  deepTrackedObject,
  deepTrackedArray,
  deepTrackedMap,
  deepTrackedSet,
  isTrackedObject,
  isTrackedArray,
  isTrackedMap,
  isTrackedSet,
} from 'tracked-deep/addon/-private';

enum ObservablePropType {
  Deep = 0,
  Shallow = 1,
  Ref = 2,
}

function makeObservable(value: unknown, type: ObservablePropType) {
  if (type === ObservablePropType.Ref) {
    return value;
  }

  return createTrackedDeep(value, false, type === ObservablePropType.Shallow);
}

const OBSERVABLE_PROPS = Symbol();

function decorateObservableProp<T>(
  type: ObservablePropType,
  target: object,
  key: string | symbol,
  initializer?: () => T
) {
  let props = target[OBSERVABLE_PROPS] = target[OBSERVABLE_PROPS] || {};
  props[key] = true;

  let values = new WeakMap();
  let tags = new WeakMap();

  return {
    get() {
      if (initializer !== undefined && !values.has(this)) {
        values.set(this, makeObservable(initializer(), type));
      }

      let tag = tags.get(this);

      if (tag === undefined) {
        tag = createTag();
        tags.set(this, tag);
      }

      consumeTag(tag);
      return values.get(this);
    },

    set(value: T) {
      values.set(this, makeObservable(value, type));

      let tag = tags.get(this);

      if (tag !== undefined) {
        dirtyTag(tag);
      }
    },
  };
}

export function observable(
  target: object,
  key: string | symbol
): PropertyDescriptor;
export function observable<T>(obj: T): T;
export function observable<T>(
  objOrTarget: object | T,
  key?: string | symbol,
  desc?: { initializer?: () => T }
): T | PropertyDescriptor {
  if (arguments.length > 1) {
    return decorateObservableProp(
      ObservablePropType.Deep,
      objOrTarget as object,
      key,
      desc?.initializer
    );
  }

  return createTrackedDeep(objOrTarget);
}

observable.deep = observable;

observable.shallow = <T>(
  target: object,
  key: string | symbol,
  desc?: { initializer?: () => T }
): PropertyDescriptor => {
  return decorateObservableProp(
    ObservablePropType.Shallow,
    target,
    key,
    desc?.initializer
  );
};

observable.ref = <T>(
  target: object,
  key: string | symbol,
  desc?: { initializer?: () => T }
): PropertyDescriptor => {
  return decorateObservableProp(
    ObservablePropType.Ref,
    target,
    key,
    desc?.initializer
  );
};

class Box {
  constructor(initialValue) {
    this._v = initialValue;
  }

  _v;
  _t = createTag();

  get() {
    consumeTag(this._t);
    return this._v;
  }

  set(value) {
    this._v = value;
    dirtyTag(this._t);
  }
}

observable.box = (value) => new Box(value);

observable.object = (obj, decorators, { deep = true }) => {
  if (process.env.NODE_ENV !== 'production') {
    let prototype = Object.getPrototypeOf(obj);

    if (prototype === null || prototype === Object.prototype) {
      throw new Error('could not make object');
    }
  }

  return deepTrackedObject(obj, !deep);
};

observable.array = (obj, { deep = true }) => {
  if (process.env.NODE_ENV !== 'production' && !Array.isArray(obj)) {
    throw new Error('could not make array');
  }

  return deepTrackedArray(obj, !deep);
};

observable.map = (obj, { deep = true }) => {
  if (Array.isArray(obj) || obj instanceof Map) {
    return deepTrackedMap(obj);
  }

  if (process.env.NODE_ENV !== 'production') {
    let prototype = Object.getPrototypeOf(obj);

    if (prototype === null || prototype === Object.prototype) {
      throw new Error('could not make map');
    }
  }

  return deepTrackedMap(Object.entries(obj), !deep);
};

observable.set = (obj, { deep = true }) => {
  if (
    process.env.NODE_ENV !== 'production' &&
    !Array.isArray(obj) &&
    !(obj instanceof Set)
  ) {
    throw new Error('could not make set');
  }

  return deepTrackedSet(obj, !deep);
};

export function isObservable(obj) {
  return (
    isTrackedMap(obj) ||
    isTrackedSet(obj) ||
    isTrackedObject(obj) ||
    isTrackedArray(obj)
  );
}

export const isObservableObject = isTrackedObject;
export const isObservableArray = isTrackedArray;
export const isObservableMap = isTrackedMap;
export const isObservableSet = isTrackedSet;

export function isBoxedObservable(obj: unknown) {
  return obj instanceof Box;
}

export function isObservableProp(obj: object, key: string | number | symbol) {
  if (process.env.NODE_ENV !== 'production') {
    if (isTrackedArray(obj) || isTrackedMap(obj) || isTrackedSet(obj)) {
      throw new Error(
        'isObservable(object, propertyName) is not supported for arrays, maps, and sets. Use map.has, set.has, or array.length instead'
      );
    }
  }

  if (isTrackedObject(obj)) return true;

  return obj[OBSERVABLE_PROPS][key];
}
