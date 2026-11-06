import { api } from "./client.js";
export const getTaskDetails = (workspaceId, taskId) => api.get(`/workspaces/${workspaceId}/tasks/${taskId}/details`).then((r) => r.data);
export const addComment = (workspaceId, taskId, content) => api.post(`/workspaces/${workspaceId}/tasks/${taskId}/comments`, { content });
export const addDependency = (workspaceId, taskId, dependsOnId) => api.post(`/workspaces/${workspaceId}/tasks/${taskId}/dependencies`, { dependsOnId });
export const removeDependency = (workspaceId, taskId, dependsOnId) => api.delete(`/workspaces/${workspaceId}/tasks/${taskId}/dependencies/${dependsOnId}`);

export const listMyTasks = () => api.get("/tasks").then((r) => r.data.tasks);
export const listWorkspaceTasks = (workspaceId) =>
  api.get(`/workspaces/${workspaceId}/tasks`).then((r) => r.data.tasks);
export const createTask = (workspaceId, data) =>
  api.post(`/workspaces/${workspaceId}/tasks`, data).then((r) => r.data.task);
export const updateTask = (workspaceId, taskId, data) =>
  api.patch(`/workspaces/${workspaceId}/tasks/${taskId}`, data).then((r) => r.data.task);
export const deleteTask = (workspaceId, taskId) =>
  api.delete(`/workspaces/${workspaceId}/tasks/${taskId}`).then((r) => r.data);
export const listTaskTrash = (workspaceId) =>
  api.get(`/workspaces/${workspaceId}/tasks/trash`).then((r) => r.data.tasks);
export const restoreTask = (workspaceId, taskId) =>
  api.post(`/workspaces/${workspaceId}/tasks/${taskId}/restore`).then((r) => r.data.task);
export const purgeTask = (workspaceId, taskId) =>
  api.delete(`/workspaces/${workspaceId}/tasks/${taskId}/purge`).then((r) => r.data);
