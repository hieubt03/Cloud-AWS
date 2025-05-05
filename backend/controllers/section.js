const Course = require("../models/course");
const Section = require("../models/section");

exports.createSection = async (req, res) => {
  try {
    const { sectionName, courseId } = req.body;

    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const newSection = await Section.create({ sectionName });

    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    );

    const updatedCourseDetails = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    });

    res.status(200).json({
      success: true,
      updatedCourseDetails,
      message: "Section created successfully",
    });
  } catch (error) {
    console.log("Error while creating section");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error while creating section",
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    const { sectionName, sectionId, courseId } = req.body;

    if (!sectionId) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    await Section.findByIdAndUpdate(sectionId, { sectionName }, { new: true });

    const updatedCourseDetails = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    });

    res.status(200).json({
      success: true,
      data: updatedCourseDetails,
      message: "Section updated successfully",
    });
  } catch (error) {
    console.log("Error while updating section");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error while updating section",
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    const { sectionId, courseId } = req.body;

    await Section.findByIdAndDelete(sectionId);

    const updatedCourseDetails = await Course.findById(courseId).populate({
      path: "courseContent",
      populate: {
        path: "subSection",
      },
    });

    res.status(200).json({
      success: true,
      data: updatedCourseDetails,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.log("Error while deleting section");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error while deleting section",
    });
  }
};
