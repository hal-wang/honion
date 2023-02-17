import { Context } from "../context";
import { HonionException } from "../exception";
import { execHooks, HookType } from "./hook.middleware";
import { LambdaMiddleware } from "./lambda.middleware";

export type MiddlewareConstructor<
  TC extends Context = Context,
  TM extends Middleware<TC> = Middleware<TC>
> = {
  new (...args: any[]): TM;
};
function isMiddlewareConstructor<TC extends Context>(
  md: any
): md is MiddlewareConstructor<TC> {
  return !!md.prototype;
}
function isMdClass<TC extends Context>(
  val: any
): val is MiddlewareConstructor<TC> {
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

export abstract class Middleware<TC extends Context = Context> {
  #index!: number;
  #mds!: readonly MiddlewareItem[];

  #ctx!: TC;
  public get ctx(): TC {
    return this.#ctx;
  }

  get logger() {
    return this.ctx.logger;
  }
  set logger(val) {
    this.ctx.logger = val;
  }

  public isPrevInstanceOf<TM extends Middleware<TC> = Middleware<TC>>(
    target: MiddlewareConstructor<TC, TM>
  ): target is MiddlewareConstructor<TC, TM> {
    const prevMd = this.#mds[this.#index - 1];
    return this.#isInstanceOf(prevMd, target);
  }

  public isNextInstanceOf<TM extends Middleware<TC> = Middleware<TC>>(
    target: MiddlewareConstructor<TC, TM>
  ): target is MiddlewareConstructor<TC, TM> {
    const nextMd = this.#mds[this.#index + 1];
    return this.#isInstanceOf(nextMd, target);
  }

  #isInstanceOf<TM extends Middleware<TC> = Middleware<TC>>(
    md: MiddlewareItem | undefined,
    target: MiddlewareConstructor<TC, TM>
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

  private init(ctx: TC, index: number, mds: readonly MiddlewareItem[]): this {
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
