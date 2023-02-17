import { Context } from "../context";
import { Middleware } from "./middleware";

type builderType =
  | ((ctx: Context, next: () => Promise<void>) => void)
  | ((ctx: Context, next: () => Promise<void>) => Promise<void>);

export class LambdaMiddleware<
  TC extends Context = Context
> extends Middleware<TC> {
  constructor(builder: builderType) {
    super();
    this.#builder = builder;
  }

  #builder: builderType;

  async invoke(): Promise<void> {
    await this.#builder(this.ctx, this.next.bind(this));
  }
}
