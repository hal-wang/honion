import { Context, Honion } from "../src";

export class TestContext extends Context {}

export class TestHonion extends Honion {
  async run() {
    return await this.invoke();
  }
}
