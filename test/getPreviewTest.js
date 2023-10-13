const request = require("supertest");
const app = require("../server.js");

describe("Server Self-Testing", function () {
  it("should return a successful response for GET /getPreview", function (done) {
    request(app)
      .post("/getPreview")
      .send({ text: "TEST", theme: "theme1", size: "sm", font: "Victor Mono" })
      .expect(200)
      .end(function (err, res) {
        if (err) return done(err);
        done();
      });
  });

 
  // Add more test cases for other endpoints and scenarios as needed
});
