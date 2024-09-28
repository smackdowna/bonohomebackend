class ApiFeatures {
  constructor(query, queryStr) {
    this.query = query;
    this.queryStr = queryStr;
    console.log("queryStr", queryStr);

  }

  search() {
    const keyword = this.queryStr.keyword

      ? {
        $or: [
          { name: { $regex: this.queryStr.keyword, $options: "i" } },
          { description: { $regex: this.queryStr.keyword, $options: "i" } }
        ]
      }
      : {};
    console.log("keyword", keyword);
    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing fields that are not for filtering
    const removeFields = ["keyword", "page", "limit"];
    removeFields.forEach((key) => delete queryCopy[key]);

    // Handle array inputs for category, color, and age
    if (queryCopy.category && Array.isArray(queryCopy.category)) {
      queryCopy.category = { $in: queryCopy.category };
    }
    if (queryCopy.color && Array.isArray(queryCopy.color)) {
      queryCopy.color = { $in: queryCopy.color };
    }
    if (queryCopy.age && Array.isArray(queryCopy.age)) {
      queryCopy.age = { $in: queryCopy.age };
    }

    // Filter for price and other numeric fields
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  pagination(resultPerPage) {
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = resultPerPage * (currentPage - 1);
    this.query = this.query.limit(resultPerPage).skip(skip);
    return this;
  }
}

module.exports = ApiFeatures;


// class ApiFeatures {
//   constructor(query, queryStr) {
//     (this.query = query), (this.queryStr = queryStr);
//   }

//   search() {
//     const keyword = this.queryStr.keyword
//       ? {
//           name: {
//             $regex: this.queryStr.keyword,
//             $options: "i",
//           },
//         }
//       : {};

//     this.query = this.query.find({ ...keyword });
//     return this;
//   }

//   filter() {
//     const queryCopy = { ...this.queryStr };

//     //removing some fields for category,platform,prefrence,account type
//     const removeFields = ["keyword", "page", "limit"];
//     removeFields.forEach((key) => delete queryCopy[key]);

//     //filter for price

//     let queryStr = JSON.stringify(queryCopy);
//     queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (key) => `$${key}`);

//     this.query = this.query.find(JSON.parse(queryStr));
//     return this;
//   } 

//   pagination(resultPerPage) {
//     const currentPage = Number(this.queryStr.page) || 1;

//     const skip = resultPerPage * (currentPage - 1);

//     this.query = this.query.limit(resultPerPage).skip(skip);

//     return this;
//   }
// }

// module.exports = ApiFeatures;
