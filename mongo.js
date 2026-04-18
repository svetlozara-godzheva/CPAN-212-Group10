const mongoose = require("mongoose");

const { Schema } = mongoose;

const movieSchema = new Schema({
    name: String,
    description: String,
    year: Number,
    genres: String,
    rating: Number,
    director: String
});

const Movie = mongoose.model("Movie", movieSchema);

const userSchema = new Schema({
    email: String,
    passwordHash: String
});

const User = mongoose.model("User", userSchema);

const connectDB = async () => {
    try {
        console.log("Attempting to connect to database");
        await mongoose.connect(process.env.MONGODB_URI || process.env.CONNECTION_STRING);
        console.log("MongoDB connected!");
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = { Movie, User, connectDB };

