require("dotenv").config();
const express = require("express");
const serveStatic = require("serve-static");
const bodyParser = require("body-parser");
const occs = require("./OCCS").OCCS;

const app = express();

// Get - Middleware Serve up public/views folder
app.use(
  "/",
  serveStatic("./public/", { index: ["index.html", "default.htm"] })
);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Login
app.post("/login", function(req, res) {
  occs.login(req, res);
});

// user profile
app.post("/getCurrentProfile", function(req, res) {
  occs.getCurrentProfile(req, res);
});

// Create an order
app.post("/createOrder", function(req, res) {
  occs.createOrder(req, res);
});

app.listen(process.env.PORT, function() {
  console.log("Server Started at port " + process.env.PORT);
});
