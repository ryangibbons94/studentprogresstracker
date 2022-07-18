const assignmentRouter = require("express").Router();
const Assignment = require("../models/assignment");
const Student = require("../models/student");

//POST

//add assignments
assignmentRouter.post("/", async (request, response) => {
  const body = request.body;

  const user = request.user;
  const student = body.student;

  if (!user) {
    return response.status(401).json({ error: "token is missing or invalid" });
    //parents cannot add assignment logs
  } else if (user.role === "Parent") {
    return response
      .status(401)
      .json({ error: "Parent Accounts cannot add assignment logs." });
  }

  const assignment = new Assignment({
    assignmentType: body.assignmentType,
    assignmentName: body.assignmentName,
    contentArea: body.contentArea,
    grade: body.grade,
    student: body.student,
  });
  const studenttoUpdate = await Student.findById(body.student);

  const savedAssignment = await assignment.save();
  studenttoUpdate.assignments = studenttoUpdate.assignments.concat(
    savedAssignment._id
  );
  await studenttoUpdate.save();
  response.status(201).json(savedAssignment);
});
//GET

//get all assignments
assignmentRouter.get("/", async (request, response) => {
  const assignment = await Assignment.find({}).populate("student");
  response.json(assignment);
});

//PUT

//update an assignment posting
assignmentRouter.put("/:id", (request, response) => {
  const body = request.body;
  const user = request.user;
  if (user.role === "Parent") {
    return response
      .status(401)
      .json({ error: "An assignment can only be updated by a teacher." });
  }
  const assignment = {
    assignmentType: body.assignmentType,
    assignmentName: body.assignmentName,
    contentArea: body.contentArea,
    grade: body.grade,
    student: body.student,
  };

  Assignment.findByIdAndUpdate(request.params.id, assignment, { new: true })
    .then((updatedAssignment) => {
      response.json(updatedAssignment);
    })
    .catch((error) => next(error));
});

//DELETE

//delete an assignment posting
assignmentRouter.delete("/:id", async (request, response, next) => {
  const user = request.user;

  const assignmentToDelete = await Assignment.findById(request.params.id);

  if (assignmentToDelete.user._id.toString() === user._id.toString()) {
    try {
      await Assignment.findByIdAndRemove(request.params.id);
      response.status(204).end();
    } catch (exception) {
      next(exception);
    }
  } else {
    return response.status(401).json({ error: `Unauthorized` });
  }
});

module.exports = assignmentRouter;
