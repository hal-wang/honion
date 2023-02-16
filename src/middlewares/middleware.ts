import { Context } from "../context";
import { HonionException } from "../exception";
import { execHooks, HookType } from "./hook.middleware";
import { LambdaMiddleware } from "./lambda.middleware";

export type MiddlewareConstructor<T extends Middleware = Middleware> = {
  new (...args: any[]): T;
};
function isMiddlewareConstructor<T extends Middleware = Middleware>(
  md: any
): md is MiddlewareConstructor<T> {
  return !!md.prototype;
}
function isMdClass<T extends Middleware = Middleware>(
  val: any
): val is MiddlewareConstructor<T> {
  return (
    typeof val == "function" &&
    /^class\s/.test(Function.prototype.toString.call(val))
  );
}

export type MiddlewareItem =
  | LambdaMiddleware
  | ((ctx: Context) => Middleware)
  | [(ctx: Context) => Middleware, MiddlewareConstructor]
  | ((ctx: Context) => Promise<Middleware>)
  | [(ctx: Context) => Promise<Middleware>, MiddlewareConstructor]
  | ((ctx: Context) => MiddlewareConstructor)
  | [(ctx: Context) => MiddlewareConstructor, MiddlewareConstructor]
  | ((ctx: Context) => Promise<MiddlewareConstructor>)
  | Middleware
  | MiddlewareConstructor;

export async function createMiddleware(
  ctx: Context,
  middleware: MiddlewareItem
): Promise<Middleware> {
  if (middleware instanceof Middleware) {
    return middleware;
  } else if (isMiddlewareConstructor(middleware)) {
    return await execHooks(ctx, middleware, HookType.Constructor);
  } else if (Array.isArray(middleware)) {
    return createMiddleware(ctx, await middleware[0](ctx));
  } else {
    return createMiddleware(ctx, await middleware(ctx));
  }
}

export abstract class Middleware {
  #index!: number;
  #mds!: readonly MiddlewareItem[];

  #ctx!: Context;
  public get ctx(): Context {
    return this.#ctx;
  }

  get logger() {
    return this.ctx.logger;
  }
  set logger(val) {
    this.ctx.logger = val;
  }

  public isPrevInstanceOf<T extends Middleware = Middleware>(
    target: MiddlewareConstructor<T>
  ): target is MiddlewareConstructor<T> {
    const prevMd = this.#mds[this.#index - 1];
    return this.#isInstanceOf(prevMd, target);
  }

  public isNextInstanceOf<T extends Middleware = Middleware>(
    target: MiddlewareConstructor<T>
  ): target is MiddlewareConstructor<T> {
    const nextMd = this.#mds[this.#index + 1];
    return this.#isInstanceOf(nextMd, target);
  }

  #isInstanceOf<T extends Middleware = Middleware>(
    md: MiddlewareItem | undefined,
    target: MiddlewareConstructor<T>
  ) {
    if (!md) return false;
    if (md == target) return true;
    if (Array.isArray(md)) {
      return md[1] == target || md[1].prototype instanceof target;
    } else if (isMdClass(md)) {
      return md.prototype instanceof target;
    } else {
      return md instanceof target;
    }
  }

  abstract invoke(): void | Promise<void>;
  protected async next(): Promise<void> {
    let nextMd: Middleware | undefined = undefined;
    try {
      if (false == (await execHooks(this.ctx, this, HookType.BeforeNext))) {
        return;
      }
      if (this.#mds.length <= this.#index + 1) return;
      nextMd = await this.#createNextMiddleware();
      nextMd.init(this.ctx, this.#index + 1, this.#mds);
      if (false == (await execHooks(this.ctx, nextMd, HookType.BeforeInvoke))) {
        return;
      }
      await nextMd.invoke();
      await execHooks(this.ctx, nextMd, HookType.AfterInvoke);
    } catch (err) {
      const error = err as HonionException;
      if ("breakthrough" in error && error.breakthrough) {
        throw err;
      } else {
        const hookResult = await execHooks(
          this.ctx,
          nextMd ?? this,
          HookType.Error,
          error
        );
        if (!hookResult) {
          this.ctx.catchError(err);
        }
      }
    }
  }

  #createNextMiddleware = async (): Promise<Middleware> => {
    const middleware = this.#mds[this.#index + 1];
    return await createMiddleware(this.ctx, middleware);
  };

  private init(
    ctx: Context,
    index: number,
    mds: readonly MiddlewareItem[]
  ): this {
    this.#mds = mds;
    this.#ctx = ctx;
    this.#index = index;
    return this;
  }
}

export async function invokeMiddlewares(ctx: Context, mds: MiddlewareItem[]) {
  const md = await createMiddleware(ctx, mds[0]);
  await (md as any).init(ctx, 0, mds).invoke();
}
