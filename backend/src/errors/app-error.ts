export class AppError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "AppError";
  }

  toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      code: this.code,
    };
  }
}
