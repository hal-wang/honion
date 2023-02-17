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

export abstract class Honion<TC extends Context = Context> {
  constructor() {
    initContainer(this, this.#mds);
  }

  readonly #mds: MiddlewareItem[] = [];

  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.Constructor,
    mh: (
      ctx: TC,
      middlewareConstructor: MiddlewareConstructor<TC, TM>
    ) => TM | undefined
  ): this;
  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.Constructor,
    mh: (
      ctx: TC,
      middlewareConstructor: MiddlewareConstructor<TC, TM>
    ) => Promise<TM | undefined>
  ): this;

  hook<TE extends Error = Error>(
    type: HookType.Error,
    mh: (ctx: TC, middleware: Middleware<TC>, error: TE) => boolean
  ): this;
  hook<TE extends Error = Error>(
    type: HookType.Error,
    mh: (ctx: TC, middleware: Middleware<TC>, error: TE) => Promise<boolean>
  ): this;

  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.BeforeInvoke | HookType.BeforeNext,
    mh: (ctx: TC, middleware: TM) => boolean | void
  ): this;
  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.BeforeInvoke | HookType.BeforeNext,
    mh: (ctx: TC, middleware: TM) => Promise<boolean | void>
  ): this;

  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.AfterInvoke,
    mh: (ctx: TC, middleware: TM) => void
  ): this;
  hook<TM extends Middleware<TC> = Middleware<TC>>(
    type: HookType.AfterInvoke,
    mh: (ctx: TC, middleware: TM) => Promise<void>
  ): this;

  hook<TM extends Middleware<TC> = Middleware<TC>>(
    mh: (ctx: TC, middleware: TM) => void
  ): this;
  hook<TM extends Middleware<TC> = Middleware<TC>>(
    mh: (ctx: TC, middleware: TM) => Promise<void>
  ): this;

  hook<TM extends Middleware<TC> = Middleware<TC>>(
    arg1: MdHook<TC, TM> | HookType,
    arg2?: MdHook<TC, TM> | HookType
  ): this {
    let mh: MdHook<TC, TM>;
    let type: HookType;

    if (typeof arg1 == "function") {
      mh = arg1;
      type = HookType.BeforeInvoke;
    } else {
      type = arg1;
      mh = arg2 as MdHook<TC, TM>;
    }
    this.#mds.push(() => new HookMiddleware(mh, type));

    return this;
  }

  protected async invoke(ctx?: TC): Promise<TC> {
    ctx = ctx ?? (new Context() as TC);
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
export interface Honion<TC extends Context = Context>
  extends MiddlewareContainer<TC> {}
