import { untrack } from '@glimmer/validator';
import { flushReactionQueue } from './reaction';
import { PropertyDescriptorWithInitializer } from './interfaces';

let TRANSACTION_COUNT = 0;

export function transaction<T>(fn: () => T, thisArg = undefined): T {
  try {
    TRANSACTION_COUNT++;
    return fn.apply(thisArg);
  } finally {
    TRANSACTION_COUNT--;

    if (TRANSACTION_COUNT === 0) {
      flushReactionQueue();
    }
  }
}

function executeAction<T extends Function>(fn: T, thisArg?: object | null, args?: unknown[]) {
  return transaction(() => {
    let ret;
    untrack(() => (ret = fn.apply(thisArg, ...args)));
    return ret;
  });
}

const ACTION_BRAND = Symbol();

function createAction<T extends Function>(name: string | symbol, fn: T): T {
  let action = function (...args: unknown[]) {
    return executeAction(fn, this, args);
  };

  action[ACTION_BRAND] = true;

  return (action as unknown) as T;
}

export function isAction(fn: Function) {
  return fn[ACTION_BRAND];
}

function namedActionDecorator(
  name: string | symbol
): MethodDecorator & PropertyDecorator {
  return (
    target: object,
    key: string | symbol,
    desc?: PropertyDescriptorWithInitializer
  ) => {
    let { value, initializer } = desc!;

    if (value !== undefined) {
      desc.value = createAction(name, value);
    } else if (initializer !== undefined) {
      desc.initializer = function() {
        return createAction(name, initializer.apply(this));
      }
    }
  };
}

export function action(
  target: object,
  key: string | symbol,
  desc?: PropertyDescriptorWithInitializer
): void;
export function action(name: string): MethodDecorator & PropertyDecorator;
export function action<T extends Function | null | undefined>(fn: T): T;
export function action<T extends Function | null | undefined>(
  name: string,
  fn: T
): T;
export function action<T extends Function | null | undefined>(
  targetOrNameOrFn: T | string,
  keyOrFn?: string | symbol | T,
  desc?: PropertyDescriptorWithInitializer
): (MethodDecorator & PropertyDecorator) | T | void {
  // action(fn() {})
  if (arguments.length === 1 && typeof targetOrNameOrFn === 'function') {
    return createAction(
      targetOrNameOrFn.name || '<unnamed action>',
      targetOrNameOrFn
    );
  }

  // action('name', fn() {})
  if (arguments.length === 2 && typeof keyOrFn === 'function') {
    return createAction(targetOrNameOrFn as string, keyOrFn);
  }

  // @action('name') fn() {}
  if (arguments.length === 1 && typeof targetOrNameOrFn === 'string') {
    return namedActionDecorator(targetOrNameOrFn);
  }

  // @action fn() {}
  namedActionDecorator(keyOrFn as string)(
    targetOrNameOrFn,
    keyOrFn as string,
    desc
  );
}

export function runInAction<T>(fn: () => T): T;
export function runInAction<T>(name: string, fn: () => T): T;
export function runInAction<T>(nameOrFn: string | (() => T), _fn?: () => T) {
    let actionName = typeof nameOrFn === 'string' ? nameOrFn : nameOrFn.name || '<unnamed action>';
    let fn = typeof nameOrFn === 'function' ? nameOrFn : _fn;

    return executeAction(fn, this);
}
