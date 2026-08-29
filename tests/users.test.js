const request = require("supertest");
const sinon = require("sinon");
const db = require("../src/db");
const app = require("../src/app");

describe("API Users", () => {

  afterEach(() => sinon.restore());

  test("POST /api/users crea un utente", async () => {
    const fakeConn = {
      query: sinon.stub()
        .onFirstCall().resolves([{ insertId: 99 }]),
      release: sinon.stub().resolves()
    };

    sinon.stub(db, "query").resolves([{ insertId: 99 }]);

    const res = await request(app)
      .post("/api/users")
      .send({
        firstname: "Mario",
        lastname: "Rossi",
        email: "mario@example.com"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(99);
  });

});
