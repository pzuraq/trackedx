import { createCache, getValue, untrack, Cache } from '@glimmer/validator';

const REACTION_QUEUE: Set<Cache> = new Set();

export function autorun(fn: () => void, options) {
  let cache = createCache(fn);

  REACTION_QUEUE.add(cache);

  return () => REACTION_QUEUE.delete(cache);
}

export function reaction<T>(trackFn: () => T, effectFn: (data: T) => void, options) {
  let cache = createCache(() => {
    let data = trackFn();

    untrack(() => effectFn(data));
  });

  REACTION_QUEUE.add(cache);

  return () => REACTION_QUEUE.delete(cache);
}

export interface IWhenOptions {
  name?: string
  timeout?: number
  /**
   * Experimental.
   * Warns if the view doesn't track observables
   */
  requiresObservable?: boolean
  onError?: (error: any) => void
}

export interface IReactionDisposer {
  (): void
}

export type PromiseWithCancel<T> = Promise<T> & { cancel(): void };


export function when(
  predicate: () => boolean,
  opts?: IWhenOptions
): PromiseWithCancel<void>
export function when(
  predicate: () => boolean,
  effect: () => void,
  opts?: IWhenOptions
): IReactionDisposer
export function when(
  predicate: () => boolean,
  optsOrEffect?: (() => void) | IWhenOptions,
  opts?: IWhenOptions
): PromiseWithCancel<void> | IReactionDisposer {
  if (arguments.length === 1 || (optsOrEffect && typeof optsOrEffect === 'object')) {
    return whenPromise(predicate, optsOrEffect as IWhenOptions);
  }

  return _when(predicate, optsOrEffect as () => void, opts)
}

function whenPromise(predicate: () => boolean, opts?: IWhenOptions): PromiseWithCancel<void> {
  let cache;
  let cancel;
  let destructor = () => REACTION_QUEUE.delete(cache);

  let promise = new Promise((resolve, reject) => {
    cache = createCache(() => {
      if (predicate()) {
        destructor();
        resolve
      }
    });

    REACTION_QUEUE.add(cache);

    cancel = () => {
      destructor();
      reject('WHEN_CANCELLED');
    };
  }) as any;

  promise.cancel = cancel;

  return promise;
}

function _when(predicate: () => boolean, effect: () => void, opts?: IWhenOptions) {
  let cache;
  let destructor = () => REACTION_QUEUE.delete(cache);

  cache = createCache(() => {
    if (predicate()) {
      destructor();
      effect();
    }
  });

  REACTION_QUEUE.add(cache);

  return () => destructor();
}

export function flushReactionQueue() {
  for (let cache of REACTION_QUEUE) {
    getValue(cache);
  }
}
