const db = require("../../config/sqlite");
const redis = require("../../utils/redis");
const app = require("../../config/express")();
const http = require("http").createServer(app);
const logger = require("../../config/winston");

http.listen(8000, () => {
    console.log("API Server: Connected to port 8000");
});

function chatAPI() {
    app.get("/chat-api/room-list", (req, res) => {
        let sql = `SELECT * FROM room ORDER BY start DESC`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                row.tags = row.tags.split(",");
            });
            res.send({
                rooms: rows,
            });
        });
    });

    app.get("/chat-api/room-list-paging/:page", (req, res) => {
        let idx = parseInt(req.params["page"]);
        idx === 0 ? idx : (idx *= 6);
        let sql = `SELECT * FROM room ORDER BY start DESC LIMIT ` + idx + `, 6`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                row.tags = row.tags.split(",");
            });
            res.send({
                rooms: rows,
            });
        });
    });

    app.get("/chat-api/room-list/:unique_id", (req, res) => {
        let sql =
            `SELECT * FROM room INNER JOIN user_in_room ON room.room_id = user_in_room.room_id WHERE user_in_room.user_unique_id = '` +
            req.params["unique_id"] +
            `'`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                row.tags = row.tags.split(",");
            });
            res.send({
                rooms: rows,
            });
        });
    });

    app.get("/chat-api/room-userlist/:room_id", (req, res) => {
        let sql =
            `SELECT * FROM user INNER JOIN roomuser ON user.unique_id = roomuser.unique_id WHERE roomuser.room_id = '` +
            req.params["room_id"] +
            `'`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                // logger.info(row);
                let parsed = JSON.parse(row.selected_account);
                // logger.info(parsed);
                try {
                    row.game_account = JSON.parse(row.game_account)[
                        parsed["game"]
                    ][parsed["index"]];
                } catch (err) {
                    row.game_account = {};
                }
            });
            res.send({
                userlist: rows,
            });
        });
    });

    app.get("/chat-api/wait-list/:room_id", (req, res) => {
        let sql =
            `SELECT * FROM user INNER JOIN waituser ON user.unique_id = waituser.unique_id WHERE waituser.room_id = '` +
            req.params["room_id"] +
            `'`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                // logger.info(row);
                let parsed = JSON.parse(row.selected_account);
                // logger.info(parsed);
                try {
                    row.game_account = JSON.parse(row.game_account)[
                        parsed["game"]
                    ][parsed["index"]];
                } catch (err) {
                    row.game_account = {};
                }
            });
            res.send({
                waiterlist: rows,
            });
        });
    });

    app.get("/chat-api/chat-log/:room_id", (req, res) => {
        redis.loadChatLog(req.params["room_id"], res);
    });

    app.get("/chat-api/search/room/:data", (req, res) => {
        let sql =
            `SELECT title, room_id, game, detail1, detail2, server, img, start FROM room WHERE title LIKE '%` +
            req.params["data"] +
            `%' OR room_id LIKE '%` +
            req.params["data"] +
            `%' OR game LIKE '%` +
            req.params["data"] +
            `%' OR detail1 LIKE '%` +
            req.params["data"] +
            `%' OR detail2 LIKE '%` +
            req.params["data"] +
            `%' OR server LIKE '%` +
            req.params["data"] +
            `%' ORDER BY game, start DESC`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            res.send({
                result: rows,
            });
        });
    });

    app.get("/chat-api/room-info/:room_id", (req, res) => {
        let sql =
            `SELECT * FROM room WHERE room_id = '` +
            req.params["room_id"] +
            `'`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            rows.forEach((row) => {
                row.tags = row.tags.split(",");
            });
            res.send({
                room: rows,
            });
        });
    });

    app.get("/chat-api/notification/:unique_id", (req, res) => {
        let sql =
            `SELECT * FROM notification WHERE unique_id = '` +
            req.params["unique_id"] +
            `' ORDER BY start DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            res.send({
                notilist: rows,
            });
        });
    });

    app.get("/chat-api/notification/count/:unique_id", (req, res) => {
        let sql =
            `SELECT COUNT(unique_id) as cnt FROM notification WHERE unique_id = '` +
            req.params["unique_id"] +
            `' GROUP BY unique_id ORDER BY date DESC`;
        db.all(sql, [], (err, rows) => {
            if (err) {
                throw err;
            }
            res.send({
                count: rows,
            });
        });
    });
}

module.exports = chatAPI;
