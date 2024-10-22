import { Model } from "../models/model";
import { SqlDataSource } from "../sql_data_source";

// Global list of function names that should have trx injected
const functionsToInject = ["processData", "subProcess"]; // Add function names here

// Decorator to handle transactional logic and inject `trx` recursively into listed functions
export function atomic(customConnection?: SqlDataSource) {
  const sqlDataSource = customConnection || SqlDataSource.getInstance();

  return async (
    _target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Ensure `this` is an instance of `Model`
      if (!(this instanceof Model)) {
        throw new Error(
          `The method ${propertyKey} must be called from an instance of Model`,
        );
      }

      // Create transaction
      const trx = await sqlDataSource.transaction();

      // Recursive proxy handler to inject trx into all listed functions and nested ones
      const handler = {
        apply: function (target: any, thisArg: any, argumentsList: any[]) {
          const lastArgIndex = argumentsList.length - 1;
          const lastArg = argumentsList[lastArgIndex];

          // Ensure the last argument is an object and inject `trx`
          if (typeof lastArg === "object" && lastArg !== null) {
            argumentsList[lastArgIndex] = {
              ...lastArg,
              trx: trx,
            };
          } else {
            // If the last argument isn't an object, append trx as a new argument
            argumentsList.push({ trx: trx });
          }

          // Apply the original function with modified arguments
          return target.apply(thisArg, argumentsList);
        },
      };

      // Recursive function to proxy only the listed functions
      function proxyListedFunctions(obj: any) {
        for (const key of Object.getOwnPropertyNames(
          Object.getPrototypeOf(obj),
        )) {
          const prop = obj[key];

          // Proxy only if the function name is in the global list
          if (typeof prop === "function" && functionsToInject.includes(key)) {
            // Apply proxy to the function itself
            obj[key] = new Proxy(prop, handler);

            // Recursively proxy functions within the function itself
            proxyListedFunctions(prop);
          }
        }
      }

      try {
        // Proxy only the listed functions in the current class context
        proxyListedFunctions(this);

        // Execute the original method
        const result = await originalMethod.apply(this, args);

        // Commit transaction on success
        await trx.commit();
        return result;
      } catch (error) {
        // Rollback transaction on error
        await trx.rollback();
        throw error;
      }
    };

    return descriptor;
  };
}
