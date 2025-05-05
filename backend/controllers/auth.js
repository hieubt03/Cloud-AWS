// sendOtp , signup , login ,  changePassword
const User = require("./../models/user");
const Profile = require("./../models/profile");
const optGenerator = require("otp-generator");
const OTP = require("../models/OTP");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const cookie = require("cookie");
const mailSender = require("../utils/mailSender");
const otpTemplate = require("../mail/templates/emailVerificationTemplate");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const checkUserPresent = await User.findOne({ email });

    if (checkUserPresent) {
      console.log("(when otp generate) User alreay registered");
      return res.status(401).json({
        success: false,
        message: "User is Already Registered",
      });
    }

    const otp = optGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const name = email
      .split("@")[0]
      .split(".")
      .map((part) => part.replace(/\d+/g, ""))
      .join(" ");
    console.log(name);

    await mailSender(email, "OTP Verification Email", otpTemplate(otp, name));

    const otpBody = await OTP.create({ email, otp });
    res.status(200).json({
      success: true,
      otp,
      message: "Otp sent successfully",
    });
  } catch (error) {
    console.log("Error while generating Otp - ", error);
    res.status(200).json({
      success: false,
      message: "Error while generating Otp",
      error: error.mesage,
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !accountType ||
      !otp
    ) {
      return res.status(401).json({
        success: false,
        message: "All fields are required..!",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        messgae:
          "passowrd & confirm password does not match, Please try again..!",
      });
    }

    const checkUserAlreadyExits = await User.findOne({ email });

    if (checkUserAlreadyExits) {
      return res.status(400).json({
        success: false,
        message: "User registered already, go to Login Page",
      });
    }

    const recentOtp = await OTP.findOne({ email })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!recentOtp || recentOtp.length == 0) {
      return res.status(400).json({
        success: false,
        message: "Otp not found in DB, please try again",
      });
    } else if (otp !== recentOtp.otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid Otp",
      });
    }

    let hashedPassword = await bcrypt.hash(password, 10);

    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    let approved = "";
    approved === "Instructor" ? (approved = false) : (approved = true);

    const userData = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      contactNumber,
      accountType: accountType,
      additionalDetails: profileDetails._id,
      approved: approved,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });

    res.status(200).json({
      success: true,
      message: "User Registered Successfully",
    });
  } catch (error) {
    console.log("Error while registering user (signup)");
    console.log(error);
    res.status(401).json({
      success: false,
      error: error.message,
      messgae: "User cannot be registered , Please try again..!",
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let user = await User.findOne({ email }).populate("additionalDetails");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "You are not registered with us",
      });
    }

    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "24h",
      });

      user = user.toObject();
      user.token = token;
      user.password = undefined;

      const cookieOptions = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
        httpOnly: true,
      };

      res.cookie("token", token, cookieOptions).status(200).json({
        success: true,
        user,
        token,
        message: "User logged in successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password not matched",
      });
    }
  } catch (error) {
    console.log("Error while Login user");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      messgae: "Error while Login user",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmNewPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message: "All fileds are required",
      });
    }

    const userDetails = await User.findById(req.user.id);

    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userDetails.password
    );

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is Incorrect",
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(403).json({
        success: false,
        message: "The password and confirm password do not match",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUserDetails = await User.findByIdAndUpdate(
      req.user.id,
      { password: hashedPassword },
      { new: true }
    );

    try {
      const emailResponse = await mailSender(
        updatedUserDetails.email,
        "Password for your account has been updated",
        passwordUpdated(
          updatedUserDetails.email,
          `Password updated successfully for ${updatedUserDetails.firstName} ${updatedUserDetails.lastName}`
        )
      );
    } catch (error) {
      console.error("Error occurred while sending email:", error);
      return res.status(500).json({
        success: false,
        message: "Error occurred while sending email",
        error: error.message,
      });
    }
    res.status(200).json({
      success: true,
      mesage: "Password changed successfully",
    });
  } catch (error) {
    console.log("Error while changing passowrd");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      messgae: "Error while changing passowrd",
    });
  }
};
