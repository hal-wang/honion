import { TestHonion } from "./test-honion";

async function getContext() {
  return await new TestHonion().run();
}

describe("ctx bag", () => {
  it("transient bag", async () => {
    const ctx = await getContext();
    ctx.set("BAG1", "transient", () => "BAG1");
    ctx.set("BAG2", "transient", () => ({ bag: "BAG2" }));

    expect(ctx.get("BAG1")).toBe("BAG1");
    expect(ctx.get<any>("BAG2")).toEqual({
      bag: "BAG2",
    });
    expect(ctx.get<any>("BAG2")).not.toBe(ctx.get<any>("BAG2"));
  });

  it("scoped bag", async () => {
    const ctx = await getContext();
    ctx.set("BAG1", "scoped", () => "BAG1");
    ctx.set("BAG2", "scoped", () => ({ bag: "BAG2" }));

    expect(ctx.get("BAG1")).toBe("BAG1");
    expect(ctx.get<any>("BAG2").bag).toBe("BAG2");
    expect(ctx.get<any>("BAG2")).toBe(ctx.get<any>("BAG2"));
  });

  it("singleton bag", async () => {
    const ctx = await getContext();
    ctx.set("BAG1", "singleton", () => "BAG1");
    ctx.set("BAG2", "singleton", () => ({ bag: "BAG2" }));

    expect(ctx.get("BAG1")).toBe("BAG1");
    expect(ctx.get<any>("BAG2").bag).toBe("BAG2");
    expect(ctx.get<any>("BAG2")).toBe(ctx.get<any>("BAG2"));
  });

  it("plain object", async () => {
    const ctx = await getContext();
    ctx.set("BAG1", "singleton", () => Object.create(null));

    expect(ctx.get("BAG1")).toEqual({});
    expect(ctx.get("BAG1")).toEqual(ctx.get("BAG1"));
  });

  it("delete", async () => {
    const ctx = await getContext();
    ctx.set("BAG1", {
      bag: 1,
    });
    expect(ctx.length).toBe(1);
    ctx.set("BAG2", Object.create(null));
    expect(ctx.length).toBe(2);
    ctx.delete("BAG1");
    expect(ctx.length).toBe(1);
    ctx.delete("BAG2");
    expect(ctx.length).toBe(0);
    expect(ctx.has("BAG1")).toBeFalsy();
    expect(ctx.has("BAG2")).toBeFalsy();
  });
});
