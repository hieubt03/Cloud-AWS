// AUTH , IS STUDENT , IS INSTRUCTOR , IS ADMIN

const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.auth = (req, res, next) => {
  try {
    const token =
      req.body?.token ||
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token is Missing",
      });
    }
    try {
      const decode = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decode;
    } catch (error) {
      console.log("Error while decoding token");
      console.log(error);
      return res.status(401).json({
        success: false,
        error: error.message,
        messgae: "Error while decoding token",
      });
    }
    next();
  } catch (error) {
    console.log("Error while token validating");
    console.log(error);
    return res.status(500).json({
      success: false,
      messgae: "Error while token validating",
    });
  }
};

exports.isStudent = (req, res, next) => {
  try {
    if (req.user?.accountType != "Student") {
      return res.status(401).json({
        success: false,
        messgae: "This Page is protected only for student",
      });
    }
    next();
  } catch (error) {
    console.log("Error while cheching user validity with student accountType");
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
      messgae: "Error while cheching user validity with student accountType",
    });
  }
};

exports.isInstructor = (req, res, next) => {
  try {
    if (req.user?.accountType != "Instructor") {
      return res.status(401).json({
        success: false,
        messgae: "This Page is protected only for Instructor",
      });
    }
    next();
  } catch (error) {
    console.log(
      "Error while cheching user validity with Instructor accountType"
    );
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
      messgae: "Error while cheching user validity with Instructor accountType",
    });
  }
};

exports.isAdmin = (req, res, next) => {
  try {
    if (req.user.accountType != "Admin") {
      return res.status(401).json({
        success: false,
        messgae: "This Page is protected only for Admin",
      });
    }
    next();
  } catch (error) {
    console.log("Error while cheching user validity with Admin accountType");
    console.log(error);
    return res.status(500).json({
      success: false,
      error: error.message,
      messgae: "Error while cheching user validity with Admin accountType",
    });
  }
};
