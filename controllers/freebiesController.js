const Product = require("../models/freebiesModel");
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
    sizes,
    color,
  } = req.body;
  const images = req.files; // Assuming you are using multer or similar middleware for multiple file uploads

  if (
    !name ||
    !description ||
    !sizes ||
    !color
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
    sizes,
    color,
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
  const freebiesCount = await Product.countDocuments();
  freebies = await Product.find().sort({ createdAt: -1 });

  
  res.status(200).json({
    success: true,
    freebies,
    freebiesCount
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


// Update Product -- Admin
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHander("Product not found", 404));
  }

  // Update product details
  product.name = req.body.name || product.name;
  product.description = req.body.description || product.description;
  product.color = req.body.color || product.color;

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
    }
  }
}


  await product.save();
  myCache.del("all-products");

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
  await product.deleteOne();
  myCache.del("all-products", "categories");

  res.status(200).json({
    success: true,
    message: "Product Deleted Successfully",
  });
});
