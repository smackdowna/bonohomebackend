const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhandler");
const catchAsyncErrors = require("../middleware/catchAsyncError");
const ApiFeatures = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
const getDataUri = require("../utils/dataUri");
const User = require("../models/UserModel");
const { myCache } = require("../app");

//Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  const {
    name,
    description,
    keyFeatures,
    specification,
    sizes,
    category,
    sub_category,
    sub_category2,
    color,
    Availablecolor,
  } = req.body;
  const images = req.files; // Assuming you are using multer or similar middleware for multiple file uploads

  if (
    !name ||
    !description ||
    !keyFeatures ||
    !specification ||
    !sizes ||
    !category ||
    !sub_category ||
    !color ||
    !Availablecolor
  ) {
    return next(new ErrorHander("All Field Required", 404));
  }

  const productImages = [];

  if (images && images.length > 0) {
    for (const image of images) {
      const fileUri = getDataUri(image);
      const mycloud = await cloudinary.v2.uploader.upload(fileUri.content);

      productImages.push({
        public_id: mycloud.public_id,
        url: mycloud.secure_url,
      });
    }
  }

  await Product.create({
    name,
    description,
    keyFeatures,
    specification,
    sizes,
    category,
    sub_category,
    sub_category2,
    color,
    Availablecolor,
    images: productImages,
  });

  myCache.del("all-products", "categories");

  res.status(201).json({
    success: true,
    message: "Product Created Successfully",
  });
});

// Get All Product
exports.getAllProducts = catchAsyncErrors(async (req, res, next) => {
  const productsCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(
    Product.find().sort({ createdAt: -1 }),
    req.query
  )
    .search()
    .filter();

  let products = await apiFeature.query;

  let filteredProductsCount = products.length;

  products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    filteredProductsCount,
  });
});

//get All categories
exports.getAllCategories = catchAsyncErrors(async (req, res, next) => {
  let categories;

  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories"));
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  res.status(200).json({
    success: true,
    categories,
  });
});

// get all admin products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const productsCount = await Product.countDocuments();
  let products;
  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products"));
  } else {
    products = await Product.find().sort({ createdAt: -1 });
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    products,
    productsCount,
  });
});

// Get Product Details
exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Update product details
  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.keyFeatures = req.body.keyFeatures || product.keyFeatures;
  product.specification = req.body.specification || product.specification;
  product.category = req.body.category || product.category;
  product.sub_category = req.body.sub_category || product.sub_category;
  product.sub_category2 = req.body.sub_category2 || product.sub_category2;
  product.color = req.body.color || product.color;
  product.Availablecolor = req.body.Availablecolor || product.Availablecolor;
  product.numOfReviews = req.body.numOfReviews || product.numOfReviews;

  // Update sizes array if provided in the request
if (req.body.sizes && req.body.sizes.length > 0) {
  // Iterate over each size object provided in the request
  for (const updatedSize of req.body.sizes) {
    // Log the updatedSize._id for comparison

    // Find the corresponding size object in product.sizes
    const sizeToUpdate = product.sizes.find(size => size._id.toString() === updatedSize._id.toString());

    

    // If the size object is found
    if (sizeToUpdate) {
      // Update each field of the size object if provided in the request
      sizeToUpdate.size = updatedSize.size !== undefined ? updatedSize.size : sizeToUpdate.size;
      sizeToUpdate.stock = updatedSize.stock !== undefined ? updatedSize.stock : sizeToUpdate.stock;
      sizeToUpdate.basePrice = updatedSize.basePrice !== undefined ? updatedSize.basePrice : sizeToUpdate.basePrice;
      sizeToUpdate.discountedPercent = updatedSize.discountedPercent !== undefined ? updatedSize.discountedPercent : sizeToUpdate.discountedPercent;
      sizeToUpdate.side = updatedSize.side !== undefined ? updatedSize.side : sizeToUpdate.side;
    }
  }
}


  await product.save();
  myCache.del("all-products", "categories");

  // Handle image updates
  const images = req.files; // Assuming you are using multer or similar middleware for multiple file uploads

  if (images && images.length > 0) {
    const updatedImages = [];

    for (const image of images) {
      const fileUri = getDataUri(image);
      const myCloud = await cloudinary.uploader.upload(fileUri.content);

      updatedImages.push({
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      });
    }

    // Delete existing images from Cloudinary
    if (product.images && product.images.length > 0) {
      for (const existingImage of product.images) {
        await cloudinary.uploader.destroy(existingImage.public_id);
      }
    }

    // Update product with new images
    product.images = updatedImages;
    await product.save();
    myCache.del("all-products", "categories");
  }

  res.status(200).json({
    success: true,
    product,
  });
});

//delete product
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const productId = req.params.id;

  // Find the product to be deleted
  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Delete images from Cloudinary
  if (product.images && product.images.length > 0) {
    for (const image of product.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  // Remove the product from wishlists of all users
  await User.updateMany(
    { "wishlist.product": productId },
    { $pull: { wishlist: { product: productId } } }
  );

  // Remove the product itself
  await product.remove();
  myCache.del("all-products", "categories");

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});

// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  if (!comment || !rating || !productId)
    return next(new ErrorHander("Please Enter Your Comments and Ratings", 400));

  const review = {
    user: req.user._id,
    name: req.user.full_name,
    avatar: req.user.avatar.url,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    message: "Your Review is Submitted",
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});

// Delete Review
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  const reviews = product.reviews.filter(
    (rev) => rev._id.toString() !== req.query.id.toString()
  );

  let avg = 0;

  reviews.forEach((rev) => {
    avg += rev.rating;
  });

  let ratings = 0;

  if (reviews.length === 0) {
    ratings = 0;
  } else {
    ratings = avg / reviews.length;
  }

  const numOfReviews = reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    message: "Review Deleted",
  });
});
