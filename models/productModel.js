const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please Enter product Name"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please Enter product Description"],
  },
  keyFeatures: {
    type: String,
    required: [true, "Please Enter keyFeatures"],
  },
  specification: {
    type: String,
    required: [true, "Please Enter product specification"],
  },
  sizes: [
    {
      side: {
        type: String,
      },
      size: {
        type: String,
      },
      basePrice: {
        type: Number
      },
      discountedPercent: {
        type: Number
      },
      stock: {
        type: Number
      }
    }
  ],
  ratings: {
    type: Number,
    default: 0,
  },
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
  category: {
    type: String,
    required: [true, "Please Enter Product Category"],
  },
  gender: {
    enum: ["Male", "Female", "Unisex"],
    type: String,
    required: [true, "Please enter the gender"],
  },
  age: {
    type: String,
    required: [true, "Please enter age range (e.g., '2-5')"],
    validate: {
      validator: function (v) {
        return /^\d+-\d+$/.test(v);
      },
      message: props => `${props.value} is not a valid age range!`
    }
  },
  color: {
    type: String,
  },
  Availablecolor: {
    type: String,
  },
  numOfReviews: {
    type: Number,
    default: 0,
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      avatar: {
        type: String,
      },
      rating: {
        type: Number,
        required: true,
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// indexing the category age and colour fields
productSchema.index({ category: 1, age: 1, color: 1 });

module.exports = mongoose.model("Products", productSchema);
