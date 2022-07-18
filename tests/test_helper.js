const Weight = require("../models/weight");
const User = require("../models/user");

const initialWeight = [{ weight: 200 }, { weight: 150 }];

const initialUsers = [
  {
    username: "superuser",
    name: "root",
    password: "admin",
  },
  {
    username: "ryan",
    name: "ryan",
    password: "ryan",
  },
];

const weightInDB = async () => {
  const weights = await Weight.find({});
  return weights.map((weight) => weight.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

module.exports = {
  initialWeight,
  initialUsers,
  weightInDB,
  usersInDb,
};
