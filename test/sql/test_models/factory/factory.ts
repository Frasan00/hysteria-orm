import { FactoryReturnType } from "./factory_types";

export interface BaseModel {
  insert: (data: any) => Promise<any>;
  insertMany: (data: any[]) => Promise<any[]>;
}

export interface FactoryOptions<T> {
  defaultData?: Partial<T>;
  generateData?: () => Partial<T>;
}

export class Factory<T, M extends BaseModel> {
  private defaultData: Partial<T>;
  private generateData: () => Partial<T>;

  constructor(options: FactoryOptions<T> = {}) {
    this.defaultData = options.defaultData || {};
    this.generateData = options.generateData || (() => ({}));
  }

  async create<N extends number>(
    howMany: N,
    model: M,
    overrides: Partial<T> = {},
  ): Promise<FactoryReturnType<N, T>> {
    const baseData = {
      ...this.defaultData,
      ...this.generateData(),
      ...overrides,
    };

    if (howMany === 1) {
      return model.insert(baseData) as FactoryReturnType<N, T>;
    }

    const array = Array.from({ length: howMany });
    return model.insertMany(
      array.map(() => ({
        ...this.defaultData,
        ...this.generateData(),
        ...overrides,
      })),
    ) as FactoryReturnType<N, T>;
  }

  withDefaults(data: Partial<T>): this {
    this.defaultData = { ...this.defaultData, ...data };
    return this;
  }

  withGenerator(generator: () => Partial<T>): this {
    this.generateData = generator;
    return this;
  }
}
