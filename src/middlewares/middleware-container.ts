import { Context } from "../context";
import { LambdaMiddleware } from "./lambda.middleware";
import {
  Middleware,
  MiddlewareConstructor,
  MiddlewareItem,
} from "./middleware";

export interface MiddlewareContainer<TC extends Context> {
  use(lambda: (ctx: TC, next: () => Promise<void>) => Promise<void>): this;
  use(lambda: (ctx: TC, next: () => Promise<void>) => void): this;

  add<TM extends Middleware<TC>>(
    builder: (ctx: TC) => Middleware<TC>,
    type?: MiddlewareConstructor<TC, TM>
  ): this;
  add<TM extends Middleware<TC>>(
    builder: (ctx: TC) => Promise<Middleware<TC>>,
    type?: MiddlewareConstructor<TC, TM>
  ): this;
  add<TM extends Middleware<TC>>(
    builder: (ctx: TC) => MiddlewareConstructor<TC, TM>,
    type?: MiddlewareConstructor<TC, TM>
  ): this;
  add<TM extends Middleware<TC>>(
    builder: (ctx: TC) => Promise<MiddlewareConstructor<TC, TM>>,
    type?: MiddlewareConstructor<TC, TM>
  ): this;
  add(md: Middleware<TC>): this;
  add<TM extends Middleware<TC>>(md: MiddlewareConstructor<TC, TM>): this;
}

export function initContainer(
  container: MiddlewareContainer<any>,
  mds: MiddlewareItem[]
) {
  container.use = (
    lambda:
      | ((ctx: Context, next: () => Promise<void>) => void)
      | ((ctx: Context, next: () => Promise<void>) => Promise<void>)
  ) => {
    mds.push(() => new LambdaMiddleware(lambda));
    return container;
  };
  container.add = (
    md:
      | ((ctx: Context) => Middleware)
      | ((ctx: Context) => Promise<Middleware>)
      | ((ctx: Context) => MiddlewareConstructor)
      | ((ctx: Context) => Promise<MiddlewareConstructor>)
      | Middleware
      | MiddlewareConstructor,
    type?: MiddlewareConstructor
  ) => {
    if (type) {
      mds.push([md as any, type]);
    } else {
      mds.push(md);
    }
    return container;
  };
}
