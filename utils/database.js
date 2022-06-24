const db = require("../config/sqlite");

// 유저 프로필 업데이트
async function updateUserProfile(userInfo) {
    db.run(
        `UPDATE user SET nickname = '` +
            userInfo["nickname"] +
            `' WHERE unique_id = '` +
            userInfo["unique_id"] +
            `'`
    );
    db.run(
        `UPDATE user SET profile_image_name = '` +
            userInfo["profile_image_name"] +
            `' WHERE unique_id = '` +
            userInfo["unique_id"] +
            `'`
    );
}

async function updateUserAuth(previous, unique_id) {
    db.run(
        `UPDATE user SET unique_id = '` +
            unique_id +
            `' WHERE unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE notification SET unique_id = '` +
            unique_id +
            `' WHERE unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE notification SET from_unique_id = '` +
            unique_id +
            `' WHERE from_unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE notification SET to_unique_id = '` +
            unique_id +
            `' WHERE to_unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE room SET unique_id = '` +
            unique_id +
            `' WHERE unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE roomuser SET unique_id = '` +
            unique_id +
            `' WHERE unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE user_in_room SET user_unique_id = '` +
            unique_id +
            `' WHERE user_unique_id = '` +
            previous +
            `'`
    );
    db.run(
        `UPDATE waituser SET unique_id = '` +
            unique_id +
            `' WHERE unique_id = '` +
            previous +
            `'`
    );
}

