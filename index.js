/**
 * @typedef Status
 * @property {string} name
 * @property {number} hd
 * @property {number} memory
 */
/**
 * @typedef Connector
 * @property {string} url
 * @property {string} auditorium
 * @property {Status} status
 * @property {Array<string>} signals
 * @property {Date} sent_at
 */
let io = require("socket.io-client");
let socket = io.connect();
const disk = require("diskusage");
const os = require("os");
let free = require("free-memory");
const CustomError = require("./CustomError");
const Response = require("./Response");

/**
 * @name config
 * @param {url:string, auditorium:string, signals:string[], name:string} connector
 */
function config({url, auditorium, signals, name}={}) {
  socket = io.connect(url, { reconnect: true });
  console.log(url);
  socket.on("connect", async () => {
    console.log("%c Client Connected! %s", "color:green;", socket.id);
    let hd = -1;
    let memory = -1;
    try {
      hd = await getHd();
      memory = await getMemory();
    } catch (err) {}

    enter({
      url,
      auditorium,
      sent_at: new Date(),
      signals,
      status:{
        hd,
        memory,
        name
      }
    });
  });
}
//TODO: COLOCAR AS VARIÁVEIS NAS VARIÁVEIS DE AMBIENTE

/**
 * enter
 * @param {Connector} connector
 */
function enter(connector) {
  socket.emit("enter", connector);
}

/**
 * @name exec
 * @param {{signal:string, callBack:Function,onSuccess:Function, onFail:Function}} param0
 */
async function exec({ signal, callBack, onSuccess, onFail } = {}) {
  socket.on(signal, async data => {
    if (typeof callBack != "function") {
      return reject(
        new CustomError({
          name: "CallbackException",
          message: "O parametro Callback informado não é uma função",
          body: {}
        })
      );
    }
    if (typeof onSuccess != "function") {
      return reject(
        new CustomError({
          name: "CallbackException",
          message: "O parametro onSuccess informado não é uma função",
          body: {}
        })
      );
    }
    if (typeof onFail != "function") {
      return reject(
        new CustomError({
          name: "CallbackException",
          message: "O parametro onFail informado não é uma função",
          body: {}
        })
      );
    }
    if (callBack.constructor.name === "AsyncFunction") {
      socket.emit(data.id, await callBack(data));
    } else {
      socket.emit(data.id, callBack(data));
    }
    socket.on(`${data.id}:success`, () => {
      socket.off(`${data.id}:success`);
      socket.off(`${data.id}:fail`);
      onSuccess(data);
    });
    socket.on(`${data.id}:fail`, error => {
      socket.off(`${data.id}:success`);
      socket.off(`${data.id}:fail`);
      onFail(error);
    });
  });
}

socket.on("check", async date => {
  try {
    const hd = await getHd();
    const memory = await getMemory();
    let status = {
      hd: hd,
      memory: memory,
      sent_at: date.sent_at
    };
    socket.emit("check", status);
  } catch (error) {
    console.log("CHECK-ERROR:", error);
  }
});

function getHd() {
  return new Promise(async (resolve, reject) => {
    try {
      let path = os.platform() === "win32" ? "c:" : "/";
      const hd = await disk.check(path);
      resolve(hd.free);
    } catch (error) {
      reject(error);
    }
  });
}
function getMemory() {
  return new Promise((resolve, reject) => {
    free((err, info) => {
      if (err) return reject(err);
      resolve(info.mem.free);
    });
  });
}

socket.on("disconnect", () => console.log("Signal-C connect down"));
module.exports = Object.freeze({
  config,
  exec,
  CustomError,
  Response
});
