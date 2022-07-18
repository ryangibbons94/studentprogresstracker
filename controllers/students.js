const studentRouter = require("express").Router();
const Student = require("../models/student");
const User = require("../models/user");

//POST

//creating a student and assigning them to a teacher
studentRouter.post("/", async (request, response) => {
  const body = request.body;
  const user = request.user;
  const role = user.role;
  //if there isn't a logged in user then a student cannot be added
  if (!user) {
    return response.status(401).json({ error: "token is missing or invalid" });
    //parent accounts cannot make students, only teachers can(parents will be added as a user to the student)
  } else if (role === "Parent") {
    return response
      .status(401)
      .json({ error: "Parent Accounts cannot add students" });
  }
  const student = new Student({
    name: body.name,
    age: body.age,
    users: [user._id],
  });

  const savedStudent = await student.save();
  user.students = user.students.concat(savedStudent._id);
  await user.save();
  response.status(201).json(savedStudent);
});

//GET

//get all students
studentRouter.get("/", async (request, response) => {
  const students = await Student.find({})
    .populate("users")
    .populate("assignments");

  response.json(students);
});

//get a single student
studentRouter.get("/:id", (request, response) => {
  let student = Student.findById(request.params.id);
  const users = student.users;
  const user = request.user;
  if (users.includes(user)) {
    Student.findById(request.params.id)
      .then((student) => {
        if (student) {
          response.json(student);
        } else {
          response.status(404).end();
        }
      })
      .catch((error) => next(error));
  }
});

//PUT

//adding a parent to a student
studentRouter.put("/addparent/:id", async (request, response) => {
  const body = request.body;
  const user = request.user;
  const newUser = await User.findById(body.newUser);
  if (newUser.role === "Teacher") {
    return response
      .status(401)
      .json({ error: "A student can only be assigned to one teacher." });
  } else {
    const student = {
      name: body.name,
      age: body.age,
      users: [user._id, newUser._id],
    };

    Student.findByIdAndUpdate(request.params.id, student, { new: true })
      .then((updatedStudent) => {
        newUser.students = newUser.students.concat(updatedStudent._id);
        newUser.save();
        response.json(updatedStudent);
      })
      .catch((error) => next(error));
  }
});

//updating a student
studentRouter.put("/:id", (request, response) => {
  const body = request.body;
  const user = request.user;
  if (user.role === "Parent") {
    return response
      .status(401)
      .json({ error: "A student can only be updated by a teacher." });
  }
  const student = {
    name: body.name,
    age: body.age,
    users: body.users,
  };

  Student.findByIdAndUpdate(request.params.id, student, { new: true })
    .then((updatedStudent) => {
      response.json(updatedStudent);
    })
    .catch((error) => next(error));
});

//DELETE

//deleting a student
studentRouter.delete("/:id", async (request, response, next) => {
  const user = request.user;
  if (user.role === "Parent") {
    return response
      .status(401)
      .json({ error: "A student can only be deleted by a teacher." });
  }

  const studentToDelete = await Student.findById(request.params.id);

  if (studentToDelete.user._id.toString() === user._id.toString()) {
    try {
      await Student.findByIdAndRemove(request.params.id);
      response.status(204).end();
    } catch (exception) {
      next(exception);
    }
  } else {
    return response.status(401).json({ error: `Unauthorized` });
  }
});

module.exports = studentRouter;
