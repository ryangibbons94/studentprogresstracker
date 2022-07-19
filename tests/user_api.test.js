const mongoose = require("mongoose");
const supertest = require("supertest");
const app = require("../app");
const api = supertest(app);
const Student = require("../models/student");
const Assignment = require("../models/assignment");

const helper = require("./test_helper");
const bcrypt = require("bcrypt");
const User = require("../models/user");

beforeEach(async () => {
  await User.deleteMany({});

  const teacherPasswordHash = await bcrypt.hash("teacher", 10);
  const teacher = new User({
    username: "teacherUser",
    email: "teacher@gmail.com",
    name: "teacher",
    role: "Teacher",
    passwordHash: teacherPasswordHash,
  });

  const parentPasswordHash = await bcrypt.hash("parent", 10);
  const parent = new User({
    username: "parentUser",
    email: "parent@gmail.com",
    name: "parent",
    role: "Parent",
    passwordHash: parentPasswordHash,
  });
  const teacherTwo = new User({
    username: "teacherUserTwo",
    email: "teacher@gmail.com",
    name: "teacher",
    role: "Teacher",
    passwordHash: teacherPasswordHash,
  });

  await teacher.save();
  await parent.save();
  await teacherTwo.save();
});

describe("testing user capabilities", () => {
  test("a teacher account can be added", async () => {
    const totalUsers = await helper.usersInDb();
    expect(totalUsers).toHaveLength(3);
    expect(totalUsers[0].name).toBe(helper.initialUsers[0].name);
  });

  test("a parent account can be added", async () => {
    const totalUsers = await helper.usersInDb();
    expect(totalUsers).toHaveLength(3);
    expect(totalUsers[1].name).toBe(helper.initialUsers[1].name);
  });

  // test("creation succeeds with a fresh username", async () => {
  //   const usersAtStart = await helper.usersInDb();

  //   const newUser = {
  //     username: "mluukkai",
  //     name: "Matti Luukkainen",
  //     password: "salainen",
  //   };

  //   await api
  //     .post("/api/users")
  //     .send(newUser)
  //     .expect(201)
  //     .expect("Content-Type", /application\/json/);

  //   const usersAtEnd = await helper.usersInDb();
  //   expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);

  //   const usernames = usersAtEnd.map((u) => u.username);
  //   expect(usernames).toContain(newUser.username);
  // });

  // test("creation fails with proper statuscode and message if username already taken", async () => {
  //   const usersAtStart = await helper.usersInDb();

  //   const newUser = {
  //     username: "root",
  //     name: "Superuser",
  //     password: "salainen",
  //   };

  //   const result = await api
  //     .post("/api/users")
  //     .send(newUser)
  //     .expect(400)
  //     .expect("Content-Type", /application\/json/);

  //   expect(result.body.error).toContain("username must be unique");

  //   const usersAtEnd = await helper.usersInDb();
  //   expect(usersAtEnd).toEqual(usersAtStart);
  // });

  // test("cannot create user with too short of a username", async () => {
  //   const newUser = {
  //     username: "r",
  //     name: "Superuser",
  //     password: "salainen",
  //   };

  //   const result = await api
  //     .post("/api/users")
  //     .send(newUser)
  //     .expect(400)
  //     .expect("Content-Type", /application\/json/);

  //   expect(result.body.error).toContain("shorter");
  // });

  // test("cannot create user with too short of a password", async () => {
  //   const usersAtStart = await helper.usersInDb();

  //   const newUser = {
  //     username: "ryansdfg",
  //     name: "Superuser",
  //     password: "a",
  //   };

  //   const result = await api
  //     .post("/api/users")
  //     .send(newUser)
  //     .expect(400)
  //     .expect("Content-Type", /application\/json/);

  //   expect(result.body.error).toContain(
  //     "password needs to be at least 3 characters long"
  //   );
  // });

  // test("cannot create user with no password", async () => {
  //   const usersAtStart = await helper.usersInDb();

  //   const newUser = {
  //     name: "Superuser",
  //     password: "asd",
  //   };

  //   const result = await api
  //     .post("/api/users")
  //     .send(newUser)
  //     .expect(400)
  //     .expect("Content-Type", /application\/json/);

  //   expect(result.body.error).toContain("username");
  // });
});

describe("testing constraints", () => {
  beforeEach(async () => {
    const teacher = {
      username: "teacherUser",
      password: "teacher",
    };

    const parent = {
      username: "parentUser",
      password: "parent",
    };

    const teacherTwo = {
      username: "teacherUserTwo",
      password: "teacher",
    };

    const loginParentUser = await api.post("/api/login").send(parent);

    const loginTeacherUser = await api.post("/api/login").send(teacher);

    const loginTeacherUserTwo = await api.post("/api/login").send(teacherTwo);

    teacherTwoHeaders = {
      Authorization: `bearer ${loginTeacherUserTwo.body.token}`,
    };

    teacherHeaders = {
      Authorization: `bearer ${loginTeacherUser.body.token}`,
    };

    parentHeaders = {
      Authorization: `bearer ${loginParentUser.body.token}`,
    };

    await Student.deleteMany({});
  });

  test("a student can be added by a teacher", async () => {
    const newStudent = {
      name: "bobby",
      age: 4,
    };

    await api
      .post("/api/students")
      .send(newStudent)
      .expect(201)
      .set(teacherHeaders)
      .expect("Content-Type", /application\/json/);
  });

  test("a parent cannot add a student account", async () => {
    const newStudent = {
      name: "jonny",
      age: 4,
    };

    const result = await api
      .post("/api/students")
      .send(newStudent)
      .expect(401)
      .set(parentHeaders)
      .expect("Content-Type", /application\/json/);
    expect(result.body.error).toContain("Parent Accounts cannot add students");
  });

  test("an assignment can be created", async () => {
    const newStudent = {
      name: "bobby",
      age: 4,
    };

    await api
      .post("/api/students")
      .send(newStudent)
      .expect(201)
      .set(teacherHeaders)
      .expect("Content-Type", /application\/json/);

    const students = await helper.studentsInDB();
    expect(students).toHaveLength(1);
    const studentID = students[0].id;

    const assignment = {
      assignmentType: "Academic",
      assignmentName: "Reading",
      contentArea: "Reading",
      grade: "50",
      student: studentID,
    };

    await api
      .post("/api/assignments")
      .send(assignment)
      .expect(201)
      .set(teacherHeaders)
      .expect("Content-Type", /application\/json/);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
