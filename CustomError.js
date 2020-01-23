/**
 * @typedef Body
 * @property {Array<string> | string} message
 * @property {string} name
 * @property {Object} [data]
 */
class CustomError extends Error {
  /**
   * @name constructor
   * @param {{body:Body,status:number}} param0
   */
  constructor({ body, status } = {}) {
    let msg;
    if (Array.isArray(body.message)) msg = body.message.join(",");
    else msg = body.message;
    super(msg);
    this.body = body;
    this.status = status;
  }
}
module.exports = CustomError;
