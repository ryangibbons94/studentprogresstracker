const bcrypt = require("bcrypt");
const usersRouter = require("express").Router();
const User = require("../models/user");

//create a new user
usersRouter.post("/", async (request, response) => {
  const { username, email, role, name, password } = request.body;

  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return response.status(400).json({
      error: "username must be unique",
    });
  }

  if (password.length < 3) {
    return response.status(400).json({
      error: "password needs to be at least 3 characters long",
    });
  }

  if (!password) {
    return response.status(400).json({
      error: "you need a password",
    });
  }

  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const user = new User({
    username,
    name,
    email,
    role,
    passwordHash,
  });

  const savedUser = await user.save();

  response.status(201).json(savedUser);
});

//get all users
usersRouter.get("/", async (request, response) => {
  const users = await User.find({}).populate("students");

  response.json(users);
});

//update a user
usersRouter.put("/:id", (request, response, next) => {
  const body = request.body;

  const user = request.user;
  const userToUpdate = User.findById(request.params.id);

  if (userToUpdate._id.toString() !== user._id.toString()) {
    return response.status(401).json({
      error: "you cannot update another users account",
    });
  }

  const update = {
    username: body.username,
    name: body.name,
    email: body.email,
    role: body.role,
  };

  User.findByIdAndUpdate(request.params.id, update, { new: true })
    .then((updatedUser) => {
      response.json(updatedUser);
    })
    .catch((error) => next(error));
});

//delete a user
usersRouter.delete("/:id", async (request, response) => {
  const user = request.user;
  const userToDelete = await User.findById(request.params.id);

  if (userToDelete._id.toString() === user._id.toString()) {
    try {
      await User.findByIdAndRemove(request.params.id);
      response.status(204).end();
    } catch (exception) {
      next(exception);
    }
  } else {
    return response.status(401).json({ error: `Unauthorized` });
  }
});

module.exports = usersRouter;
