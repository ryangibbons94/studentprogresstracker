const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  assignmentType: {
    type: String,
    required: true,
    enum: ["Academic", "Behavioral"],
  },
  assignmentName: {
    type: String,
    required: true,
  },
  contentArea: String,
  grade: {
    type: Number,
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
});

assignmentSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
  },
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

module.exports = Assignment;
