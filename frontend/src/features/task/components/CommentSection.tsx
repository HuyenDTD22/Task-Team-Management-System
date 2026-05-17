import { useState } from 'react'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useAddComment,
  useUpdateComment,
  useDeleteComment,
} from '@/features/task/hooks/useTaskMutations'
import { useTaskComments } from '@/features/task/hooks/useTaskQueries'
import type { CommentResponse } from '@/types/task.types'

interface Props {
  taskId: string
  currentUserId: string
  canAddComment: boolean
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

// ── Single comment (root or reply) ────────────────────────────────────────────

interface CommentItemProps {
  comment: CommentResponse
  currentUserId: string
  canAddComment: boolean
  isReply?: boolean
  onReply?: (id: string) => void
  onEdit: (id: string, content: string) => void
  onDelete: (id: string) => void
  editingId: string | null
  editContent: string
  onEditContentChange: (v: string) => void
  onEditSave: (id: string) => void
  onEditCancel: () => void
  isUpdating: boolean
}

function CommentItem({
  comment: c,
  currentUserId,
  canAddComment,
  isReply = false,
  onReply,
  onEdit,
  onDelete,
  editingId,
  editContent,
  onEditContentChange,
  onEditSave,
  onEditCancel,
  isUpdating,
}: Readonly<CommentItemProps>) {
  const isAuthor = c.userId === currentUserId
  const isEditing = editingId === c.id

  return (
    <div className={`flex gap-3 ${isReply ? 'ml-10' : ''}`}>
      <Avatar name={c.userName} imageUrl={c.userAvatarUrl} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900">{c.userName}</span>
          <span className="text-xs text-slate-400">{formatTimestamp(c.createdAt)}</span>
          {c.edited && <span className="text-xs text-slate-400">(edited)</span>}
        </div>

        {isEditing ? (
          <div className="mt-1.5 space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => onEditContentChange(e.target.value)}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
            <div className="flex gap-2">
              <button
                onClick={() => onEditSave(c.id)}
                disabled={isUpdating || !editContent.trim()}
                className="flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdating && <Spinner size="sm" />}
                Save
              </button>
              <button
                onClick={onEditCancel}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">
              {c.content}
            </p>
            <div className="mt-1 flex gap-3">
              {/* Reply button: only on root comments and when user can comment */}
              {canAddComment && !isReply && onReply && (
                <button
                  onClick={() => onReply(c.id)}
                  className="text-xs text-slate-400 transition hover:text-indigo-600"
                >
                  Reply
                </button>
              )}
              {isAuthor && (
                <>
                  <button
                    onClick={() => onEdit(c.id, c.content)}
                    className="text-xs text-slate-400 transition hover:text-indigo-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(c.id)}
                    className="text-xs text-slate-400 transition hover:text-red-600"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main CommentSection ────────────────────────────────────────────────────────

export function CommentSection({ taskId, currentUserId, canAddComment }: Readonly<Props>) {
  const { data: page, isLoading } = useTaskComments(taskId)
  const { mutate: addComment, isPending: isAdding } = useAddComment(taskId)
  const { mutate: updateComment, isPending: isUpdating } = useUpdateComment(taskId)
  const { mutate: deleteComment } = useDeleteComment(taskId)

  const [newContent, setNewContent] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const allComments = page?.content ?? []

  // Split into roots + replies map (one level deep)
  const roots = allComments.filter((c) => c.parentId === null)
  const repliesMap = allComments.reduce<Record<string, CommentResponse[]>>((acc, c) => {
    if (c.parentId !== null) {
      acc[c.parentId] = [...(acc[c.parentId] ?? []), c]
    }
    return acc
  }, {})

  function handleAdd(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!newContent.trim()) return
    addComment({ content: newContent.trim() }, { onSuccess: () => setNewContent('') })
  }

  function handleReply(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!replyContent.trim() || !replyingToId) return
    addComment(
      { content: replyContent.trim(), parentId: replyingToId },
      {
        onSuccess: () => {
          setReplyContent('')
          setReplyingToId(null)
        },
      },
    )
  }

  function startEdit(id: string, content: string) {
    setEditingId(id)
    setEditContent(content)
  }

  function handleEditSave(id: string) {
    if (!editContent.trim()) return
    updateComment(
      { id, data: { content: editContent.trim() } },
      { onSuccess: () => setEditingId(null) },
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Spinner size="sm" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {confirmDeleteId && (
        <ConfirmDialog
          title="Delete comment"
          message="Delete this comment? This cannot be undone."
          confirmLabel="Delete comment"
          onConfirm={() => deleteComment(confirmDeleteId)}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}

      <h3 className="text-sm font-semibold text-slate-700">
        Comments{allComments.length > 0 ? ` (${allComments.length})` : ''}
      </h3>

      {/* Threaded comment list */}
      {roots.length > 0 && (
        <div className="space-y-4">
          {roots.map((root) => (
            <div key={root.id} className="space-y-3">
              {/* Root comment */}
              <CommentItem
                comment={root}
                currentUserId={currentUserId}
                canAddComment={canAddComment}
                onReply={(id) => { setReplyingToId(id); setReplyContent('') }}
                onEdit={startEdit}
                onDelete={setConfirmDeleteId}
                editingId={editingId}
                editContent={editContent}
                onEditContentChange={setEditContent}
                onEditSave={handleEditSave}
                onEditCancel={() => setEditingId(null)}
                isUpdating={isUpdating}
              />

              {/* Replies */}
              {(repliesMap[root.id] ?? []).map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={currentUserId}
                  canAddComment={canAddComment}
                  isReply
                  onEdit={startEdit}
                  onDelete={setConfirmDeleteId}
                  editingId={editingId}
                  editContent={editContent}
                  onEditContentChange={setEditContent}
                  onEditSave={handleEditSave}
                  onEditCancel={() => setEditingId(null)}
                  isUpdating={isUpdating}
                />
              ))}

              {/* Inline reply box */}
              {replyingToId === root.id && (
                <form onSubmit={handleReply} className="ml-10 flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder={`Reply to ${root.userName}…`}
                      rows={2}
                      autoFocus
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5 self-start">
                    <button
                      type="submit"
                      disabled={isAdding || !replyContent.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {isAdding && <Spinner size="sm" />}
                      Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setReplyingToId(null)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add root comment — hidden for VIEWER */}
      {canAddComment ? (
        <form onSubmit={handleAdd} className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Add a comment…"
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button
            type="submit"
            disabled={isAdding || !newContent.trim()}
            className="flex items-center gap-1.5 self-start rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {isAdding && <Spinner size="sm" />}
            Post
          </button>
        </form>
      ) : (
        <p className="text-sm italic text-slate-400">Comments are view-only for your role.</p>
      )}
    </div>
  )
}
