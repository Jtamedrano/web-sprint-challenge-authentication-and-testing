const db = require("../../data/dbConfig");
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");

router.post(
  "/register",
  async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "username and password required" });
      return;
    }
    const foundUser = await db("users").where({ username });
    if (foundUser.length > 0) {
      res.status(400).json({ message: "username taken" });
      return;
    } else {
      next();
    }
  },
  async (req, res) => {
    // res.end("implement register, please!");
    /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
    const { username, password } = req.body;
    const hPassword = await bcrypt.hashSync(password, 5);
    const user = await db
      .insert({ username, password: hPassword + "" })
      .into("users");

    res.json(await db("users").where({ id: user[0] }).first());
  }
);

router.post(
  "/login",
  async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "username and password required" });
      return;
    }

    const foundUser = await db("users").where({ username }).first();
    if (!foundUser || foundUser.length === 0) {
      res.status(400).json({ message: "invalid credentials" });
      return;
    }

    const comparedPasswordSuccess = await bcrypt.compareSync(
      password,
      foundUser.password
    );

    if (!comparedPasswordSuccess) {
      res.status(400).json({ message: "invalid credentials" });
      return;
    } else {
      req.user = foundUser;
      next();
    }
  },
  (req, res) => {
    // res.end("implement login, please!");
    /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
    const token = jwt.sign(req.user.id, "supersecret");
    res.json({ message: `welcome, ${req.user.username}`, token });
  }
);

module.exports = router;
