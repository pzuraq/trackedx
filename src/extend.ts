import { observable } from './observable';
import { decorate } from './decorate';

const { ref } = observable;

export function extendObservable(obj, props, decorators, opts) {
  for (let prop in props) {
    let value = props[prop];
    ref(obj, prop, { initializer: () => value });
  }

  decorate(obj, decorators);
}
