import cookieParser from "cookie-parser";
import express from "express";
import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { ApiError, unauthenticatedError } from "./common/errors";
import { SESSION_COOKIE_NAME } from "./common/http";
import {
  createTodoSchema,
  dashboardQuerySchema,
  listTodosQuerySchema,
  loginSchema,
  registerSchema,
  updateTodoSchema,
} from "./common/validation";
import { toValidationError } from "./common/http";
import { AuthService } from "./services/auth-service";
import { DashboardService } from "./services/dashboard-service";
import { TodoService } from "./services/todo-service";
import { InMemoryStore } from "./store/in-memory-store";
import { RequestUser } from "./types";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      currentUser?: RequestUser;
      sessionToken?: string;
    }
  }
}

type AppDependencies = {
  store?: InMemoryStore;
};

const sessionCookieConfig = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export const createApp = (dependencies: AppDependencies = {}) => {
  const store = dependencies.store ?? new InMemoryStore();
  const authService = new AuthService(store);
  const todoService = new TodoService(store);
  const dashboardService = new DashboardService(store, todoService);

  const app = express();
  const getTodoId = (req: Request) => String(req.params.todoId);

  app.use(express.json());
  app.use(cookieParser());
  app.use((req, _res, next) => {
    req.requestId = `req_${randomUUID()}`;
    next();
  });

  const authenticate = (req: Request, _res: Response, next: NextFunction) => {
    const sessionToken = req.cookies[SESSION_COOKIE_NAME];
    if (!sessionToken || typeof sessionToken !== "string") {
      next(unauthenticatedError());
      return;
    }

    const user = authService.getUserBySessionToken(sessionToken);
    if (!user) {
      next(unauthenticatedError());
      return;
    }

    req.currentUser = authService.toPublicUser(user);
    req.sessionToken = sessionToken;
    next();
  };

  app.post("/api/v1/auth/register", async (req, res, next) => {
    try {
      const payload = registerSchema.parse(req.body);
      const result = await authService.register(payload);
      res.cookie(SESSION_COOKIE_NAME, result.rawToken, sessionCookieConfig);
      res.status(201).json({ data: { user: result.user } });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/auth/login", async (req, res, next) => {
    try {
      const payload = loginSchema.parse(req.body);
      const result = await authService.login(payload);
      res.cookie(SESSION_COOKIE_NAME, result.rawToken, sessionCookieConfig);
      res.status(200).json({ data: { user: result.user } });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/auth/logout", authenticate, (req, res, next) => {
    try {
      authService.revokeSession(req.sessionToken!);
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieConfig);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/auth/me", authenticate, (req, res) => {
    res.status(200).json({ data: { user: req.currentUser } });
  });

  app.get("/api/v1/todos", authenticate, (req, res, next) => {
    try {
      const query = listTodosQuerySchema.parse(req.query);
      const result = todoService.list({
        userId: req.currentUser!.id,
        status: query.status,
        limit: query.limit,
        cursor: query.cursor,
        sort: query.sort,
      });

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/v1/todos", authenticate, (req, res, next) => {
    try {
      const payload = createTodoSchema.parse(req.body);
      const todo = todoService.create({
        userId: req.currentUser!.id,
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        status: payload.status,
      });
      res.status(201).json({ data: { todo } });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/todos/:todoId", authenticate, (req, res, next) => {
    try {
      const todo = todoService.getById(req.currentUser!.id, getTodoId(req));
      res.status(200).json({ data: { todo } });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/v1/todos/:todoId", authenticate, (req, res, next) => {
    try {
      const payload = updateTodoSchema.parse(req.body);
      const todo = todoService.update({
        userId: req.currentUser!.id,
        todoId: getTodoId(req),
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        status: payload.status,
      });
      res.status(200).json({ data: { todo } });
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/v1/todos/:todoId", authenticate, (req, res, next) => {
    try {
      todoService.delete(req.currentUser!.id, getTodoId(req));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/v1/dashboard", authenticate, (req, res, next) => {
    try {
      const query = dashboardQuerySchema.parse(req.query);
      const dashboard = dashboardService.getDashboard(req.currentUser!.id, query.priorityLimit);
      res.status(200).json({ data: dashboard });
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, _res: Response, next: NextFunction) => {
    if (error instanceof ZodError) {
      next(toValidationError(error));
      return;
    }

    next(error);
  });

  app.use((error: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
          requestId: req.requestId,
        },
      });
      return;
    }

    res.status(500).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        details: [],
        requestId: req.requestId,
      },
    });
  });

  return app;
};
