const sqlite = require("sqlite3").verbose();

let db = new sqlite.Database(
    "./chat.db",
    sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error(err.message);
        } else {
            console.log("Connected to the database.");
        }
    }
);

module.exports = db;
