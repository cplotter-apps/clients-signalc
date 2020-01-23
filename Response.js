/**
 * @typedef {import("./CustomError").Body} Body
 */
class Response {
  /**
   * @name constructor
   * @param {{body:Body,status:number}} param0
   */
  constructor({ body, status } = {}) {
    this.body = body;
    this.status = status;
  }
}
module.exports = Response;
