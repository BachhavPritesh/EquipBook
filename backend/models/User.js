import mongoose from "mongoose";
import bcrypt from "bcryptjs";

// The five project roles. Manager and admin are the staff roles.
export const USER_ROLES = [
  "student",
  "employee",
  "faculty",
  "manager",
  "admin",
];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: {
        values: USER_ROLES,
        message: "Role must be student, employee, faculty, manager or admin",
      },
      default: "student",
    },
    department: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

// Hash the password before saving it for the first time.
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

// Compare a plain password with the stored hash.
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove private fields and expose the frontend-friendly `id` field.
userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
  },
});

const User = mongoose.model("User", userSchema);

export default User;
