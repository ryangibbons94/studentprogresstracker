const mongoose = require("mongoose");
const supertest = require("supertest");
const bcrypt = require("bcrypt");
const app = require("../app");
const api = supertest(app);
const Weight = require("../models/weight");
const helper = require("./test_helper");
const User = require("../models/user");

beforeEach(async () => {
  await User.deleteMany({});

  const passwordHash = await bcrypt.hash("password", 10);
  const user = new User({
    username: "root",
    name: "adminko",
    weights: [],
    passwordHash,
  });

  await user.save();
});

beforeEach(async () => {
  await Weight.deleteMany({});
  await Weight.insertMany(helper.initialWeight);
});

test("weight logs are returned as json", async () => {
  await api
    .get("/api/weights")
    .expect(200)
    .expect("Content-Type", /application\/json/);
});

test("first log is correct", async () => {
  const allWeights = await helper.weightInDB();
  const firstWeight = allWeights[0].weight;
  expect(firstWeight).toBe(200);
});

test("unique identifier called id and not _id", async () => {
  const response = await api.get("/api/weights");
  expect(response.body[0].id).toBeDefined();
});

// test("post request adds a new log", async () => {
//   const newLog = { weight: 400 };

//   await api
//     .post("/api/weights")
//     .send(newLog)
//     .expect(201)
//     .expect("Content-Type", /application\/json/);

//   let logsAtEnd = await helper.weightInDB();
//   expect(logsAtEnd).toHaveLength(helper.initialWeight.length + 1);
// });

// test("deleting a log", async () => {
//   const weightAtStart = await helper.weightInDB();
//   const weightToDelete = weightAtStart[0];

//   await api.delete(`/api/weights/${weightToDelete.id}`);

//   const weightAtEnd = await helper.weightInDB();

//   expect(weightAtEnd).toHaveLength(helper.initialWeight.length - 1);
// });

test("change a weight", async () => {
  const weightAtStart = await helper.weightInDB();
  const logToUpdate = weightAtStart[0];

  const updatedLog = {
    ...logToUpdate,
    weight: 230,
  };

  await api.put(`/api/weights/${logToUpdate.id}`).send(updatedLog);

  const weightAtEnd = await helper.weightInDB();
  const endWeight = weightAtEnd[0].weight;
  expect(endWeight).toBe(230);
});

// test("cannot post a log without the weight", async () => {
//   const newLog = {};
//   await api.post("/api/weights").send(newLog).expect(400);
// });

describe("Testing POST request(s):", () => {
  let headers;

  beforeEach(async () => {
    const user = {
      username: "root",
      password: "password",
    };

    const loginUser = await api.post("/api/login").send(user);

    headers = {
      Authorization: `bearer ${loginUser.body.token}`,
    };
  });

  test("Adding new entrie to DB", async () => {
    const newWeight = {
      weight: 200,
    };

    await api
      .post("/api/weights")
      .send(newWeight)
      .expect(201)
      .set(headers)
      .expect("Content-Type", /application\/json/);

    const weightAtEnd = await helper.weightInDB();
    expect(weightAtEnd).toHaveLength(helper.initialWeight.length + 1);

    const contents = weightAtEnd.map((response) => response.weight);
    expect(contents).toContain(200);
  }, 10000);

  test("Adding new entrie to DB without auth token", async () => {
    const newWeight = {
      weight: 200,
    };

    await api.post("/api/weights").send(newWeight).expect(401);
  }, 10000);

  test("POST request without title and url", async () => {
    const newWeight = {};

    await api.post("/api/weights").send(newWeight).expect(400).set(headers);

    const weightAtEnd = await helper.weightInDB();
    expect(weightAtEnd).toHaveLength(helper.initialWeight.length);
  });
});

afterAll(() => {
  mongoose.connection.close();
});
