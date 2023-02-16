import { Context, Honion } from "../src";
import { BaseLogger } from "../src/logger";
import { TestHonion } from "./test-honion";

describe("invoke", () => {
  it("should invoke multiple", async () => {
    const honion = new TestHonion()
      .use(async (ctx, next) => {
        if (!ctx.has("result")) {
          ctx.set("result", 0);
        }
        ctx.set("result", ctx.get<number>("result") + 1);
        await next();
      })
      .use(async (ctx) => {
        ctx.set("result", ctx.get<number>("result") + 1);
      });
    process.env.NODE_ENV = "";

    let ctx = await honion.run();
    expect(ctx.get("result")).toBe(2);
    ctx = await honion.run();
    expect(ctx.get("result")).toBe(2);
    ctx = await honion.run();
    expect(ctx.get("result")).toBe(2);
  });
});

describe("custom", () => {
  class CustomHonion extends Honion {
    async run(): Promise<Context> {
      return await super.invoke(new Context());
    }
  }

  it("should run with custom honion", async () => {
    const ctx = await new CustomHonion()
      .use((ctx) => {
        ctx.set("result", {
          msg: "ok",
        });
      })
      .run();

    expect(ctx.get("result")).toEqual({
      msg: "ok",
    });
  });
});

describe("simple", () => {
  it("should invoke simple honion", async () => {
    let context!: Context;
    await new TestHonion()
      .use(async (ctx) => {
        context = ctx;
      })
      .run();

    expect(context).not.toBeUndefined();
  });

  test("should invoke without md", async () => {
    const ctx = await new TestHonion().run();

    expect(ctx).not.toBeUndefined();
  });
});

describe("logger", () => {
  it("should set logger", async () => {
    const logger = new BaseLogger();
    const honion = new TestHonion();
    expect(!!honion.logger).toBeTruthy();

    honion.setLogger(logger);
    expect(honion.logger).toBe(logger);
  });

  it("should set ctx.logger", async () => {
    const honion = new TestHonion();
    await honion
      .use(async (ctx) => {
        expect(honion.logger).toBe(ctx.logger);
        ctx.logger = {} as any;
        expect(honion.logger).toBe(ctx.logger);
      })
      .run();
  });

  function testConsole(consoleFunc: string) {
    it(`should log ${consoleFunc} by console.${consoleFunc}`, async () => {
      const honion = new TestHonion();
      const logger = honion.logger;

      const beforeFunc = console[consoleFunc];
      let message = "";
      console[consoleFunc] = (msg: string) => {
        message = msg;
      };
      logger[consoleFunc]("test");
      console[consoleFunc] = beforeFunc;
      expect(message).toBe("test");
    });
  }
  testConsole("error");
  testConsole("warn");
  testConsole("info");
  testConsole("debug");
});
