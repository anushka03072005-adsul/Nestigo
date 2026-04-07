const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose").default || require("passport-local-mongoose");

const UserSchema = new Schema({
    email :{
        type : String,
        required : true,
    },
    wishlist: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing"
  }
],

});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);