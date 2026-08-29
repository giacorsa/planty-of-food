const request = require("supertest");
const sinon = require("sinon");
const db = require("../src/db");
const app = require("../src/app");

describe("API Products", () => {

  afterEach(() => sinon.restore());

  test("POST /api/products crea un prodotto", async () => {
    sinon.stub(db, "query").resolves([{ insertId: 50 }]);

    const res = await request(app)
      .post("/api/products")
      .send({
        name: "Prosciutto"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(50);
  });

});
