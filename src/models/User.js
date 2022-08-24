import { Schema, model } from "mongoose";
import { compare, hash } from "bcryptjs";
import { SECRET } from "../constants";
import { randomBytes } from "crypto";
import { sign } from "jsonwebtoken";
import { pick } from "lodash";

const UserSchema = new Schema(
  {
    avatar: {
      type: String,
      required: false,
      default: null,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: [true, "email required"],
      unique: [true, "email already registered"],
    },
    password: {
      type: String,
    },
    source: { type: String, required: [true, "source not specified"] },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  let user = this;
  if (!user.password) return next();
  if (!user.isModified("password")) return next();
  user.password = await hash(user.password, 10);
  next();
});

UserSchema.methods.comparePassword = async function (password) {
  return await compare(password, this.password);
};

UserSchema.methods.generateJWT = async function () {
  let payload = {
    name: this.name,
    email: this.email,
    id: this._id,
  };

  return await sign(payload, SECRET, { expiresIn: "30 days" });
};

UserSchema.methods.getUserInfo = function () {
  return pick(this, ["_id", "email", "name", "avatar"]);
};

const User = model("users", UserSchema);
export default User;
