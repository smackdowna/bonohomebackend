const express = require("express");
const { isAuthenticatedUser, authorizeRoles } = require("../middleware/auth");
const {
  createProduct,
  getAllProducts,
  updateProduct,
  deleteProduct,
  getAdminProducts,
} = require("../controllers/freebiesController");
const multipleUpload = require("../middleware/multipleMulter");

const router = express.Router();

//create product
router
  .route("/createfreebiesproduct")
  .post(
    isAuthenticatedUser,
    authorizeRoles("admin"),
    multipleUpload,
    createProduct
  );

router.route("/freebies").get(getAllProducts);

router.route("/admin/freebiesproduct").get(isAuthenticatedUser,authorizeRoles("admin"),getAdminProducts);

router
  .route("/freebiesproduct/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"),multipleUpload, updateProduct)
  .delete(isAuthenticatedUser, authorizeRoles("admin"),deleteProduct);
module.exports = router;
