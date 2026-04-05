export type TodoStatus = "active" | "completed";

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Session = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export type Todo = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicTodo = {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RequestUser = {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
};
