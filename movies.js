const express = require("express");
const { Movie, User, connectDB } = require("./mongo");
const session = require("express-session");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const saltRounds = 12;

const router = express.Router();

const registerValidation = [
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be at least 6 characters long."),
];

const loginValidation = [
    body("email").trim().isEmail().withMessage("Please enter a valid email address."),
    body("password").notEmpty().withMessage("Password is required."),
];

const movieValidation = [
    body("name").trim().notEmpty().withMessage("Movie title is required."),
    body("year")
        .isInt({ min: 1888, max: 2100 })
        .withMessage("Year must be between 1888 and 2100."),
    body("rating")
        .isFloat({ min: 0, max: 10 })
        .withMessage("Rating must be between 0 and 10."),
    body("genres").trim().notEmpty().withMessage("Genres are required."),
    body("director").trim().notEmpty().withMessage("Director is required."),
    body("description")
        .trim()
        .notEmpty()
        .withMessage("Description is required."),
];

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    }),
);

router.use(async (request, response, next) => {
    try {
        // needed for vercel
        await connectDB();
        next();
    } catch (error) {
        next(error);
    }
});
const requireLogin = (request, response, next) => {
    if (!request.session.currentUser) {
        return response.redirect("/login");
    } else {
        next();
    }
};

router.get("/", requireLogin, async (request, response) => {
    try {
        const movies = await Movie.find();
        return response.render("index.ejs", { movies });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/register", (request, response) => {
    try {
        return response.render("register.ejs", { errors: {}, formData: {} });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/register", registerValidation, async (request, response) => {
    try {
        const errors = validationResult(request);

        if (!errors.isEmpty()) {
            return response.render("register.ejs", {
                errors: errors.mapped(),
                formData: request.body
            });
        }

        const existingUsers = await User.find({
            email: request.body.email,
        });

        if (existingUsers.length > 0) {
            return response.render("register.ejs", {
                errors: {
                    email: {
                        msg: "Username already exists!"
                    }
                },
                formData: request.body
            });
        }

        const hash = await bcrypt.hash(request.body.password, saltRounds);
        const user = new User({
            email: request.body.email,
            passwordHash: hash,
        });

        await user.save();
        return response.redirect("/login?registered=1");
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/login", (request, response) => {
    try {
        const successMessage =
            request.query.registered === "1"
                ? "Successfully registered! Please log in."
                : null;

        return response.render("login.ejs", {
            errors: {},
            successMessage,
            formData: {}
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/login", loginValidation, async (request, response) => {
    try {

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.render("login.ejs", {
                errors: errors.mapped(),
                successMessage: null,
                formData: request.body
            });
        }

        const existingUser = await User.findOne({
            email: request.body.email,
        });
        console.log(request.body)
        if (existingUser) {
            const passwordMatch = await bcrypt.compare(
                request.body.password,
                existingUser.passwordHash,
            );
            if (passwordMatch) {
                request.session.currentUser = request.body.email;
                return response.redirect("/");
            }
        }

        return response.render("login.ejs", {
            errors: {
                password: {
                    msg: "Invalid username or password!"
                }
            },
            successMessage: null,
            formData: request.body
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/logout", (request, response) => {
    try {
        request.session.destroy();
        return response.redirect("/login");
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/create", requireLogin, (request, response) => {
    try {
        return response.render("create.ejs", { errors: {}, formData: {} });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/create", requireLogin, movieValidation, async (request, response) => {
    try {

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.render("create.ejs", {
                errors: errors.mapped(),
                formData: request.body,
            });
        }

        const movie = new Movie({
            name: request.body.name,
            year: request.body.year,
            rating: request.body.rating,
            genres: request.body.genres,
            director: request.body.director,
            description: request.body.description,
            createdBy: request.session.currentUser,
        });
        const createdMovie = await movie.save();
        return response.redirect(`/preview/${createdMovie._id}`);
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/edit/:id", requireLogin, async (request, response) => {
    try {
        const id = request.params.id;
        const movie = await Movie.findById(id);

        if (movie.createdBy !== request.session.currentUser) {
            return response.status(403).send("You can only modify movies you added.");
        }
        return response.render("edit.ejs", { movie, errors: {} });

    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/edit/:id", requireLogin, movieValidation, async (request, response) => {
    try {
        const id = request.params.id;

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.render("edit.ejs", {
                errors: errors.mapped(),
                movie: { _id: id, ...request.body },
            });
        }

        const movieToUpdate = await Movie.findById(id);
        if (movieToUpdate.createdBy !== request.session.currentUser) {
            return response.status(403).send("You can only modify movies you added.");
        }

        movieToUpdate.name = request.body.name;
        movieToUpdate.year = request.body.year;
        movieToUpdate.rating = request.body.rating;
        movieToUpdate.genres = request.body.genres;
        movieToUpdate.director = request.body.director;
        movieToUpdate.description = request.body.description;
        await movieToUpdate.save();
        return response.redirect(`/preview/${id}`);
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/delete/:id", requireLogin, async (request, response) => {
    try {
        const id = request.params.id;
        const movie = await Movie.findById(id);

        if (movie.createdBy !== request.session.currentUser) {
            return response.status(403).send("You can only modify movies you added.");
        }

        await movie.deleteOne();
        return response.redirect("/");
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/preview/:id", requireLogin, async (request, response) => {
    try {
        const id = request.params.id;
        const movie = await Movie.findById(id);
        return response.render("preview.ejs", {
            movie,
            canManage: movie && movie.createdBy === request.session.currentUser,
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

module.exports = router;
