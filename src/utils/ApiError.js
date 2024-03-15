// class ApiError extends Error {
//   constructor(statusCode, message = "something went wrong", error = []) {
//     super(message);
//     this.statusCode = statusCode;
//     this.message = message;
//     this.success = false;
//     this.error = error;
//     Error.captureStackTrace(this, this.constructor);
//   }
// }
class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = ""
  ) {
    super(message);
    this.statusCode = statusCode;
    this.data = null;
    this.message = message;
    this.success = false;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
export default ApiError;
