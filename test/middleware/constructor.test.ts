import { Middleware } from "../../src";
import { TestHonion } from "../test-honion";

class TestMiddleware extends Middleware {
  async invoke(): Promise<void> {
    this.ctx.set("result", "test");
  }
}

test("add middleware constructor", async () => {
  const honion = new TestHonion().add(TestMiddleware);

  const ctx = await honion.run();
  expect(ctx.get("result")).toBe("test");
});

test("add function middleware constructor", async () => {
  const honion = new TestHonion().add(() => TestMiddleware);

  const ctx = await honion.run();
  expect(ctx.get("result")).toBe("test");
});

test("add async function middleware constructor", async () => {
  const honion = new TestHonion().add(async () => {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 200);
    });
    return TestMiddleware;
  });

  const ctx = await honion.run();
  expect(ctx.get("result")).toBe("test");
});
