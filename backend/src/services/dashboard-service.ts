import { InMemoryStore } from "../store/in-memory-store";

import { TodoService } from "./todo-service";

const prioritySort = (left: { status: string; dueDate: string | null; updatedAt: string }, right: { status: string; dueDate: string | null; updatedAt: string }) => {
  if (left.status !== right.status) {
    return left.status === "active" ? -1 : 1;
  }

  const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
  if (leftDue !== rightDue) {
    return leftDue - rightDue;
  }

  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
};

export class DashboardService {
  constructor(
    private readonly store: InMemoryStore,
    private readonly todoService: TodoService,
  ) {}

  getDashboard(userId: string, priorityLimit: number) {
    const todos = this.store.listTodosByUser(userId);
    const totalTodos = todos.length;
    const activeTodos = todos.filter((todo) => todo.status === "active").length;
    const completedTodos = totalTodos - activeTodos;

    const highPriorityTodos = todos
      .slice()
      .sort(prioritySort)
      .slice(0, priorityLimit)
      .map((todo) => this.todoService.toPublicTodo(todo));

    return {
      summary: {
        totalTodos,
        activeTodos,
        completedTodos,
      },
      highPriorityTodos,
    };
  }
}
