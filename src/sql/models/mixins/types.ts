import type { Model } from "../model";

export type Constructor<T = Model> = new (...args: any[]) => T;
export type AbstractConstructor<T = Model> = abstract new (...args: any[]) => T;

export type AnyConstructor<T = Model> = Constructor<T> | AbstractConstructor<T>;
