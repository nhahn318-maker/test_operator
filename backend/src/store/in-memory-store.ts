import { Session, Todo, User } from "../types";

type CreateUserInput = Omit<User, "updatedAt">;
type CreateSessionInput = Session;
type CreateTodoInput = Todo;

export class InMemoryStore {
  private readonly users = new Map<string, User>();
  private readonly usersByEmail = new Map<string, string>();
  private readonly sessions = new Map<string, Session>();
  private readonly sessionsByTokenHash = new Map<string, string>();
  private readonly todos = new Map<string, Todo>();

  createUser(input: CreateUserInput) {
    const user: User = { ...input, updatedAt: input.createdAt };
    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);
    return user;
  }

  findUserByEmail(email: string) {
    const userId = this.usersByEmail.get(email);
    return userId ? this.users.get(userId) ?? null : null;
  }

  findUserById(userId: string) {
    return this.users.get(userId) ?? null;
  }

  createSession(session: CreateSessionInput) {
    this.sessions.set(session.id, session);
    this.sessionsByTokenHash.set(session.tokenHash, session.id);
    return session;
  }

  findSessionByTokenHash(tokenHash: string) {
    const sessionId = this.sessionsByTokenHash.get(tokenHash);
    return sessionId ? this.sessions.get(sessionId) ?? null : null;
  }

  revokeSession(sessionId: string, revokedAt: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const updated: Session = { ...session, revokedAt };
    this.sessions.set(sessionId, updated);
    return updated;
  }

  createTodo(todo: CreateTodoInput) {
    this.todos.set(todo.id, todo);
    return todo;
  }

  listTodosByUser(userId: string) {
    return [...this.todos.values()].filter((todo) => todo.userId === userId);
  }

  findTodoById(todoId: string) {
    return this.todos.get(todoId) ?? null;
  }

  updateTodo(todoId: string, updates: Partial<Todo>) {
    const current = this.todos.get(todoId);
    if (!current) {
      return null;
    }

    const updated = { ...current, ...updates };
    this.todos.set(todoId, updated);
    return updated;
  }

  deleteTodo(todoId: string) {
    return this.todos.delete(todoId);
  }
}
