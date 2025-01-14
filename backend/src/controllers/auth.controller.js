import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../lib/utils.js";
import cloudinary from "../lib/cloudinary.js";
export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    
    try {
        if (!fullName || !email || !password){
            return res.status(200).json({
                message: `All fields are required`,
            });
        }
        // Signup the user
        if(password.length < 6) {
            return res.status(400).json({
                message: "Password must be atleast 6 characters."
            });
        }
        
        const user = await User.findOne({email});

        if (user) {
            return res.status(400).json({
                message: "User already exists"
            });
        }
        // Hash their password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User ({
            fullName: fullName,
            email: email,
            password: hashedPassword,
        })
        
        if (newUser) {
            // Generate JWT token
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePicture: newUser.profilePicture,
            });


        } else {
            return res.status(400).json({
                message: "Invalid user data"
            });
        }

    } catch(error){
        console.log("Error in signing up controller", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const signin = async (req, res) => {
    try{
        // We get email and password from the req
        const { email, password } = req.body;
        // First check if the user exists
        const user = await User.findOne({email});
        if (!user){
            res.status(400).json({
                message: "Invalid Credentials",
            });
        }
        // If yes, then check if the password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            res.status(400).json({
                message: "Invalid Credentials",
            });
        }

        generateToken(user._id, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            profilePicture: user.profilePicture,
        });
    } catch(error){
        console.log("Error in login controller", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const signout = (req, res) => {
    try{
        res.cookie("jwt", "", {maxAge: 0});
        res.status(200).json({
            message: "Signed Out Successfully",
        });
    } catch(error){
        console.log("Error in signout controller", error.message);
        res.status(400).json({
            message: "Internal Server Error",
        });
    }
};

export const updateProfile = async (req, res) => {
    try{
        const {profilePicture} = req.body;
    const userId = req.user._id;

    if (!profilePicture) {
        return res.status(400).json({
            message: "Profile picture is required",
        });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePicture);
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {profilePicture: uploadResponse.secure_url},
        {new: true}
    );

    res.status(200).json(updatedUser);
    } catch(error){
        console.log("Error in profile update router", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch(error){
        console.log("Error in checkAuth controller", error.message);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
}