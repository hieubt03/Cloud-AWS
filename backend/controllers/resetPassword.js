const User = require("../models/user");
const mailSender = require("../utils/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

exports.resetPasswordToken = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Your Email is not registered with us",
      });
    }

    const token = crypto.randomBytes(20).toString("hex");

    const updatedUser = await User.findOneAndUpdate(
      { email: email },
      { token: token, resetPasswordTokenExpires: Date.now() + 5 * 60 * 1000 },
      { new: true }
    );

    const url = `https://study-notion-mern-stack.netlify.app/update-password/${token}`;

    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link : ${url}`
    );

    res.status(200).json({
      success: true,
      message:
        "Email sent successfully , Please check your mail box and change password",
    });
  } catch (error) {
    console.log("Error while creating token for reset password");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error while creating token for reset password",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const token =
      req.body?.token ||
      req.cookies?.token ||
      req.header("Authorization")?.replace("Bearer ", "");

    const { password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "All fiels are required...!",
      });
    }

    if (password !== confirmPassword) {
      return res.status(401).json({
        success: false,
        message: "Passowrds are not matched",
      });
    }

    const userDetails = await User.findOne({ token: token });

    if (token !== userDetails.token) {
      return res.status(401).json({
        success: false,
        message: "Password Reset token is not matched",
      });
    }

    if (!(userDetails.resetPasswordTokenExpires > Date.now())) {
      return res.status(401).json({
        success: false,
        message: "Token is expired, please regenerate token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate(
      { token },
      { password: hashedPassword },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log("Error while reseting password");
    console.log(error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Error while reseting password12",
    });
  }
};
