import dotenv from "dotenv";
dotenv.config();
import dbConnection from "./db/index.js";
import app from "./app.js";
// jab bhi koi async call hota hai to wo aik then catch return karta hai
dbConnection()
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(`App is running on PORT ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGODB connection FAILED", err);
  });
