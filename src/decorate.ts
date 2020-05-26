export function applyDecorator(
  decorator: PropertyDecorator | MethodDecorator,
  obj: object,
  key: string | symbol
) {
  let desc = decorator(obj, key, Object.getOwnPropertyDescriptor(obj, key));

  if (desc !== undefined) {
    Object.defineProperty(obj, key, desc as PropertyDescriptor);
  }
}

export function decorate<T>(
  clazz: new (...args: any[]) => T,
  decorators: {
    [P in keyof T]?:
      | MethodDecorator
      | PropertyDecorator
      | Array<MethodDecorator>
      | Array<PropertyDecorator>;
  }
): void;
export function decorate<T>(
  object: T,
  decorators: {
    [P in keyof T]?:
      | MethodDecorator
      | PropertyDecorator
      | Array<MethodDecorator>
      | Array<PropertyDecorator>;
  }
): T;
export function decorate<T>(
  clazzOrObject: (new (...args: any[]) => T) | T,
  decorators: {
    [P in keyof T]?:
      | MethodDecorator
      | PropertyDecorator
      | Array<MethodDecorator>
      | Array<PropertyDecorator>;
  }
) {
  let target =
    typeof clazzOrObject === 'function'
      ? clazzOrObject.prototype
      : clazzOrObject;

  for (let key in decorators) {
    let decs = decorators[key];

    if (Array.isArray(decs)) {
      for (let dec of decs) {
        applyDecorator(dec, target, key);
      }
    } else {
      // TODO: Why doesn't this narrow?
      applyDecorator(decs as MethodDecorator, target, key);
    }
  }
}
