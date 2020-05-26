export interface PropertyDescriptorWithInitializer extends PropertyDescriptor {
  initializer?: () => unknown;
}
