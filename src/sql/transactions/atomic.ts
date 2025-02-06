import { Model, SqlDataSource } from "../.."

const allowedMethods = Object.getOwnPropertyNames(Model)
.filter(prop => typeof (Model as any)[prop] === 'function');

console.log(allowedMethods)

export default function atomic(customConnection: SqlDataSource = SqlDataSource.getInstance()): MethodDecorator {
  return (_target: Object, _propertyKey: string | symbol, descriptor: any) => {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const trx = await customConnection.beginTransaction();

      const isModelInstance = this instanceof Model;

      const proxy = new Proxy(this, {
        get: (target, prop, receiver) => {
          const original = Reflect.get(target, prop, receiver);
          if (typeof original === 'function') {
            if (isModelInstance && allowedMethods.includes(prop as string)) {
              return function (...fnArgs: any[]) {
                // @ts-ignore
                return original.apply(this, [...fnArgs, { trx }]);
              };
            } else {
              return original.bind(this);
            }
          }
          return original;
        }
      });

      const methodName = _propertyKey.toString();
      const newArgs = (isModelInstance && allowedMethods.includes(methodName)) ? [...args, { trx }] : args;

      try {
        const result = await originalMethod.apply(proxy, newArgs);
        await trx.commit();
        return result;
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    };

    return descriptor;
  }
}
