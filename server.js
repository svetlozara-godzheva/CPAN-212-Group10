const { connectDB } = require("./mongo");
require("dotenv").config();

const moviesRouter = require("./movies")
const express = require("express");

const app = express()
const port = process.env.PORT || 8000;

app.set("view engine", "ejs");
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

const onServerStart = () => {
    console.log(`The server is running on http://localhost:${port}`);
    connectDB();
};

app.use(moviesRouter);
app.listen(port, onServerStart);