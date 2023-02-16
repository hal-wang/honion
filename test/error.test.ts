import { HonionException } from "../src";
import { TestHonion } from "./test-honion";

describe("error", () => {
  it("should push error stack when throw error", async () => {
    const ctx = await new TestHonion()
      .use(async () => {
        throw new Error();
      })
      .run();
    expect(ctx.errorStack.length).toBe(1);
  });

  it("should breakthrough when set error.breakthrough = true", async () => {
    const ctx = await new TestHonion()
      .use(async (ctx, next) => {
        await next();
        ctx.set("test", true);
      })
      .use(async () => {
        throw new HonionException().setBreakthrough();
      })
      .run();

    expect(ctx.errorStack.length).toBe(1);
    expect(ctx.get("test")).toBeUndefined();
  });

  it("should not breakthrough when set error.breakthrough = false", async () => {
    const ctx = await new TestHonion()
      .use(async (ctx, next) => {
        await next();
        ctx.set("test", true);
      })
      .use(async () => {
        throw new HonionException().setBreakthrough(false);
      })
      .run();

    expect(ctx.errorStack.length).toBe(1);
    expect(ctx.get("test")).toBeTruthy();
  });

  it("should set message with string", () => {
    const exception = new HonionException("abc");
    expect(exception.message).toBe("abc");
  });

  it("should set message with string", () => {
    const exception = new HonionException("abc");
    expect(exception.message).toBe("abc");
  });

  it("should set message with error", () => {
    const err = new Error("abc");
    const exception = new HonionException(err);
    expect(exception.message).toBe("abc");
  });

  it("should set message = '' with empty object", () => {
    const err = {} as any;
    const exception = new HonionException(err);
    expect(exception.message).toBe("");
  });
});
