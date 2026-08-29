const request = require("supertest");
const sinon = require("sinon");
const db = require("../src/db");
const app = require("../src/app");

describe("API Orders", () => {

  afterEach(() => sinon.restore());

  test("POST /api/orders crea un ordine", async () => {
    const fakeConn = {
      beginTransaction: sinon.stub().resolves(),
      query: sinon.stub()
        .onFirstCall().resolves([{ insertId: 10 }]) // ordine
        .onSecondCall().resolves() // user
        .onThirdCall().resolves(), // product
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves(),
      release: sinon.stub().resolves()
    };

    sinon.stub(db, "getConnection").resolves(fakeConn);

    const res = await request(app)
      .post("/api/orders")
      .send({
        usersIds: [1],
        productsIds: [3]
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(10);
  });

  test("PATCH /api/orders/:id aggiorna utenti e prodotti", async () => {
    const fakeConn = {
      query: sinon.stub()
        .onCall(0).resolves([[{ id: 2 }]]) // ordine esiste
        .onCall(1).resolves([[{ id: 1 }]]) // valid users
        .onCall(2).resolves() // delete users
        .onCall(3).resolves() // insert user
        .onCall(4).resolves([[{ id: 5 }]]) // valid products
        .onCall(5).resolves() // delete products
        .onCall(6).resolves(), // insert product
      beginTransaction: sinon.stub().resolves(),
      commit: sinon.stub().resolves(),
      rollback: sinon.stub().resolves(),
      release: sinon.stub().resolves()
    };

    sinon.stub(db, "getConnection").resolves(fakeConn);

    const res = await request(app)
      .patch("/api/orders/2")
      .send({
        usersIds: [1],
        productsIds: [5]
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("2");
  });

});
