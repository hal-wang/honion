export class HonionException extends Error {
  constructor(public readonly error?: string | { message: string }) {
    super("");

    this.name = this.constructor.name;

    if (typeof error == "string") {
      this.message = error;
    } else if (typeof error == "object") {
      this.message = error.message ?? "";
    }
  }

  public breakthrough = false;
  public setBreakthrough(breakthrough = true): this {
    this.breakthrough = breakthrough;
    return this;
  }
}
