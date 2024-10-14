// resolver
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


const User = mongoose.model("User");
const Quotes = mongoose.model("Quotes");
import "./models/User.js";
import "./models/Quotes.js";

const resolver = {
  Query: {
    users: async () => await User.find({}),

    user: async (_, {_id}) => await User.findOne({_id}),

    quotes:async ()=>await Quotes.find({}).populate("by","_id firstName"),

    iquote: async (_, {by}) => await Quotes.find({by}),

    myProfile: async (_,arg,{userId}) =>{
      if (!userId) throw new Error("You must be logged in ");
      return await User.findOne({_id:userId})
    }
  },
  User: {
    quotes: async (ur) => await Quotes.find({ by: ur._id }),
  },

  Mutation: {
    signupUser: async (_, { UserNew }) => {
      const user = await User.findOne({ email: UserNew.email });
      if (user) {
        throw new Error("User already exist with that email");
      }
      const hashPassword = await bcrypt.hash(UserNew.password, 12);

      const newUser = new User({
        ...UserNew,
        password: hashPassword,
      });
      return await newUser.save();
    },
    signinUser: async (_, { UserSignin }) => {
      const user = await User.findOne({ email: UserSignin.email });
      if (!user) {
        throw new Error(
          "User does not exist with that email please signUp again.!"
        );
      }
      const doMatch = await bcrypt.compare(UserSignin.password, user.password);
      if (!doMatch) {
        throw new Error("Email or password are invalid .!");
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
      return { token };
    },
    createQuote: async (_, { name }, { userId }) => {
      if (!userId) throw new Error("You must be logged in ");
      const newQuote = new Quotes({
        name,
        by: userId,
      });
      await newQuote.save();
      return "Quote successfully saved..!";
    },
  },
};

export default resolver;
