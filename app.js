const express = require("express");
const app = express();
app.use(express.json());

// const { open } = require("sqlite");
const sqlite = require("sqlite");
const { open } = sqlite;
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "product.db");
// console.log(dbPath);

let db = null;

const initializeDBandServer = async () => {
  try {
    db = await open({ filename: dbPath, driver: sqlite3.Database });
    app.listen(3000, () => {
      console.log("Server is Running on Port:3000");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initializeDBandServer();

const convertDBObjectToResponseObject = (dbObject) => {
  return {
    productId: dbObject.product_id,
    quantity: dbObject.quantity,
  };
};

app.get("/products/", async (request, response) => {
  const getAllProductsQuery = `
                                    SELECT *
                                    FROM product
                                    `;
  const dbResponse = await db.all(getAllProductsQuery);
  //   console.log(dbResponse);

  const responseArray = dbResponse.map((eachItem) =>
    convertDBObjectToResponseObject(eachItem)
  );
  response.send(responseArray);
});

app.post("/products/", async (request, response) => {
  //   const createTableQuery = `
  //                               CREATE TABLE product
  //                               (product_id INT PRIMARY KEY,
  //                               quantity INT)
  //                                   `;
  //   const dbResponse1 = await db.run(createTableQuery);

  const payLoad = request.body;
  //   console.log(payLoad);

  payLoad.forEach(async (eachItem) => {
    try {
      const { productId, quantity, operation } = eachItem;
      //   console.log(productId, quantity, operation);

      const checkIfProductExists = `
                                  SELECT *
                                  FROM product
                                  WHERE product_id=${productId}
                                  `;
      const dbResponse1 = await db.get(checkIfProductExists);
      //   console.log(dbResponse1);

      if (dbResponse1 === undefined) {
        if (operation === "add") {
          const createProductQuery = `
                                    INSERT INTO product(product_id,quantity)
                                    values(${productId},${quantity})
                                    `;
          const dbResponse2 = await db.run(createProductQuery);
          console.log("New Product(s) Created Successfully");
        } else {
          console.log("No Such Product(s) Exist to Subtract");
        }
      } else {
        if (operation === "add") {
          const updateProductQuantityQuery = `
                                    UPDATE product
                                    SET quantity = quantity+${quantity}
                                    WHERE product_id=${productId}
                                    `;
          const dbResponse2 = await db.run(updateProductQuantityQuery);
          console.log("New Quantity Updated Successfully After Add Operation");
        } else {
          const checkForQuantity = `
                                  SELECT *
                                  FROM product
                                  WHERE product_id=${productId}
                                  `;
          const dbResponse1 = await db.get(checkIfProductExists);
          //   console.log(dbResponse1.quantity);

          if (dbResponse1.quantity - quantity >= 0) {
            const updateProductQuantityQuery = `
                                    UPDATE product
                                    SET quantity = quantity-${quantity}
                                    WHERE product_id=${productId}
                                    `;
            const dbResponse2 = await db.run(updateProductQuantityQuery);
            console.log(
              "New Quantity Updated Successfully After Subtract Operation"
            );
          } else {
            console.log(
              "Expected Quantity To Subtract Exceeds Existing Quantity"
            );
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  });

  response.send("Operations Carried Out Successfully");
});
