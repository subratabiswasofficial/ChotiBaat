// Get the client
import mysql from "mysql2/promise";

// Create the connection to database
mysql
  .createConnection({
    host: "localhost",
    user: "root",
    password: "12345678",
    database: "chotibaat",
    port: "3306",
  })
  .then((connection) => {
    console.log("connection successful");
  })
  .catch((err) => {
    console.log("connection error", err);
  });
