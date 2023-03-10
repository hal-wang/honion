import { Middleware, HookType } from "../../src";
import { TestHonion } from "../test-honion";

test("simple hook", async () => {
  class TestMiddleware extends Middleware {
    static index = 1;
    async invoke(): Promise<void> {
      this.ctx.set(`h${TestMiddleware.index}`, this.count);
      TestMiddleware.index++;
      await this.next();
    }
    count = 0;
  }

  const honion = new TestHonion()
    .hook((ctx, md) => {
      if (md instanceof TestMiddleware) {
        md.count++;
      }
    })
    .add(TestMiddleware) // 1 hook
    .hook((ctx, md) => {
      if (md instanceof TestMiddleware) {
        md.count++;
      }
    })
    .add(TestMiddleware) // 2 hooks
    .hook((ctx, md) => {
      if (md instanceof TestMiddleware) {
        md.count++;
      }
    })
    // executed but without effective
    .hook(HookType.AfterInvoke, (ctx, md) => {
      if (md instanceof TestMiddleware) {
        md.count++;
        ctx.set("after", 1);
      }
    }) // 3 hooks
    .add(TestMiddleware);

  const ctx = await honion.run();
  expect(ctx.get("h1")).toBe(1);
  expect(ctx.get("h2")).toBe(2);
  expect(ctx.get("h3")).toBe(3);
  expect(ctx.get("h4")).toBeUndefined();
  expect(ctx.get("after")).toBe(1);
});

function runReturnFalse(type: HookType.BeforeInvoke | HookType.BeforeNext) {
  test(`before hook return false ${type}`, async () => {
    class TestMiddleware extends Middleware {
      static index = 1;
      async invoke(): Promise<void> {
        const index = TestMiddleware.index;
        this.ctx.set(`h${index}`, this.count);
        TestMiddleware.index++;
        await this.next();
        this.ctx.set(`hn${index}`, this.count);
      }
      count = 0;
    }

    const honion = new TestHonion()
      .hook(type, (ctx, md) => {
        if (md instanceof TestMiddleware) {
          md.count++;
          return true;
        }
      })
      .add(TestMiddleware)
      .hook(type, (ctx, md) => {
        if (md instanceof TestMiddleware) {
          md.count++;
          return false;
        }
      })
      .add(TestMiddleware)
      .hook(type, (ctx, md) => {
        if (md instanceof TestMiddleware) {
          md.count++;
          return false;
        }
      })
      .add(TestMiddleware);

    const ctx = await honion.run();
    if (type == HookType.BeforeInvoke) {
      expect(ctx.get("h1")).toBe(1);
      expect(ctx.get("hn1")).toBe(1);
      expect(ctx.get("h2")).toBeUndefined();
      expect(ctx.get("hn2")).toBeUndefined();
      expect(ctx.get("h3")).toBeUndefined();
      expect(ctx.get("hn3")).toBeUndefined();
    } else if (type == HookType.BeforeNext) {
      expect(ctx.get("h1")).toBe(0);
      expect(ctx.get("hn1")).toBe(1);
      expect(ctx.get("h2")).toBe(0); // ????????????0???BeforeNext ??????????????????????????????????????????????????? count ??????????????? +1
      expect(ctx.get("hn2")).toBe(2);
      expect(ctx.get("h3")).toBeUndefined();
      expect(ctx.get("hn3")).toBeUndefined();
    }
  });
}

runReturnFalse(HookType.BeforeInvoke);
runReturnFalse(HookType.BeforeNext);
