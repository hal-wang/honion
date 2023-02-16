import { Honion } from "../src";

export class TestHonion extends Honion {
  async run() {
    return await this.invoke();
  }
}
