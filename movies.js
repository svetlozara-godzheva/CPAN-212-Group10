const express = require("express");
const { Movie, User } = require("./mongo");
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
        .withMessage("Year must be a valid number."),
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

const getValidationMessage = (request) => {
    const errors = validationResult(request);

    if (errors.isEmpty()) {
        return null;
    }

    return errors.array().map((error) => error.msg).join(" ");
};

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    }),
);

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
        return response.render("register.ejs", { error: null });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/register", registerValidation, async (request, response) => {
    try {
        const validationMessage = getValidationMessage(request);

        if (validationMessage) {
            return response.render("register.ejs", {
                error: validationMessage,
            });
        }

        const existingUsers = await User.find({
            email: request.body.email,
        });

        if (existingUsers.length > 0) {
            return response.render("register.ejs", {
                error: "Username already exists!",
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
            error: null,
            successMessage,
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/login", loginValidation, async (request, response) => {
    try {
        const validationMessage = getValidationMessage(request);

        if (validationMessage) {
            return response.render("login.ejs", {
                error: validationMessage,
                successMessage: null,
            });
        }

        const existingUser = await User.findOne({
            email: request.body.email,
        });

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
            error: "Invalid username or password!",
            successMessage: null,
        });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/logout", (request, response) => {
    try {
        request.session.currentUser = null;
        return response.redirect("/login");
    } catch (error) {
        response.status(500).send(error);
    }
});

router.get("/create", requireLogin, (request, response) => {
    try {
        return response.render("create.ejs", { error: null, formData: {} });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/create", requireLogin, movieValidation, async (request, response) => {
    try {
        const validationMessage = getValidationMessage(request);

        if (validationMessage) {
            return response.render("create.ejs", {
                error: validationMessage,
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
        return response.render("edit.ejs", { movie, error: null });
    } catch (error) {
        response.status(500).send(error);
    }
});

router.post("/edit/:id", requireLogin, movieValidation, async (request, response) => {
    try {
        const id = request.params.id;
        const validationMessage = getValidationMessage(request);

        if (validationMessage) {
            return response.render("edit.ejs", {
                movie: { _id: id, ...request.body },
                error: validationMessage,
            });
        }

        const movieToUpdate = await Movie.findById(id);
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
        return response.render("preview.ejs", { movie });
    } catch (error) {
        response.status(500).send(error);
    }
});

module.exports = router;
