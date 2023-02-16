import { Middleware } from "../../src";
import { TestHonion } from "../test-honion";

test("middleware pipeline", async () => {
  const honion = new TestHonion().add(new Md());

  let ctx = await honion.run();
  expect(ctx.get("num")).toBe(1);
  ctx = await honion.run();
  expect(ctx.get("num")).toBe(2);
  ctx = await honion.run();
  expect(ctx.get("num")).toBe(3);
});

class Md extends Middleware {
  #number = 0;

  async invoke(): Promise<void> {
    this.#number++;
    this.ctx.set("num", this.#number);
    await this.next();
  }
}
