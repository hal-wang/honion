import { Context } from "../context";
import { LambdaMiddleware } from "./lambda.middleware";
import {
  Middleware,
  MiddlewareConstructor,
  MiddlewareItem,
} from "./middleware";

export interface MiddlewareContainer {
  use(lambda: (ctx: Context, next: () => Promise<void>) => Promise<void>): this;
  use(lambda: (ctx: Context, next: () => Promise<void>) => void): this;

  add(
    builder: (ctx: Context) => Middleware,
    type?: MiddlewareConstructor
  ): this;
  add(
    builder: (ctx: Context) => Promise<Middleware>,
    type?: MiddlewareConstructor
  ): this;
  add(
    builder: (ctx: Context) => MiddlewareConstructor,
    type?: MiddlewareConstructor
  ): this;
  add(
    builder: (ctx: Context) => Promise<MiddlewareConstructor>,
    type?: MiddlewareConstructor
  ): this;
  add(md: Middleware): this;
  add(md: MiddlewareConstructor): this;
}

export function initContainer(
  container: MiddlewareContainer,
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
