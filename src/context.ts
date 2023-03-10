import { Honion } from "./honion";

type BuilderBagType = "singleton" | "scoped" | "transient";
type BuilderBagItem<T> = {
  key: string;
  builder: () => T;
  type: BuilderBagType;
  isBuilderBag: true;
};

const isPlainObject = (fn: any): fn is object => {
  if (typeof fn != "object") {
    return false;
  }
  const proto = Object.getPrototypeOf(fn);
  if (proto === null) {
    return true;
  }
  const ctor =
    Object.prototype.hasOwnProperty.call(proto, "constructor") &&
    proto.constructor;
  return (
    typeof ctor == "function" &&
    ctor instanceof ctor &&
    Function.prototype.toString.call(ctor) ==
      Function.prototype.toString.call(Object)
  );
};

export class Context {
  get logger() {
    return this.honion.logger;
  }
  set logger(val) {
    this.honion.logger = val;
  }

  readonly honion!: Honion;

  get #singletonBag() {
    const key = "@hal-wang/honion/singletonBag";
    const singletonBag: Record<string, any> = this.honion[key] ?? {};
    this.honion[key] = singletonBag;
    return singletonBag;
  }
  readonly #scopedBag: Record<string, any> = {};
  readonly #bag: Record<string, any> = {};

  public get<T>(key: string): T {
    if (key in this.#singletonBag) {
      return this.#getBagValue(key, this.#singletonBag[key]);
    } else if (key in this.#scopedBag) {
      return this.#getBagValue(key, this.#scopedBag[key]);
    } else {
      const result: BuilderBagItem<T> | T = this.#bag[key];
      return this.#getBagValue(key, result);
    }
  }

  public set<T>(key: string, value: T): this;
  public set<T>(key: string, type: BuilderBagType, builder: () => T): this;
  public set<T>(key: string, arg1?: any, arg2?: any): this | T {
    if (typeof arg2 != "undefined") {
      this.#bag[key] = <BuilderBagItem<T>>{
        type: arg1,
        builder: arg2,
        isBuilderBag: true,
      };
      return this;
    } else {
      this.#bag[key] = arg1;
      return this;
    }
  }

  public has(key: string): boolean {
    return key in this.#bag;
  }

  public delete(key: string): boolean {
    const hasKey = this.has(key);

    delete this.#bag[key];
    delete this.#singletonBag[key];
    delete this.#scopedBag[key];

    return hasKey;
  }

  public get length() {
    return Object.keys(this.#bag).length;
  }

  #getBagValue<T>(key: string, result: BuilderBagItem<T> | T) {
    if (isPlainObject(result) && result.isBuilderBag) {
      if (result.type == "transient") {
        return result.builder();
      } else {
        let dict: Record<string, any>;
        if (result.type == "singleton") {
          dict = this.#singletonBag;
        } else {
          dict = this.#scopedBag;
        }

        if (!(key in dict)) {
          dict[key] = result.builder();
        }
        return dict[key];
      }
    } else {
      return result as T;
    }
  }

  readonly errorStack: any[] = [];
  public catchError(err: Error | any): this {
    this.errorStack.push(err);
    return this;
  }
}
