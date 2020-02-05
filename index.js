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

/**
 * @typedef ResolvedToSend
 * @property {{message:string, data:Object, name:string}} body
 * @property {number} status
 */

/**
 * @callback sendCallback 
 * @param {ResolvedToSend} resolvedToSend
 * @returns {Promise<Object>}
 */

/**
 * @callback execCallback
 * @param {{id:string, body:Object}} data
 * @param {sendCallback} send
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
 * @param {{url:string, auditorium:string, signals:string[], name:string}} param0
 */
function config({url, auditorium, signals, name}={}) {
  socket = io.connect(url, { reconnect: true });
  console.log(url);
  socket.on("connect", async () => {
    console.log("Client Connected!",socket.id);
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

/**
 * enter
 * @param {Connector} connector
 */
function enter(connector) {
  socket.emit("enter", connector);
}

/**
 * @name exec
 * @param {string} signal
 * @param {execCallback} cb 
 */
async function exec(signal, cb) {
  socket.on(signal, async data => {
    
    function next(resolved){
      return new Promise((resolve, reject)=>{
        socket.emit(data.id, resolved);

        socket.on(`${data.id}:success`, () => {
          socket.off(`${data.id}:success`);
          socket.off(`${data.id}:fail`);
          resolve(data);
        });
        socket.on(`${data.id}:fail`, error => {
          socket.off(`${data.id}:success`);
          socket.off(`${data.id}:fail`);
          reject(error);
        });
      })
    }
  
    cb(data, next)
    
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
