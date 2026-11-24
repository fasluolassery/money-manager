import type { Application } from "express";
import request from "supertest";

/** Requests to `/me` as a signed-in user, with the Origin header writes need (DESIGN 7.4). */
export function meRequests(app: Application, appUrl: string) {
  const origin = new URL(appUrl).origin;
  return {
    getMe: (cookie: string) => request(app).get("/api/v1/me").set("Cookie", cookie),
    patchMe: (cookie: string, body: object) =>
      request(app).patch("/api/v1/me").set("Cookie", cookie).set("Origin", origin).send(body),
  };
}
