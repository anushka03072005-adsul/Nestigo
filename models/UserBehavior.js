const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userBehaviorSchema = new Schema({

user:{
type: Schema.Types.ObjectId,
ref:"User"
},

viewedListings:[
{
type: Schema.Types.ObjectId,
ref:"Listing"
}
],

lastCategory:String,

searches:[String],

bookings:[
{
type: Schema.Types.ObjectId,
ref:"Booking"
}
]

},{
timestamps:true
});

module.exports = mongoose.model("UserBehavior",userBehaviorSchema);