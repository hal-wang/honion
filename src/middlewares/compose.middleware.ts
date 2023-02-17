import { Context } from "../context";
import { LambdaMiddleware } from "./lambda.middleware";
import { Middleware, MiddlewareItem, invokeMiddlewares } from "./middleware";
import { initContainer, MiddlewareContainer } from "./middleware-container";

export class ComposeMiddleware<
  TC extends Context = Context
> extends Middleware<TC> {
  constructor(
    private readonly enable?: (ctx: TC) => boolean | Promise<boolean>
  ) {
    super();
    initContainer(this, this.#mds);
  }

  readonly #mds: MiddlewareItem[] = [];

  async invoke(): Promise<void> {
    if (this.enable && !(await this.enable(this.ctx))) {
      await this.next();
      return;
    }

    const mds: MiddlewareItem[] = [
      ...this.#mds,
      new LambdaMiddleware(async () => {
        await this.next();
      }),
    ];
    await invokeMiddlewares(this.ctx, mds);
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ComposeMiddleware<TC extends Context = Context>
  extends MiddlewareContainer<TC> {}
