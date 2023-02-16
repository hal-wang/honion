import { Context } from "./context";
import { BaseLogger, ILogger } from "./logger";
import {
  Middleware,
  MdHook,
  HookMiddleware,
  HookType,
  MiddlewareItem,
  invokeMiddlewares,
  MiddlewareConstructor,
} from "./middlewares";
import {
  initContainer,
  MiddlewareContainer,
} from "./middlewares/middleware-container";

export abstract class Honion {
  constructor() {
    initContainer(this, this.#mds);
  }

  readonly #mds: MiddlewareItem[] = [];

  hook<T extends Middleware = Middleware>(
    type: HookType.Constructor,
    mh: (
      ctx: Context,
      middlewareConstructor: MiddlewareConstructor<T>
    ) => T | undefined
  ): this;
  hook<T extends Middleware = Middleware>(
    type: HookType.Constructor,
    mh: (
      ctx: Context,
      middlewareConstructor: MiddlewareConstructor<T>
    ) => Promise<T | undefined>
  ): this;

  hook<T extends Error = Error>(
    type: HookType.Error,
    mh: (ctx: Context, middleware: Middleware, error: T) => boolean
  ): this;
  hook<T extends Error = Error>(
    type: HookType.Error,
    mh: (ctx: Context, middleware: Middleware, error: T) => Promise<boolean>
  ): this;

  hook<T extends Middleware = Middleware>(
    type: HookType.BeforeInvoke | HookType.BeforeNext,
    mh: (ctx: Context, middleware: T) => boolean | void
  ): this;
  hook<T extends Middleware = Middleware>(
    type: HookType.BeforeInvoke | HookType.BeforeNext,
    mh: (ctx: Context, middleware: T) => Promise<boolean | void>
  ): this;

  hook<T extends Middleware = Middleware>(
    type: HookType.AfterInvoke,
    mh: (ctx: Context, middleware: T) => void
  ): this;
  hook<T extends Middleware = Middleware>(
    type: HookType.AfterInvoke,
    mh: (ctx: Context, middleware: T) => Promise<void>
  ): this;

  hook<T extends Middleware = Middleware>(
    mh: (ctx: Context, middleware: T) => void
  ): this;
  hook<T extends Middleware = Middleware>(
    mh: (ctx: Context, middleware: T) => Promise<void>
  ): this;

  hook(arg1: MdHook | HookType, arg2?: MdHook | HookType): this {
    let mh: MdHook;
    let type: HookType;

    if (typeof arg1 == "function") {
      mh = arg1;
      type = HookType.BeforeInvoke;
    } else {
      type = arg1;
      mh = arg2 as MdHook;
    }
    this.#mds.push(() => new HookMiddleware(mh, type));

    return this;
  }

  protected async invoke(ctx?: Context): Promise<Context> {
    ctx = ctx ?? new Context();
    Object.defineProperty(ctx, "honion", {
      configurable: true,
      get: () => this,
    });
    if (!this.#mds.length) {
      return ctx;
    }

    try {
      await invokeMiddlewares(ctx, this.#mds);
    } catch (err) {
      ctx.catchError(err);
    }
    return ctx;
  }

  logger: ILogger = new BaseLogger();
  setLogger(logger: ILogger) {
    this.logger = logger;
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Honion extends MiddlewareContainer {}