// 유저 평가 업데이트
async function updateUserEvaluation(unique_id, evaluation) {
    console.log(evaluation);
    if (unique_id.split("-")[0] === "guest") {
        console.log("Guest does not have evaluation");
        return;
    }
    try {
        db.run(
            `UPDATE user SET positive = '` +
                evaluation["positive"] +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
        db.run(
            `UPDATE user SET negative = '` +
                evaluation["negative"] +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
    } catch {
        console.log("error");
    }
}

// 게임 프로필 추가
async function insertGameProfile(unique_id, gameProfile) {
    let sql =
        `SELECT game_account FROM user WHERE unique_id = '` + unique_id + `'`;

    db.get(sql, (err, row) => {
        console.log(row);
        console.log(gameProfile);
        let temp = {};
        try {
            temp = JSON.parse(row.game_account);
        } catch {
            console.log("No game account");
        }
        console.log(temp);
        try {
            if (gameProfile.hasOwnProperty("maple_profile")) {
                if (temp.hasOwnProperty("maple")) {
                    console.log("Have maple keys");
                    temp["maple"].push(gameProfile["maple_profile"]);
                    console.log(temp);
                } else {
                    console.log("Have no maple keys");
                    temp["maple"] = [gameProfile["maple_profile"]];
                    console.log(temp);
                }
            } else if (gameProfile.hasOwnProperty("lol_profile")) {
                if (temp.hasOwnProperty("lol")) {
                    console.log("Have lol keys");
                    temp["lol"].push(gameProfile["lol_profile"]);
                    console.log(temp);
                } else {
                    console.log("Have no lol keys");
                    temp["lol"] = [gameProfile["lol_profile"]];
                    console.log(temp);
                }
            } else if (gameProfile.hasOwnProperty("pubg_profile")) {
                if (temp.hasOwnProperty("pubg")) {
                    console.log("Have pubg keys");
                    temp["pubg"].push(gameProfile["pubg_profile"]);
                    console.log(temp);
                } else {
                    console.log("Have no pubg keys");
                    temp["pubg"] = [gameProfile["pubg_profile"]];
                    console.log(temp);
                }
            }
        } catch {
            console.log("No game account");
        }
        db.run(
            `UPDATE user SET game_account ='` +
                JSON.stringify(temp) +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
    });
}

// 게임 프로필 업데이트
async function updateGameProfile(unique_id, previousName, gameProfile) {
    let sql =
        `SELECT game_account FROM user WHERE unique_id = '` + unique_id + `'`;

    db.get(sql, (err, row) => {
        let temp = {};
        try {
            temp = JSON.parse(row.game_account);
        } catch {
            console.log("No game account");
        }

        try {
            if (gameProfile.hasOwnProperty("maple_profile")) {
                for (var i = 0; i < temp["maple"].length; i++) {
                    if (temp["maple"][i]?.nickname === previousName) {
                        temp["maple"][i] = gameProfile["maple_profile"];
                        break;
                    }
                }
            } else if (gameProfile.hasOwnProperty("lol_profile")) {
                for (var i = 0; i < temp["lol"].length; i++) {
                    if (temp["lol"][i]?.nickname === previousName) {
                        temp["lol"][i] = gameProfile["lol_profile"];
                        break;
                    }
                }
            } else if (gameProfile.hasOwnProperty("pubg_profile")) {
                for (var i = 0; i < temp["pubg"].length; i++) {
                    if (temp["pubg"][i]?.nickname === previousName) {
                        temp["pubg"][i] = gameProfile["pubg_profile"];
                        break;
                    }
                }
            }
        } catch {
            console.log("No game account");
        }
        db.run(
            `UPDATE user SET game_account ='` +
                JSON.stringify(temp) +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
    });
}

async function deleteGame(unique_id, game) {
    console.log(game);
    let sql =
        `SELECT game_account FROM user WHERE unique_id = '` + unique_id + `'`;
    db.get(sql, (err, row) => {
        let temp = {};
        try {
            temp = JSON.parse(row.game_account);
        } catch {
            console.log("No game account");
        }

        try {
            if (game === "Maple_Story") {
                console.log("Delete Maple");
                temp["maple"] = [];
            } else if (game === "League_of_Legends") {
                console.log("Delete League of Legends");
                temp["lol"] = [];
            } else if (game === "PUBG") {
                console.log("Delete PUBG");
                temp["pubg"] = [];
            }
        } catch {
            console.log("No game account");
        }

        db.run(
            `UPDATE user SET game_account ='` +
                JSON.stringify(temp) +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
    });
}

async function deleteGameAccount(unique_id, game, nickname) {
    console.log(game);
    let sql =
        `SELECT game_account FROM user WHERE unique_id = '` + unique_id + `'`;

    var deleteIndex = 0;

    db.get(sql, (err, row) => {
        let temp = {};
        try {
            temp = JSON.parse(row.game_account);
        } catch {
            console.log("No game account");
        }

        try {
            if (game === "Maple_Story") {
                console.log("Delete Maple Account", nickname);
                for (var i = 0; i < temp["maple"].length; i++) {
                    if (temp["maple"][i]?.nickname === nickname) {
                        temp["maple"].splice(i, 1);
                        deleteIndex = i;
                        break;
                    }
                }
            } else if (game === "League_of_Legends") {
                console.log("Delete League of Legends Account", nickname);
                for (var i = 0; i < temp["lol"].length; i++) {
                    if (temp["lol"][i]?.nickname === nickname) {
                        temp["lol"].splice(i, 1);
                        deleteIndex = i;
                        break;
                    }
                }
            } else if (game === "PUBG") {
                console.log("Delete PUBG Account", nickname);
                for (var i = 0; i < temp["pubg"].length; i++) {
                    if (temp["pubg"][i]?.nickname === nickname) {
                        temp["pubg"].splice(i, 1);
                        deleteIndex = i;
                        break;
                    }
                }
            }
        } catch {
            console.log("No game account");
        }
        db.run(
            `UPDATE user SET game_account ='` +
                JSON.stringify(temp) +
                `' WHERE unique_id = '` +
                unique_id +
                `'`
        );
        console.log(deleteIndex);

        let sql2 =
            `SELECT room_id, selected_account FROM roomuser WHERE unique_id = '` +
            unique_id +
            `'`;

        db.all(sql2, (err, rows) => {
            rows.forEach((row) => {
                let temp = {};
                try {
                    temp = JSON.parse(row.selected_account);
                } catch {
                    console.log("No game account");
                }
                // console.log(temp);
                try {
                    if (
                        (game === "Maple_Story" && temp["game"] === "maple") ||
                        (game === "League_of_Legends" &&
                            temp["game"] === "lol") ||
                        (game === "PUBG" && temp["game"] === "pubg")
                    ) {
                        if (deleteIndex === 0) {
                            if (temp["index"] > 0) {
                                temp["index"] = temp["index"] - 1;
                            }
                        } else if (deleteIndex === 1) {
                            if (temp["index"] >= 1) {
                                temp["index"] = temp["index"] - 1;
                            }
                        } else if (deleteIndex === 2) {
                            if (temp["index"] === 2) {
                                temp["index"] = temp["index"] - 1;
                            }
                        }
                    }
                } catch {
                    console.log("No game account");
                }
                db.run(
                    `UPDATE roomuser SET selected_account ='` +
                        JSON.stringify(temp) +
                        `' WHERE unique_id = '` +
                        unique_id +
                        `' AND room_id = '` +
                        row.room_id +
                        `'`
                );
            });
        });
    });
}

// 전체 방 목록
async function insertRoom(roomInfo) {
    db.run(
        `INSERT INTO room(room_id, title, game, unique_id, detail1, detail2, capacity, mic, start, server, time, tags, img) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            roomInfo["room_id"],
            roomInfo["title"],
            roomInfo["game"],
            roomInfo["unique_id"],
            roomInfo["detail1"],
            roomInfo["detail2"],
            roomInfo["capacity"],
            roomInfo["mic"],
            roomInfo["start"],
            roomInfo["server"],
            roomInfo["time"],
            roomInfo["tags"],
            roomInfo["img"],
        ],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

async function retouchRoom(room_id, roomInfo) {
    db.run(
        `UPDATE room SET title = '` +
            roomInfo["title"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
    db.run(
        `UPDATE room SET server = '` +
            roomInfo["server"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
    db.run(
        `UPDATE room SET detail1 = '` +
            roomInfo["detail1"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
    db.run(
        `UPDATE room SET detail2 = '` +
            roomInfo["detail2"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
    db.run(
        `UPDATE room SET capacity = '` +
            roomInfo["capacity"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
    db.run(
        `UPDATE room SET tags = '` +
            roomInfo["tags"] +
            `' WHERE room_id = '` +
            room_id +
            `'`
    );
}

// 유저가 들어가있는 방 목록
async function insertUserInRoom(roomInfo, userInfo) {
    db.run(
        `INSERT INTO user_in_room(user_unique_id, room_id) VALUES(?, ?)`,
        [userInfo["unique_id"], roomInfo["room_id"]],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

// 유저 추가
async function insertUser(userInfo) {
    db.run(
        `INSERT INTO user(unique_id, nickname, profile_image_name, positive, negative, game_account) VALUES(?, ?, ?, ?, ?, ?)`,
        [
            userInfo["unique_id"],
            userInfo["nickname"],
            userInfo["profile_image_name"],
            0,
            0,
            JSON.stringify({}),
        ],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

// 방에 들어있는 유저 목록
async function insertRoomUser(roomInfo, userInfo) {
    db.run(
        `INSERT INTO roomuser(room_id, unique_id, selected_account) VALUES(?, ?, ?)`,
        [
            roomInfo["room_id"],
            userInfo["unique_id"],
            JSON.stringify(userInfo["selected_account"]),
        ],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

// 대기중인 유저 목록
async function insertWaitUser(roomInfo, userInfo) {
    db.run(
        `INSERT INTO waituser(room_id, unique_id, selected_account) VALUES(?, ?, ?)`,
        [
            roomInfo["room_id"],
            userInfo["unique_id"],
            JSON.stringify(userInfo["selected_account"]),
        ],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

// 유저가 들어가있는 방 목록 삭제
async function deleteUserInRoom(roomInfo, userInfo) {
    db.run(
        `DELETE FROM user_in_room WHERE user_unique_id = '` +
            userInfo["unique_id"] +
            `' AND room_id = '` +
            roomInfo["room_id"] +
            `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

// 방에 들어있는 유저 삭제
async function deleteRoomUser(roomInfo, userInfo) {
    db.run(
        `DELETE FROM roomuser WHERE unique_id = '` +
            userInfo["unique_id"] +
            `' AND room_id = '` +
            roomInfo["room_id"] +
            `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

// 대기중인 유저 삭제
async function deleteWaitUser(roomInfo, userInfo) {
    db.run(
        `DELETE FROM waituser WHERE unique_id = '` +
            userInfo["unique_id"] +
            `' AND room_id = '` +
            roomInfo["room_id"] +
            `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

// 방 삭제
async function deleteRoom(roomInfo) {
    db.run(
        `DELETE FROM room WHERE room_id = '` + roomInfo["room_id"] + `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

async function updateHost(roomInfo) {
    let sql =
        `UPDATE room SET unique_id = (SELECT unique_id FROM roomuser WHERE roomuser.room_id = '` +
        roomInfo["room_id"] +
        `') WHERE room_id = '` +
        roomInfo["room_id"] +
        `'`;
    db.run(sql);
    console.log(sql);
}

async function insertInfo(unique_id, msg) {
    db.run(
        `INSERT INTO notification(unique_id, type, room_id, title, content, date, start, from_unique_id, to_unique_id, from_profile_image) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            unique_id,
            msg["type"],
            msg["room"],
            msg["title"],
            msg["content"],
            msg["date"],
            msg["start"],
            msg["from_unique_id"],
            msg["to_unique_id"],
            msg["from_profile_image"],
        ],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been inserted with rowid ${this.lastID}`);
        }
    );
}

async function deleteNoti(noti) {
    db.run(
        `DELETE FROM notification WHERE start = '` + noti.start + `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

async function deleteNotiAll(unique_id) {
    db.run(
        `DELETE FROM notification WHERE unique_id = '` + unique_id + `'`,
        [],
        function (err) {
            if (err) {
                return console.log(err.message);
            }
            // get the last insert id
            console.log(`A row has been deleted`);
        }
    );
}

module.exports = {
    updateUserProfile: updateUserProfile,
    updateUserAuth: updateUserAuth,
    updateUserEvaluation: updateUserEvaluation,
    insertGameProfile: insertGameProfile,
    updateGameProfile: updateGameProfile,
    deleteGame: deleteGame,
    deleteGameAccount: deleteGameAccount,
    insertRoom: insertRoom,
    retouchRoom: retouchRoom,
    insertUserInRoom: insertUserInRoom,
    insertUser: insertUser,
    insertRoomUser: insertRoomUser,
    insertWaitUser: insertWaitUser,
    deleteUserInRoom: deleteUserInRoom,
    deleteRoomUser: deleteRoomUser,
    deleteWaitUser: deleteWaitUser,
    deleteRoom: deleteRoom,
    updateHost: updateHost,
    insertInfo: insertInfo,
    deleteNoti: deleteNoti,
    deleteNotiAll: deleteNotiAll,
};
