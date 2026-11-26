import mongoose from "mongoose";
import bcrypt from "bcrypt";

const authSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

authSchema.pre("save",async function(next){
    try{
        const salt= await bcrypt.gensalt(10);
        const hashedPassword =await bcrypt.hash(this.password, salt);
        this.password = hashedPassword
        next()
    }catch(err) {
        console.log(err)
    }
})

authSchema.method.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
}

export const Auth = mongoose.model("Auth", authSchema);

