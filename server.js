/* Modules */
const database_initialize = require("./config/database_initialize");
const socketio = require("./server/socket/chat");
const chatAPI = require("./server/api/chat");

/* database initialize */
database_initialize();

/* server open */
socketio();
chatAPI();
