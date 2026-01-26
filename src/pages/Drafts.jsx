import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllDrafts, deleteDraft, getDraft } from '../db/database';
import { formatDateTime, formatCurrency } from '../utils/formatters';
import Modal from '../components/UI/Modal';

const DRAFTS_PER_PAGE = 10;

export default function Drafts() {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        loadDrafts();
    }, []);

    const loadDrafts = async () => {
        const allDrafts = await getAllDrafts();
        setDrafts(allDrafts);
    };

    const totalPages = Math.ceil(drafts.length / DRAFTS_PER_PAGE);
    const paginatedDrafts = drafts.slice(
        (currentPage - 1) * DRAFTS_PER_PAGE,
        currentPage * DRAFTS_PER_PAGE
    );

    const handleContinue = async (draftId) => {
        // Store draft ID in sessionStorage to load in NewBill
        sessionStorage.setItem('continueDraft', draftId);
        navigate('/');
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteDraft(deleteConfirm.id);
            setDeleteConfirm(null);
            loadDrafts();
        }
    };

    return (
        <div>
            <div className="page-header sticky-header">
                <h1 className="page-title">Drafts</h1>
                <p className="page-subtitle">{drafts.length} saved drafts</p>
            </div>

            {paginatedDrafts.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    <p className="empty-state-title">No drafts</p>
                    <p>Save incomplete bills as drafts to continue later</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {paginatedDrafts.map(draft => (
                        <div key={draft.id} className="draft-card">
                            <div className="draft-card-content">
                                <div className="draft-card-header">
                                    <h3 className="draft-customer-name">
                                        {draft.customerName || 'Walk-in Customer'}
                                    </h3>
                                    <span className="draft-date">
                                        {formatDateTime(draft.date)}
                                    </span>
                                </div>

                                <div className="draft-card-meta">
                                    <span className="draft-items-badge">
                                        {draft.items?.length || 0} Items
                                    </span>
                                    {draft.totalAmount > 0 && (
                                        <span className="draft-total">
                                            {formatCurrency(draft.totalAmount)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="draft-card-actions">
                                <button
                                    className="btn btn-primary"
                                    onClick={() => handleContinue(draft.id)}
                                >
                                    Continue
                                </button>
                                <button
                                    className="btn btn-icon btn-danger-light"
                                    onClick={() => setDeleteConfirm(draft)}
                                    title="Delete Draft"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-sm mt-lg">
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => p - 1)}
                            >
                                Previous
                            </button>
                            <span className="flex items-center text-secondary">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary btn-sm"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => p + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Draft"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </button>
                        <button className="btn btn-danger" onClick={handleDelete}>
                            Delete
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to delete this draft?</p>
                <p className="text-secondary mt-sm">This action cannot be undone.</p>
            </Modal>
        </div>
    );
}
