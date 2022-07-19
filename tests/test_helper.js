// const WeigStduht = require("../models/weight");
const User = require("../models/user");
const Student = require("../models/student");

const initialUsers = [
  {
    username: "teacherUser",
    email: "teacher@gmail.com",
    name: "teacher",
    role: "Teacher",
    password: "teacher",
  },
  {
    username: "parentUser",
    email: "parent@gmail.com",
    name: "parent",
    role: "Parent",
    password: "parent",
  },
];

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

const studentsInDB = async () => {
  const students = await Student.find({});
  return students.map((u) => u.toJSON());
};

module.exports = {
  initialUsers,
  usersInDb,
  studentsInDB,
};
