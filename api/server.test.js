const db = require("../data/dbConfig");
const server = require("./server");
const request = require("supertest");

const userA = { username: "James" };
const userB = { password: "123" };
const userC = { username: "JesseMedrano", password: "123456Jtm" };

afterAll(async (done) => {
  await db.destroy();
  done();
});

beforeEach(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

const regLink = "/api/auth/register";
const loginLink = "/api/auth/login";
const jokesLink = "/api/jokes";

// Write your tests here
test("sanity", () => {
  expect(true).not.toBe(false);
});

describe("server.js", () => {
  describe("User Registration", () => {
    it("wont register a user missing a password", async () => {
      const res = await request(server).post(regLink).send(userA);
      expect(res.status + "").toMatch(/4|0/);
      expect(res.body).toMatchObject({
        message: "username and password required",
      });
    });
    it("wont register a user missing a username", async () => {
      const res = await request(server).post(regLink).send(userB);
      expect(res.status + "").toMatch(/4|0/);
      expect(res.body).toMatchObject({
        message: "username and password required",
      });
    });
    it("registers user", async () => {
      const res = await request(server).post(regLink).send(userC);
      expect(res.status + "").toMatch(/2|0/);
      expect(res.body).toHaveProperty("username", userC.username);
      expect(res.body).toHaveProperty("password");
    });
    it("wont create duplicate users", async () => {
      await request(server).post(regLink).send(userC);
      const res = await request(server).post(regLink).send(userC);
      expect(res.status + "").toMatch(/4|0/);
      expect(res.body).toMatchObject({
        message: "username taken",
      });
    });
  });
  describe("User Login", () => {
    beforeEach(async () => {
      await db("users").truncate();
      await request(server).post(regLink).send(userC);
    });
    it("logs user in successfully", async () => {
      const res = await request(server).post(loginLink).send(userC);
      expect(res.body).toHaveProperty("message", "welcome, JesseMedrano");
      expect(res.body).toHaveProperty("token");
    });
    it("won't login if missing password", async () => {
      const res = await request(server).post(loginLink).send(userA);
      expect(res.body).toMatchObject({
        message: "username and password required",
      });
    });
    it("won't login if missing username", async () => {
      const res = await request(server).post(loginLink).send(userB);
      expect(res.body).toMatchObject({
        message: "username and password required",
      });
    });
    it("won't login if user doesn't exist", async () => {
      const res = await request(server)
        .post(loginLink)
        .send({ ...userA, password: "123" });
      expect(res.body).toMatchObject({ message: "invalid credentials" });
    });
    it("won't login if user password isn't correct", async () => {
      const res = await request(server)
        .post(loginLink)
        .send({ ...userC, password: "123" });
      expect(res.body).toMatchObject({ message: "invalid credentials" });
    });
  });
  describe("Get jokes", () => {
    beforeEach(async () => {
      await db("users").truncate();
      await request(server).post(regLink).send(userC);
    });
    /*
    IMPLEMENT

    1- On valid token in the Authorization header, call next.

    2- On missing token in the Authorization header,
      the response body should include a string exactly as follows: "token required".

    3- On invalid or expired token in the Authorization header,
      the response body should include a string exactly as follows: "token invalid".
  */
    it("will get jokes", async () => {
      const login = await request(server).post(loginLink).send(userC);
      const req = await request(server)
        .get(jokesLink)
        .set("Authorization", login.body.token);
      console.log(req.body);
      expect(req.body).toHaveLength(3);
    });
    it("will not get jokes without auth", async () => {
      const req = await request(server).get(jokesLink);
      expect(req.body).toMatchObject({ message: "token required" });
    });
    it("will not get jokes with altered auth", async () => {
      const login = await request(server).post(loginLink).send(userC);
      const req = await request(server)
        .get(jokesLink)
        .set("Authorization", login.body.token + "10");

      expect(req.body).toMatchObject({ message: "token invalid" });
    });
  });
});
