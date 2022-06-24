const db = require("../../config/sqlite");
const database = require("../../utils/database");
const redis = require("../../utils/redis");
const app = require("../../config/express")();
const http = require("http").createServer(app);
const logger = require("../../config/winston");

http.listen(9000, () => {
    console.log("Socket: Connected to port 9000");
});

function socketio() {
    /* Socket variables initialize */
    let roomsEvent = 0;
    let usersEvent = 0;
    let waitersEvent = 0;
    let notifiEvent = 0;
    let retouchEvent = 0;
    var user_socket_list = [];
    var connected_users = {};

    /* socket.io initialize */
    const io = require("socket.io")(http, {
        cors: {
            origin: "http://localhost:3000",
        },
        transports: ["websocket", "polling"],
    });

    /* socket.io run */
    io.use((socket, next) => {
        console.log("io.use() running");
        next();
    });

    /* Socket events */
    io.on("connection", (socket) => {
        console.log("Connected to client successfully");

        socket.on("disconnect", () => {
            if (typeof connected_users[socket.id] !== "undefined") {
                logger.info(
                    "User " + connected_users[socket.id] + " disconnected"
                );
                // remove saved socket from users object
                delete connected_users[socket.id];
                logger.info(
                    "Connected users: " + JSON.stringify(connected_users)
                );
            }
        });

        // this function is run everytime client connects or reconnects
        // setup the client by adding to users array, joining room and send back user info to client
        socket.on("setUpUser", (userInfo) => {
            const user = {
                unique_id: userInfo["unique_id"],
                nickname: userInfo["nickname"],
                profile_image_url: userInfo["profile_image_url"],
            };

            connected_users[socket.id] = userInfo["unique_id"];

            try {
                let user_index = user_socket_list.findIndex(
                    (user) => user.unique_id === userInfo["unique_id"]
                );
                user_socket_list[user_index].socket = socket;
            } catch {
                user_socket_list.push({
                    socket: socket,
                    unique_id: userInfo["unique_id"],
                });
            }

            logger.info("Connected users: " + JSON.stringify(connected_users));
            logger.info(
                "Connected users count: " + Object.keys(connected_users).length
            );

            database.insertUser(userInfo);

            socket.emit("user", user);

            logger.info(
                "Set up new user " +
                    userInfo["nickname"] +
                    " " +
                    userInfo["unique_id"]
            );
            socket.emit("users", usersEvent);
            socket.emit("rooms", roomsEvent);
            socket.emit("waiters", waitersEvent);
            socket.emit("notifi", notifiEvent);

            let sql =
                `SELECT room_id FROM user_in_room WHERE user_unique_id = '` +
                userInfo["unique_id"] +
                `'`;

            db.all(sql, [], (err, rows) => {
                if (err) {
                    throw err;
                }
                rows.forEach((row) => {
                    socket.join(row.room_id);
                });
            });
        });

        socket.on("createRoom", (roomInfo, userInfo) => {
            logger.info(
                "Creating room " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            database.insertRoom(roomInfo);

            socket.join(roomInfo["room_id"]);

            usersEvent = usersEvent + 1;
            socket.emit("users", usersEvent);
            socket.broadcast.emit("users", usersEvent);

            roomsEvent = roomsEvent + 1;
            socket.emit("rooms", roomsEvent);
            socket.broadcast.emit("rooms", roomsEvent);

            logger.info("Create room: " + JSON.stringify(roomInfo));

            database.insertUserInRoom(roomInfo, userInfo);
            database.insertRoomUser(roomInfo, userInfo);
        });

        socket.on("waitRoom", (roomInfo, userInfo) => {
            logger.info(
                "Waiting room " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            database.insertWaitUser(roomInfo, userInfo);
            msg = {
                type: "info",
                room: roomInfo["room_id"],
                title: roomInfo["title"],
                content:
                    userInfo["nickname"] +
                    " 님이 '" +
                    roomInfo["title"] +
                    "' 매칭에 입장 신청을 하셨습니다.",
                unique_id: userInfo["unique_id"],
                date: getCurrentDate(),
                start: new Date().toISOString(),
            };
            io.in(roomInfo["room_id"]).emit("chat", msg);
            database.insertInfo(roomInfo["unique_id"], msg);

            redis.addChatLog(msg);

            waitersEvent = waitersEvent + 1;
            socket.emit("waiters", waitersEvent);
            socket.broadcast.emit("waiters", waitersEvent);
        });

        socket.on("waitDelete", (roomInfo, userInfo) => {
            logger.info(
                "Delete waiter " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            database.deleteWaitUser(roomInfo, userInfo);
            waitersEvent = waitersEvent - 1;
            socket.emit("waiters", waitersEvent);
            socket.broadcast.emit("waiters", waitersEvent);
        });

        socket.on("joinRoom", (roomInfo, userInfo) => {
            logger.info(
                "Try to join room " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            try {
                let user_index = user_socket_list.findIndex(
                    (user) => user.unique_id === userInfo["unique_id"]
                );
                let socketB = user_socket_list[user_index].socket;
                socketB.join(roomInfo["room_id"]);
            } catch {
                logger.error(
                    "User " + userInfo["unique_id"] + "socket cannot find."
                );
            }

            let sql =
                `SELECT * FROM user_in_room WHERE user_unique_id = '` +
                userInfo["unique_id"] +
                `' AND room_id = '` +
                roomInfo["room_id"] +
                `'`;

            db.all(sql, [], (err, rows) => {
                if (err) {
                    throw err;
                }
                if (rows.length === 0) {
                    database.insertUserInRoom(roomInfo, userInfo);
                    database.insertRoomUser(roomInfo, userInfo);

                    usersEvent = usersEvent + 1;
                    socket.emit("users", usersEvent);
                    socket.broadcast.emit("users", usersEvent);

                    join_msg = {
                        type: "info",
                        room: roomInfo["room_id"],
                        title: roomInfo["title"],
                        content:
                            "'" +
                            roomInfo["title"] +
                            "' 매칭에 참가하셨습니다.",
                        unique_id: userInfo["unique_id"],
                        date: getCurrentDate(),
                        start: new Date().toISOString(),
                    };

                    io.in(roomInfo["room_id"]).emit("you_joined", join_msg);
                    database.insertInfo(userInfo["unique_id"], join_msg);

                    notifiEvent = notifiEvent + 1;
                    io.in(roomInfo["room_id"]).emit("notifi", notifiEvent);

                    msg = {
                        type: "info",
                        room: roomInfo["room_id"],
                        title: roomInfo["title"],
                        content:
                            userInfo["nickname"] +
                            " 님이 '" +
                            roomInfo["title"] +
                            "' 매칭에 입장하셨습니다.",
                        unique_id: userInfo["unique_id"],
                        date: getCurrentDate(),
                        start: new Date().toISOString(),
                    };
                    io.in(roomInfo["room_id"]).emit("chat", msg);
                    database.insertInfo(roomInfo["unique_id"], msg);

                    notifiEvent = notifiEvent + 1;
                    io.in(roomInfo["room_id"]).emit("notifi", notifiEvent);

                    redis.addChatLog(msg);

                    logger.info(
                        userInfo["unique_id"] +
                            " " +
                            userInfo["nickname"] +
                            " has joined room: ",
                        roomInfo["room_id"] + " successfully."
                    );
                } else {
                    logger.info(
                        userInfo["unique_id"] +
                            " is already member of room " +
                            roomInfo["room_id"]
                    );
                    return;
                }
            });
        });

        socket.on("quitRoom", (roomInfo, userInfo) => {
            logger.info(
                "Try to quit room " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            socket.leave(roomInfo["room_id"]);

            msg = {
                type: "info",
                room: roomInfo["room_id"],
                title: roomInfo["title"],
                content:
                    userInfo["nickname"] +
                    " 님이 '" +
                    roomInfo["title"] +
                    "' 매칭에서 퇴장하셨습니다.",
                unique_id: userInfo["unique_id"],
                date: getCurrentDate(),
                start: new Date().toISOString(),
            };
            io.in(roomInfo["room_id"]).emit("chat", msg);
            database.insertInfo(roomInfo["unique_id"], msg);

            notifiEvent = notifiEvent + 1;
            io.in(roomInfo["room_id"]).emit("notifi", notifiEvent);

            redis.addChatLog(msg);

            logger.info(
                userInfo["unique_id"] +
                    " " +
                    userInfo["nickname"] +
                    " has quited room: ",
                roomInfo["room_id"] + " successfully."
            );

            database.deleteUserInRoom(roomInfo, userInfo);
            database.deleteRoomUser(roomInfo, userInfo);

            let sql =
                `SELECT * FROM roomuser WHERE room_id = '` +
                roomInfo["room_id"] +
                `'`;

            db.all(sql, [], (err, rows) => {
                if (userInfo["unique_id"] === roomInfo["unique_id"]) {
                    database.updateHost(roomInfo);
                }

                if (err) {
                    throw err;
                }
                if (rows.length === 0) {
                    database.deleteRoom(roomInfo);

                    roomsEvent = roomsEvent - 1;
                    socket.emit("rooms", roomsEvent);
                    socket.broadcast.emit("rooms", roomsEvent);

                    logger.info(
                        "Room " + roomInfo["room_id"] + " has been deleted."
                    );
                }
                usersEvent = usersEvent - 1;
                socket.emit("users", usersEvent);
                socket.broadcast.emit("users", usersEvent);
            });
        });

        socket.on("kickRoom", (roomInfo, userInfo) => {
            logger.info(
                "Try to kick user from " +
                    roomInfo["room_id"] +
                    " " +
                    userInfo["nickname"]
            );

            try {
                let user_index = user_socket_list.findIndex(
                    (user) => user.unique_id === userInfo["unique_id"]
                );
                let socketB = user_socket_list[user_index].socket;
                socketB.leave(roomInfo["room_id"]);
            } catch {
                logger.error(
                    "User " + userInfo["unique_id"] + "socket cannot find."
                );
            }

            msg = {
                type: "info",
                room: roomInfo["room_id"],
                title: roomInfo["title"],
                content:
                    userInfo["nickname"] +
                    " 님이 '" +
                    roomInfo["title"] +
                    "' 매칭에서 강제 퇴장 당하였습니다.",
                unique_id: userInfo["unique_id"],
                date: getCurrentDate(),
                start: new Date().toISOString(),
            };
            io.in(roomInfo["room_id"]).emit("chat", msg);
            database.insertInfo(userInfo["unique_id"], msg);

            notifiEvent = notifiEvent + 1;
            io.in(roomInfo["room_id"]).emit("notifi", notifiEvent);

            logger.info(
                userInfo["unique_id"] +
                    " " +
                    userInfo["nickname"] +
                    " has been kicked in room: ",
                roomInfo["room_id"] + " successfully."
            );

            redis.addChatLog(msg);

            database.deleteUserInRoom(roomInfo, userInfo);
            database.deleteRoomUser(roomInfo, userInfo);

            usersEvent = usersEvent - 1;
            socket.emit("users", usersEvent);
            socket.broadcast.emit("users", usersEvent);
        });

        socket.on("updateRoom", (room_id) => {
            logger.info("Update room " + room_id);
            socket.join(room_id);
            return;
        });

        socket.on("deleteRoom", (roomInfo) => {
            database.deleteRoom(roomInfo);

            roomsEvent = roomsEvent - 1;
            socket.emit("rooms", roomsEvent);
            socket.broadcast.emit("rooms", roomsEvent);
        });

        function getCurrentDate() {
            var curr = new Date();
            const utc = curr.getTime() + curr.getTimezoneOffset() * 60 * 1000;

            const KR_TIME_DIFF = 9 * 60 * 60 * 1000;
            const date = new Date(utc + KR_TIME_DIFF);

            var year = date.getFullYear().toString();

            var month = date.getMonth() + 1;
            month = month < 10 ? "0" + month.toString() : month.toString();

            var day = date.getDate();
            day = day < 10 ? "0" + day.toString() : day.toString();

            var hour = date.getHours();
            hour = hour < 10 ? "0" + hour.toString() : hour.toString();

            var minites = date.getMinutes();
            minites =
                minites < 10 ? "0" + minites.toString() : minites.toString();

            var seconds = date.getSeconds();
            seconds =
                seconds < 10 ? "0" + seconds.toString() : seconds.toString();

            var miliseconds = date.getMilliseconds();
            miliseconds =
                miliseconds < 10
                    ? "0" + miliseconds.toString()
                    : miliseconds.toString();

            return year + month + day + hour + minites + seconds + miliseconds;
        }

        socket.on("message", (message, userInfo) => {
            const msg = {
                type: "message",
                room: userInfo["room_id"],
                unique_id: userInfo["unique_id"],
                nickname: userInfo["nickname"],
                profile_image_name: userInfo["profile_image_name"],
                content: message,
                date: getCurrentDate(),
            };

            io.in(userInfo["room_id"]).emit("chat", msg);
            redis.addChatLog(msg);
            logger.info("Message sent to room: " + msg.room);
        });

        socket.on("dm", (message, userInfo) => {
            try {
                let user_index = user_socket_list.findIndex(
                    (user) => user.unique_id === userInfo["unique_id"]
                );
                let socketB = user_socket_list[user_index].socket;
                logger.info(socketB.id);
            } catch {}

            const msg = {
                type: "message",
                room: socketB.id,
                unique_id: userInfo["unique_id"],
                nickname: userInfo["nickname"],
                profile_image_name: userInfo["profile_image_name"],
                content: message,
                date: getCurrentDate(),
            };

            logger.info(
                "Message sent to user:",
                user_socket_list[user_index].unique_id,
                socketB.id
            );
            io.to(socketB.id).emit("chat", msg);
            redis.addChatLog(msg);
        });

        // socket.on("typing", (room_id, nickname) => {
        //     io.sockets.to(room_id).emit("typing", nickname);
        // });

        // socket.on("stoppedTyping", () => {
        //     io.sockets.to(socket.room_id).emit("stoppedTyping");
        // });

        socket.on("gameProfile", (unique_id, data) => {
            logger.info("Insert Game Profile: " + unique_id);
            database.insertGameProfile(unique_id, data);
        });

        socket.on("updateGameProfile", (unique_id, previousName, data) => {
            logger.info(
                "Update Game Profile: " + unique_id + " " + previousName
            );
            database.updateGameProfile(unique_id, previousName, data);
        });

        socket.on("userProfile", (data) => {
            logger.info("Update User Profile: " + data["unique_id"]);
            database.updateUserProfile(data);
        });

        socket.on("userEvaluation", (unique_id, evaluation) => {
            logger.info("Update User Evaluation: " + unique_id);
            database.updateUserEvaluation(unique_id, evaluation);
        });

        socket.on("deleteGame", (unique_id, game) => {
            logger.info("Delete Game: " + unique_id + " " + game);
            database.deleteGame(unique_id, game);
        });

        socket.on("deleteGameAccount", (unique_id, game, nickname) => {
            logger.info(
                "Delete Game Account: " +
                    " " +
                    unique_id +
                    " " +
                    game +
                    " " +
                    nickname
            );
            database.deleteGameAccount(unique_id, game, nickname);
        });

        socket.on("retouchRoom", (room_id, roomInfo) => {
            logger.info("Retouch Room Info: " + room_id + " " + roomInfo);
            database.retouchRoom(room_id, roomInfo);
            retouchEvent = retouchEvent + 1;
            io.in(room_id).emit("retouch", retouchEvent);
        });

        socket.on("info", (unique_id, msg) => {
            logger.info("Info notification: " + unique_id + " " + msg);
            database.insertInfo(unique_id, msg);
        });

        socket.on("deleteNoti", (noti) => {
            logger.info("Delete notification: " + noti);
            database.deleteNoti(noti);

            notifiEvent = notifiEvent + 1;
            socket.emit("notifi", notifiEvent);
        });

        socket.on("deleteNotiAll", (unique_id) => {
            logger.info("Delete notification all: " + unique_id);
            database.deleteNotiAll(unique_id);

            notifiEvent = notifiEvent + 1;
            socket.emit("notifi", notifiEvent);
        });

        socket.on(
            "follow",
            (
                from_unique_id,
                to_unique_id,
                from_nickname,
                from_profile_image
            ) => {
                logger.info(
                    "Follow: " +
                        from_unique_id +
                        " " +
                        to_unique_id +
                        " " +
                        from_nickname +
                        " " +
                        from_profile_image
                );

                let msg = {
                    from_unique_id: from_unique_id,
                    to_unique_id: to_unique_id,
                    type: "info",
                    content: from_nickname + " 님이 당신을 팔로우 했습니다.",
                    date: getCurrentDate(),
                    start: new Date().toISOString(),
                    from_profile_image: from_profile_image,
                };
                socket.emit("you_followed", msg);
                socket.broadcast.emit("you_followed", msg);

                notifiEvent = notifiEvent + 1;
                socket.emit("notifi", notifiEvent);
                socket.broadcast.emit("notifi", notifiEvent);
            }
        );

        socket.on("updateUserAuth", (previous, after) => {
            logger.info("Update user unique_id: " + previous + " " + after);
            database.updateUserAuth(previous, after);
        });
    });
}

module.exports = socketio;
