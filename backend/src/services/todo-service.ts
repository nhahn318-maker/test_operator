import { randomUUID } from "node:crypto";

import { ApiError, notFoundError } from "../common/errors";
import { encodeOffsetCursor, parseOffsetCursor } from "../common/http";
import { InMemoryStore } from "../store/in-memory-store";
import { PublicTodo, Todo, TodoStatus } from "../types";

type ListInput = {
  userId: string;
  status?: TodoStatus;
  limit: number;
  cursor?: string;
  sort: "createdAt_desc" | "updatedAt_desc" | "dueDate_asc";
};

type CreateInput = {
  userId: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status?: TodoStatus;
};

type UpdateInput = {
  userId: string;
  todoId: string;
  title?: string;
  description?: string | null;
  dueDate?: string | null;
  status?: TodoStatus;
};

const compareTodos = (sort: ListInput["sort"]) => (left: Todo, right: Todo) => {
  if (sort === "dueDate_asc") {
    const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (leftDue !== rightDue) {
      return leftDue - rightDue;
    }
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  }

  const field = sort === "updatedAt_desc" ? "updatedAt" : "createdAt";
  return new Date(right[field]).getTime() - new Date(left[field]).getTime();
};

export class TodoService {
  constructor(private readonly store: InMemoryStore) {}

  list(input: ListInput) {
    const offset = parseOffsetCursor(input.cursor);
    const items = this.store
      .listTodosByUser(input.userId)
      .filter((todo) => (input.status ? todo.status === input.status : true))
      .sort(compareTodos(input.sort));

    const pagedItems = items.slice(offset, offset + input.limit);
    const nextOffset = offset + input.limit;

    return {
      items: pagedItems.map((todo) => this.toPublicTodo(todo)),
      pageInfo: {
        nextCursor: nextOffset < items.length ? encodeOffsetCursor(nextOffset) : null,
      },
    };
  }

  create(input: CreateInput) {
    const now = new Date().toISOString();
    const status = input.status ?? "active";
    const todo = this.store.createTodo({
      id: randomUUID(),
      userId: input.userId,
      title: input.title,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      status,
      completedAt: status === "completed" ? now : null,
      createdAt: now,
      updatedAt: now,
    });

    return this.toPublicTodo(todo);
  }

  getById(userId: string, todoId: string) {
    const todo = this.store.findTodoById(todoId);
    if (!todo || todo.userId !== userId) {
      throw notFoundError("Todo not found.");
    }

    return this.toPublicTodo(todo);
  }

  update(input: UpdateInput) {
    const existing = this.store.findTodoById(input.todoId);
    if (!existing || existing.userId !== input.userId) {
      throw notFoundError("Todo not found.");
    }

    const now = new Date().toISOString();
    const nextStatus = input.status ?? existing.status;

    const completedAt =
      nextStatus === "completed"
        ? existing.completedAt ?? now
        : null;

    const updated = this.store.updateTodo(input.todoId, {
      title: input.title ?? existing.title,
      description: input.description === undefined ? existing.description : input.description,
      dueDate: input.dueDate === undefined ? existing.dueDate : input.dueDate,
      status: nextStatus,
      completedAt,
      updatedAt: now,
    });

    if (!updated) {
      throw new ApiError(500, "INTERNAL_ERROR", "Unable to update todo.");
    }

    return this.toPublicTodo(updated);
  }

  delete(userId: string, todoId: string) {
    const existing = this.store.findTodoById(todoId);
    if (!existing || existing.userId !== userId) {
      throw notFoundError("Todo not found.");
    }

    this.store.deleteTodo(todoId);
  }

  toPublicTodo(todo: Todo): PublicTodo {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      status: todo.status,
      dueDate: todo.dueDate,
      completedAt: todo.completedAt,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }
}
