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
      console.log(res.body);
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
    // 3- On FAILED login due to `username` or `password` missing from the request body,
    //   the response body should include a string exactly as follows: "username and password required".

    // 4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
    //   the response body should include a string exactly as follows: "invalid credentials".
  });
});
