// Store task results in memory (in production, use a database)
const taskResults = new Map<string, any>();

// Helper function to store task results
export function storeTaskResult(task_id: string, result: any) {
  taskResults.set(task_id, {
    ...result,
    timestamp: new Date().toISOString(),
  });
}

// Helper function to get task results
export function getTaskResult(task_id: string) {
  return taskResults.get(task_id);
}

// Helper function to get all stored tasks (for debugging)
export function getAllTasks() {
  return Array.from(taskResults.entries()).map(([id, result]) => ({ id, result }));
}

// Helper function to check if task has results
export function hasTaskResult(task_id: string): boolean {
  return taskResults.has(task_id);
}