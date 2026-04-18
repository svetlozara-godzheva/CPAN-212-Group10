const { connectDB } = require("./mongo");
require("dotenv").config();

const moviesRouter = require("./movies");
const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8000;

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(moviesRouter);

connectDB();

if (require.main === module) {
    app.listen(port, () => {
        console.log(`The server is running on http://localhost:${port}`);
    });
}

module.exports = app;

