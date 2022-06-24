const db = require("./sqlite");

async function database_initialize() {
    db.run(
        'CREATE TABLE "room" (' +
            '"room_id" TEXT NOT NULL UNIQUE, ' +
            '"title" TEXT, ' +
            '"game" TEXT, ' +
            '"unique_id" TEXT, ' +
            '"detail1" TEXT, ' +
            '"detail2" TEXT, ' +
            '"capacity" TEXT, ' +
            '"mic" TEXT, ' +
            '"start" TEXT, ' +
            '"server" TEXT, ' +
            '"time" TEXT, ' +
            '"tags"	TEXT, ' +
            '"img" TEXT, ' +
            'PRIMARY KEY("room_id"))',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );

    db.run(
        'CREATE TABLE "roomuser" (' +
            '"room_id" TEXT, ' +
            '"unique_id" TEXT, ' +
            '"selected_account" TEXT)',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );

    db.run(
        'CREATE TABLE "user" (' +
            '"unique_id" TEXT NOT NULL UNIQUE, ' +
            '"nickname" TEXT,' +
            '"profile_image_name" TEXT, ' +
            '"positive" TEXT, ' +
            '"negative" TEXT, ' +
            '"game_account"	TEXT, ' +
            'PRIMARY KEY("unique_id"))',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );

    db.run(
        'CREATE TABLE "user_in_room" (' +
            '"user_unique_id" TEXT,' +
            '"room_id" TEXT)',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );

    db.run(
        'CREATE TABLE "waituser" (' +
            '"room_id" TEXT,' +
            '"unique_id" TEXT, ' +
            '"selected_account" TEXT)',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );

    db.run(
        'CREATE TABLE "notification" (' +
            '"unique_id" TEXT, ' +
            '"type" TEXT, ' +
            '"room_id" TEXT, ' +
            '"title" TEXT, ' +
            '"content" TEXT, ' +
            '"date" TEXT, ' +
            '"start" TEXT, ' +
            '"from_unique_id" TEXT, ' +
            '"to_unique_id" TEXT, ' +
            '"from_profile_image" TEXT)',
        (err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("CREATE TABLE");
            }
        }
    );
}

module.exports = database_initialize;
