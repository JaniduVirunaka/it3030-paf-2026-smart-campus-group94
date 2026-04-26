import { useState, useEffect } from 'react';
import { getTicketComments, addTicketComment, deleteTicketComment, updateTicketComment } from '../services/api';

const TicketComments = ({ ticketId, currentUser }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');

    const loadComments = async () => {
        try {
            const data = await getTicketComments(ticketId);
            setComments(data || []);
        } catch (err) {
            console.error("Failed to load comments");
        }
    };

    useEffect(() => {
        loadComments();
    }, [ticketId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);
        try {
            await addTicketComment({
                ticketId,
                content: newComment,
                userName: currentUser?.name || currentUser?.email
            });
            setNewComment('');
            loadComments();
        } catch (err) {
            alert("Failed to add comment");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await deleteTicketComment(id);
            setComments(comments.filter(c => c.id !== id));
        } catch (err) {
            alert("Failed to delete comment");
        }
    };

    const handleUpdate = async (id) => {
        try {
            await updateTicketComment(id, editContent);
            setEditingId(null);
            loadComments();
        } catch (err) {
            alert("Failed to update comment");
        }
    };

    return (
        <div className="mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                💬 Discussion
            </h4>

            <div className="space-y-4 mb-6">
                {comments.map(comment => (
                    <div key={comment.id} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                                <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                    {comment.userName?.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">{comment.userName}</span>
                                <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleTimeString()}</span>
                            </div>
                            
                            {(comment.userId === currentUser?.email || currentUser?.roles?.includes('ROLE_ADMIN')) && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => { setEditingId(comment.id); setEditContent(comment.content); }}
                                        className="text-[10px] text-blue-500 hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-[10px] text-red-500 hover:underline"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {editingId === comment.id ? (
                            <div className="space-y-2">
                                <textarea 
                                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                />
                                <div className="flex gap-2">
                                    <button onClick={() => handleUpdate(comment.id)} className="text-[10px] bg-blue-600 text-white px-3 py-1 rounded-md font-bold">Save</button>
                                    <button onClick={() => setEditingId(null)} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1 rounded-md font-bold">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-600 dark:text-slate-300">{comment.content}</p>
                        )}
                    </div>
                ))}

                {comments.length === 0 && (
                    <p className="text-xs text-slate-400 italic text-center py-2">No comments yet. Start the conversation!</p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Add a comment..." 
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white transition-all"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={loading}
                />
                <button 
                    type="submit" 
                    disabled={loading || !newComment.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all"
                >
                    Post
                </button>
            </form>
        </div>
    );
};

export default TicketComments;
