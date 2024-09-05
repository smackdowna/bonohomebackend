const mongoose = require("mongoose");

const freebiesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter freebies Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter freebies Description"],
  },
  sizes:[
    {
      size:{
        type:String,
      },
      stock:{
        type:Number
      }
    }
  ],
  images: [
    {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
  ],
  color: {
    type: String, 
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Freebies", freebiesSchema);
