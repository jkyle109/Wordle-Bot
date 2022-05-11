import { MongoClient, ServerApiVersion } from "mongodb";
import "dotenv/config";

const uri = process.env.WORDLE_DB_URI;

export const db = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

await db.connect();

// const setDailyTTL = async () => {
//   db.connect(async (err) => {
//     if (err) throw err;

//     let date = new Date();
//     date.setHours(23, 59, 0, 0);

//     const collection = db.db("wordle-bot").collection("daily-leaderboard");
//     collection
//       .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
//       .then(() => {
//         return collection.updateMany(
//           {},
//           {
//             $set: {
//               expireAt: date,
//             },
//           },
//           { upsert: true }
//         );
//       })
//       .finally(() => db.close());
//   });
// };

export const getAllDB = async (name, query = {}, options = {}, sort = {}) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .find(query, options)
    .sort(sort)
    .toArray()
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const getOneDB = async (name, query = {}, options = {}) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .findOne(query, options)
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const insertOneDB = async (name, query, options = {}) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .insertOne(query, options)
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const deleteOneDB = async (name, query = {}, options = {}) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .findOneAndDelete(query, options)
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const updateOneDB = async (
  name,
  query = {},
  update = {},
  options = {}
) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .findOneAndUpdate(query, update, options)
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const getWordleNumber = async () => {
  return getOneDB("misc", { type: "wordle-number" }).then((res) => res.number);
};

export const deleteAllDB = async (name) => {
  // await db.connect();
  return db
    .db("wordle-bot")
    .collection(name)
    .deleteMany({})
    .catch((err) => console.log(err));
  // .finally(() => db.close());
};

export const updateOverall = async (user_id, guild_id, wordle) => {
  const old = await getOneDB("overall-leaderboard", {
    user_id: user_id,
    guild_id: guild_id,
  });

  console.log("ITS DONE", old);
  if (old) {
    return updateOneDB(
      "overall-leaderboard",
      {
        user_id: user_id,
        guild_id: guild_id,
      },
      {
        $set: {
          avg_guess_count: (
            (old.avg_guess_count * old.complete_count + wordle.guess_count) /
            (old.complete_count + 1)
          ).toFixed(2),
          avg_guess_score: (
            (old.avg_guess_score * old.complete_count + wordle.score) /
            (old.complete_count + 1)
          ).toFixed(2),
          complete_count: old.complete_count + 1,
        },
      }
    );
  } else {
    return insertOneDB("overall-leaderboard", {
      user_id: user_id,
      guild_id: guild_id,
      avg_guess_count: wordle.guess_count,
      avg_guess_score: wordle.score,
      complete_count: 1,
    });
  }
};
// const test = async () => {
//   return updateOneDB(
//     "daily-leaderboard",
//     {
//       guild_id: "3",
//       user_id: "202290363489058816",
//     },
//     { $setOnInsert: { bad: "bad" } },
//     { upsert: true }
//   );
// };

// console.log(await getOneDB("overall-leaderboard", {}), "00000000000000");

// console.log(await test());

// console.log(await getOneDB("misc", { type: "state" }));
// console.log(await getOneDB("daily-leaderboard"));

// let stuff = await getStuff();
// console.log(stuff);
// console.log(stuff);
// let thing = makeDailyLeaderboard(stuff, 1, stuff.length, stuff.length);
// console.log(JSON.stringify(thing));

// db.connect(async (err) => {
//   if (err) throw err;
//   const collection = db.db("wordle-bot").collection("daily-leaderboard");
//   // perform actions on the collection object
//   const query = {
//     guild_id: "fdfjfgfew",
//   };
//   // console.dir((new Date().setHours(23, 59, 0, 0) - Date.now()) / 1000);
//   // console.log(new Date().setHours(23, 59, 0, 0));
//   // db.log_events.insertOne({
//   //   expireAt: new Date("July 22, 2013 14:00:00"),
//   //   logEvent: 2,
//   //   logMessage: "Success!",
//   // });

//   // let date = new Date();
//   // date.setHours(23, 59, 0, 0);
//   // collection
//   //   .createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
//   //   .then(() => {
//   //     return collection.updateMany(
//   //       {},
//   //       {
//   //         $set: {
//   //           expireAt: date,
//   //         },
//   //       },
//   //       { upsert: true }
//   //     );
//   //   })
//   //   .finally(() => {
//   //     db.close();
//   //   });
// let stuff = await collection
//   .find({})
//   .toArray()
//   .finally(() => db.close());
// // console.log(stuff);
// let thing = makeDailyLeaderboard(stuff, 1, stuff.length, stuff.length);
// console.log(JSON.stringify(thing));

//   // let date = new Date();
//   // date.setHours(23, 59, 0, 0);

//   // console.log(date.toISOString());
//   // db.close();
//   // collection.create({
//   //   expireAt: new Date().setHours(23, 59, 0, 0),
//   //   score: 2.5,
//   //   tries: 4,
//   //   hardmode: true,
//   // });
//   // collection
//   //   .findOne(query)
//   // .then((doc) => {

//   // })
//   // .catch((err) => {
//   //   console.log(err);
//   // })
//   // .finally(() => {
//   //   db.close();
//   // });
// });
