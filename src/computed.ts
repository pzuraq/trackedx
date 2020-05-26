import { createCache, getValue, Cache } from '@glimmer/validator';

function defaultSetter(value: unknown) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(
      `Attempted to set a value a computed to a new value, ${String(
        value
      )} but it didn't have a setter`
    );
  }
}

class Computed<T> {
  private _cache: Cache<T>;
  public set: (value: T) => void;

  constructor(get: () => T, set: (value: T) => void) {
    this._cache = createCache(get);
    this.set = set;
  }

  get(): T {
    return getValue(this._cache);
  }
}

const CACHES = new WeakMap();

function memoize<T>(fn: () => T): () => T {
  return function () {
    let cache = CACHES.get(this);

    if (cache === undefined) {
      cache = createCache(fn.bind(this));
      CACHES.set(this, cache);
    }

    return getValue(cache);
  };
}

export interface ComputedConfig<T> {
  get?: () => T;
  set?: (value: T) => void;
  name?: string;
  equals?: () => boolean;
  context?: any;
  requiresReaction?: boolean;
  keepAlive?: boolean;
}

const COMPUTED_PROPS = Symbol();

function computedDecorator(
  get: () => any,
  set: (value: any) => void
): MethodDecorator & PropertyDecorator {
  return (target: object, key: string | symbol, desc?: PropertyDescriptor) => {
    let props = (target[COMPUTED_PROPS] =
      target[COMPUTED_PROPS] || Object.create(null));
    props[key] = true;

    return {
      get: memoize(get),
      set: set,
    };
  };
}

export function computed(
  target: object,
  key: string | symbol,
  desc: PropertyDescriptor
): PropertyDescriptor;
export function computed<T>(get: () => T, set: (value: T) => void): Computed<T>;
export function computed<T>(
  get: () => T,
  config?: ComputedConfig<T>
): Computed<T>;
export function computed<T>(
  config: ComputedConfig<T>
): MethodDecorator & PropertyDecorator;
export function computed<T>(
  targetOrGetterOrConfig: ComputedConfig<T> | (() => T),
  keyOrSetterOrConfig?:
    | string
    | symbol
    | ((value: T) => void)
    | ComputedConfig<T>,
  desc?: PropertyDescriptor
): Computed<T> | PropertyDescriptor | (MethodDecorator & PropertyDecorator) {
  if (arguments.length === 3) {
    return computedDecorator(desc.get, desc.set)(
      targetOrGetterOrConfig,
      keyOrSetterOrConfig as string,
      desc
    ) as PropertyDescriptor;
  }

  if (typeof targetOrGetterOrConfig === 'function') {
    let get = targetOrGetterOrConfig;
    let set =
      typeof keyOrSetterOrConfig === 'function'
        ? keyOrSetterOrConfig
        : defaultSetter;

    return new Computed(get, set);
  }

  return (
    target: object,
    key: string | symbol,
    desc?: PropertyDescriptor | undefined
  ): PropertyDescriptor => {
    let get = targetOrGetterOrConfig.get || desc?.get;
    let set = targetOrGetterOrConfig.set || desc?.set;

    return { get: memoize(get), set };
  };
}

export function isComputed(obj: unknown) {
  return obj instanceof Computed;
}

export function isComputedProp(obj: unknown, key: string | symbol) {
  return obj[COMPUTED_PROPS][key];
}
