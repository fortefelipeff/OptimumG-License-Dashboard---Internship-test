import request from "supertest";
import { createApp } from "./app";

describe("Licenses API", () => {
  const app = createApp();
  const trialKey = "OPT-TRIAL-041";

  it("returns all licenses", async () => {
    const response = await request(app).get("/api/licenses");
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("activates and deactivates a trial license", async () => {
    const machineId = `JEST-${Date.now()}`;

    const activateResponse = await request(app)
      .post(`/api/licenses/${trialKey}/activate`)
      .send({ machineId, activatedBy: "jest" });

    expect(activateResponse.status).toBe(200);
    expect(activateResponse.body.data.status).toBe("active");

    const deactivateResponse = await request(app)
      .post(`/api/licenses/${trialKey}/deactivate`)
      .send({ machineId });

    expect(deactivateResponse.status).toBe(200);
    expect(deactivateResponse.body.data.status).toBe("inactive");
  });

  it("reports expired status for historical license", async () => {
    const response = await request(app).get("/api/licenses/OPT-STD-887/status");

    expect(response.status).toBe(200);
    expect(response.body.data.expired).toBe(true);
    expect(response.body.data.status).toBe("expired");
  });
});
