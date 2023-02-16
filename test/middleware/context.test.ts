import { Middleware } from "../../src";
import { TestHonion } from "../test-honion";

describe("middleware.ctx", () => {
  class TestMiddleware extends Middleware {
    invoke() {
      return;
    }
  }

  it("should init ctx", async () => {
    const md = new TestMiddleware();
    const honion = new TestHonion();
    await honion.add(() => md).run();
    expect(md.ctx).not.toBeUndefined();
    expect(md.ctx.honion).toBe(honion);
  });

  it("should set logger", async () => {
    const md = new TestMiddleware();
    const honion = new TestHonion();
    await honion.add(() => md).run();

    expect(md.logger).toBe(honion.logger);
    md.logger = {} as any;
    expect(md.logger).toBe(honion.logger);
  });
});
