import { useMutation, useQueryClient } from '@tanstack/react-query'
import { taskApi } from '@/api/endpoints/task.api'
import { queryKeys } from '@/api/queryKeys'
import type { TaskStatus } from '@/types/common.types'
import type {
  CreateTaskRequest,
  UpdateTaskRequest,
  UpdateTaskStatusRequest,
  AssignTaskRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/task.types'

export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      taskApi.create(projectId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

export function useUpdateTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTaskRequest) =>
      taskApi.update(taskId, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task.detail(taskId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => taskApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

export function useChangeTaskStatus(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: UpdateTaskStatusRequest) =>
      taskApi.changeStatus(taskId, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task.detail(taskId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

// Board-level status change: taskId is passed as mutation variable, not constructor arg.
// Used by KanbanBoard where the dragged task changes on each drag event.
export function useChangeAnyTaskStatus(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: TaskStatus }) =>
      taskApi.changeStatus(taskId, { status }).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

export function useAssignTask(taskId: string, projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: AssignTaskRequest) =>
      taskApi.assign(taskId, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.task.detail(taskId), updated)
      queryClient.invalidateQueries({ queryKey: queryKeys.task.byProject(projectId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.task.mine() })
    },
  })
}

export function useAddComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      taskApi.addComment(taskId, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.comments(taskId) })
    },
  })
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommentRequest }) =>
      taskApi.updateComment(id, data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.comments(taskId) })
    },
  })
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => taskApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.task.comments(taskId) })
    },
  })
}
