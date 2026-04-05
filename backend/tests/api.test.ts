import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { createLogger } from "../src/common/logger";
import { getAppConfig } from "../src/config";
import { InMemoryStore } from "../src/store/in-memory-store";

const makeApp = () =>
  createApp({
    store: new InMemoryStore(),
    config: getAppConfig(),
    logger: createLogger("error"),
  });

describe("release baseline", () => {
  it("exposes a health endpoint without authentication", async () => {
    const app = makeApp();

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.service).toBe("todo-api");
    expect(response.headers["x-request-id"]).toMatch(/^req_/);
  });
});

describe("auth api", () => {
  it("registers, sets a cookie, resolves /me, and logs out", async () => {
    const app = makeApp();

    const registerResponse = await request(app).post("/api/v1/auth/register").send({
      email: "USER@Example.com",
      password: "StrongPass123",
      displayName: "Alex Doe",
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.user.email).toBe("user@example.com");
    expect(registerResponse.headers["set-cookie"][0]).toContain("todo_session=");

    const cookie = registerResponse.headers["set-cookie"];
    const meResponse = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data.user.displayName).toBe("Alex Doe");

    const logoutResponse = await request(app).post("/api/v1/auth/logout").set("Cookie", cookie);
    expect(logoutResponse.status).toBe(204);

    const afterLogoutResponse = await request(app).get("/api/v1/auth/me").set("Cookie", cookie);
    expect(afterLogoutResponse.status).toBe(401);
    expect(afterLogoutResponse.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects duplicate registration with the contract error shape", async () => {
    const app = makeApp();

    await request(app).post("/api/v1/auth/register").send({
      email: "user@example.com",
      password: "StrongPass123",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      email: "user@example.com",
      password: "StrongPass123",
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("CONFLICT");
    expect(response.body.error.details).toEqual([{ field: "email", issue: "Already registered." }]);
  });
});

describe("todo and dashboard api", () => {
  it("enforces authentication on protected routes", async () => {
    const app = makeApp();

    const response = await request(app).get("/api/v1/todos");

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("UNAUTHENTICATED");
  });

  it("supports todo CRUD, filters, pagination, and dashboard aggregation", async () => {
    const app = makeApp();

    const authResponse = await request(app).post("/api/v1/auth/register").send({
      email: "owner@example.com",
      password: "StrongPass123",
    });
    const cookie = authResponse.headers["set-cookie"];

    const firstTodo = await request(app).post("/api/v1/todos").set("Cookie", cookie).send({
      title: "Active todo",
      description: "Keep this open",
      dueDate: "2026-04-10T00:00:00Z",
    });

    const secondTodo = await request(app).post("/api/v1/todos").set("Cookie", cookie).send({
      title: "Completed todo",
      status: "completed",
      dueDate: "2026-04-09T00:00:00Z",
    });

    expect(firstTodo.status).toBe(201);
    expect(secondTodo.body.data.todo.completedAt).not.toBeNull();

    const todoId = firstTodo.body.data.todo.id;
    const getTodoResponse = await request(app).get(`/api/v1/todos/${todoId}`).set("Cookie", cookie);
    expect(getTodoResponse.status).toBe(200);

    const updateResponse = await request(app).patch(`/api/v1/todos/${todoId}`).set("Cookie", cookie).send({
      title: "Updated title",
      status: "completed",
      dueDate: null,
    });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.todo.status).toBe("completed");
    expect(updateResponse.body.data.todo.completedAt).not.toBeNull();

    const listPageOne = await request(app).get("/api/v1/todos?limit=1&sort=createdAt_desc").set("Cookie", cookie);
    expect(listPageOne.status).toBe(200);
    expect(listPageOne.body.data.items).toHaveLength(1);
    expect(listPageOne.body.data.pageInfo.nextCursor).not.toBeNull();

    const listPageTwo = await request(app)
      .get(`/api/v1/todos?limit=1&cursor=${listPageOne.body.data.pageInfo.nextCursor}&sort=createdAt_desc`)
      .set("Cookie", cookie);
    expect(listPageTwo.status).toBe(200);
    expect(listPageTwo.body.data.items).toHaveLength(1);

    const completedOnly = await request(app).get("/api/v1/todos?status=completed").set("Cookie", cookie);
    expect(completedOnly.status).toBe(200);
    expect(completedOnly.body.data.items).toHaveLength(2);

    const dashboardResponse = await request(app).get("/api/v1/dashboard?priorityLimit=2").set("Cookie", cookie);
    expect(dashboardResponse.status).toBe(200);
    expect(dashboardResponse.body.data.summary).toEqual({
      totalTodos: 2,
      activeTodos: 0,
      completedTodos: 2,
    });
    expect(dashboardResponse.body.data.highPriorityTodos).toHaveLength(2);

    const deleteResponse = await request(app).delete(`/api/v1/todos/${todoId}`).set("Cookie", cookie);
    expect(deleteResponse.status).toBe(204);

    const afterDeleteDashboard = await request(app).get("/api/v1/dashboard").set("Cookie", cookie);
    expect(afterDeleteDashboard.body.data.summary).toEqual({
      totalTodos: 1,
      activeTodos: 0,
      completedTodos: 1,
    });
  });

  it("isolates ownership across two authenticated users", async () => {
    const app = makeApp();

    const ownerAuth = await request(app).post("/api/v1/auth/register").send({
      email: "owner@example.com",
      password: "StrongPass123",
    });
    const intruderAuth = await request(app).post("/api/v1/auth/register").send({
      email: "intruder@example.com",
      password: "StrongPass123",
    });

    const ownerCookie = ownerAuth.headers["set-cookie"];
    const intruderCookie = intruderAuth.headers["set-cookie"];

    const todoResponse = await request(app).post("/api/v1/todos").set("Cookie", ownerCookie).send({
      title: "Private task",
    });

    const intruderRead = await request(app)
      .get(`/api/v1/todos/${todoResponse.body.data.todo.id}`)
      .set("Cookie", intruderCookie);
    expect(intruderRead.status).toBe(404);
    expect(intruderRead.body.error.code).toBe("NOT_FOUND");
  });
});
