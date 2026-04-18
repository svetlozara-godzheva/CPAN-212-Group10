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


//caching this to be able to host on vercel
let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
    if (cached.conn) return cached.conn;
    try {
        console.log("Attempting to connect to database");
        const uri = process.env.MONGODB_URI || process.env.CONNECTION_STRING;
        if (!cached.promise) {
            cached.promise = mongoose.connect(uri).then((mongooseInstance) => mongooseInstance);
        }

        cached.conn = await cached.promise;
        return cached.conn;

        console.log("MongoDB connected!");
    } catch (error) {
        console.error(error.message);
    }
}

module.exports = { Movie, User, connectDB };

