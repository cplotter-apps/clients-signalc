class CustomError extends Error {
  /**
   * @name constructor
   * @param {{name:string,message:string,body:Object}} param0
   */
  constructor({ name, message, body } = {}) {
    super(message);
    this.name = name;
    this.body = body;
  }
}
module.exports = CustomError;
