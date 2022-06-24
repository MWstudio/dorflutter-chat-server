/* Redis initialize */
const Redis = require("ioredis");

let redis = new Redis({
    port: 6379,
    host: "redis_boot",
    password: "",
    db: 0,
});

let redis2 = new Redis({
    port: 6379,
    host: "localhost",
    password: "",
    db: 0,
});

redis.on("connect", function () {
    console.log("Docker Redis container connected");
    redis2.disconnect();
});

redis2.on("connect", function () {
    console.log("Local Redis client connected");
    redis.disconnect();
    redis = redis2;
});

async function addChatLog(msg) {
    redis.zadd(
        "chatlog:" + msg["room"],
        Math.floor(Date.now()),
        JSON.stringify(msg)
    );
}

async function loadChatLog(room_id, res) {
    let unix_now = Math.floor(Date.now());

    redis.zremrangebyscore(
        "chatlog:" + room_id,
        "-inf",
        unix_now - 24 * 60 * 60 * 7 * 1000
    );
    redis.zrangebyscore(
        "chatlog:" + room_id,
        unix_now - 24 * 60 * 60 * 7 * 1000,
        "inf",
        (err, arr) => {
            var chatlog = [];
            for (var i = 0; i < arr.length; i++) {
                chatlog.push(JSON.parse(arr[i]));
            }
            res.send({
                chatlog: chatlog,
            });
        }
    );
}

module.exports = {
    addChatLog: addChatLog,
    loadChatLog: loadChatLog,
};
