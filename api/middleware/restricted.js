const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const { authorization } = req.headers;
  if (!authorization) {
    res.status(400).json({ message: "token required" });
    return;
  }

  try {
    const info = jwt.verify(authorization, "supersecret");
    if (info.iat - Date.now() > 0 || !info.iat) {
      res.status(400).json({ message: "token invalid" });
      return;
    }
    next();
  } catch (err) {
    res.status(400).json({ message: "token invalid" });
  }
  /*
    IMPLEMENT

    1- On valid token in the Authorization header, call next.

    2- On missing token in the Authorization header,
      the response body should include a string exactly as follows: "token required".

    3- On invalid or expired token in the Authorization header,
      the response body should include a string exactly as follows: "token invalid".
  */
};
