import { useState, useEffect } from 'react';
import { getAllCategories, addCategory, getAllItems, deleteCategory, updateCategory } from '../db/database';
import { formatCurrency, formatUnitType } from '../utils/formatters';
import Modal from '../components/UI/Modal';

export default function Categories() {
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cats, allItems] = await Promise.all([
            getAllCategories(),
            getAllItems()
        ]);
        setCategories(cats);
        setItems(allItems);
        setLoading(false);
    };

    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveCategory = async (e) => {
        e.preventDefault();

        if (!newCategoryName.trim()) {
            setError('Category name is required');
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        setError('');

        try {
            if (editingCategory) {
                await updateCategory(editingCategory.id, newCategoryName);
            } else {
                await addCategory(newCategoryName);
            }

            setNewCategoryName('');
            setEditingCategory(null);
            setShowAddModal(false);
            loadData();
        } catch (error) {
            alert('Error saving category. Name might be duplicate or invalid.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const openAddModal = () => {
        setEditingCategory(null);
        setNewCategoryName('');
        setError('');
        setShowAddModal(true);
    };

    const openEditModal = (cat) => {
        setEditingCategory(cat);
        setNewCategoryName(cat.name);
        setError('');
        setShowAddModal(true);
    };

    // Filter items by selected category
    const categoryItems = selectedCategory
        ? items.filter(item => item.category === selectedCategory.name)
        : [];

    return (
        <div>
            {/* Header */}
            <div className="page-header sticky-header flex justify-between items-center">
                <div>
                    <h1 className="page-title" style={{ marginBottom: '4px' }}>
                        {selectedCategory ? selectedCategory.name : 'Categories'}
                    </h1>
                    <p className="page-subtitle">
                        {selectedCategory
                            ? `${categoryItems.length} items`
                            : `${categories.length} categories`}
                    </p>
                </div>
                {selectedCategory ? (
                    <button
                        className="btn btn-secondary"
                        onClick={() => setSelectedCategory(null)}
                    >
                        ← Back to Categories
                    </button>
                ) : (
                    <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                    >
                        + Add Category
                    </button>
                )}
            </div>

            {/* Content */}
            {selectedCategory ? (
                /* Items List for Selected Category */
                <div className="items-grid">
                    {categoryItems.length > 0 ? (
                        categoryItems.map(item => (
                            <div key={item.id} className="card">
                                <div className="font-bold mb-xs">{item.name}</div>
                                <div className="text-secondary text-sm">
                                    {formatCurrency(item.price)} • {formatUnitType(item.unitType, item.customUnit)}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="empty-state" style={{
                            textAlign: 'center',
                            marginTop: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '60vh',
                            width: '100%',
                            gridColumn: '1 / -1'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📦</div>
                            <p style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No items in this category yet.</p>
                            <p className="text-sm text-secondary">Go to "All Items" to assign items to this category.</p>
                        </div>
                    )}
                </div>
            ) : (
                /* Categories Grid */
                <>
                    {categories.length > 0 ? (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: '16px'
                        }}>
                            {categories.map(cat => (
                                <div
                                    key={cat.id}
                                    className="card hover-effect"
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        padding: '24px',
                                        textAlign: 'center',
                                        minHeight: '120px',
                                        position: 'relative' // KEY FIX: Ensure absolute children are positioned relative to this card
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                                        📁
                                    </div>
                                    <div className="font-bold">{cat.name}</div>
                                    <div className="text-xs text-secondary mt-xs">
                                        {items.filter(i => i.category === cat.name).length} items
                                    </div>

                                    {/* Action Buttons */}
                                    <button
                                        className="btn btn-ghost btn-icon text-primary"
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            left: '4px',
                                            padding: '10px',
                                            minWidth: '44px',
                                            minHeight: '44px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            openEditModal(cat);
                                        }}
                                        title="Edit Category"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>

                                    <button
                                        className="btn btn-ghost btn-icon text-danger"
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            padding: '10px',
                                            minWidth: '44px',
                                            minHeight: '44px',
                                            borderRadius: '50%',
                                            backgroundColor: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 10
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeleteConfirm(cat);
                                        }}
                                        title="Delete Category"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
                            <h3>No Categories</h3>
                            <p>Create categories to organize your items.</p>
                            <button
                                className="btn btn-primary mt-md"
                                onClick={openAddModal}
                            >
                                Create First Category
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Category Modal */}
            <Modal
                isOpen={showAddModal}
                onClose={() => {
                    setShowAddModal(false);
                    setError('');
                    setNewCategoryName('');
                    setEditingCategory(null);
                }}
                title={editingCategory ? "Edit Category" : "Add New Category"}
                footer={
                    <>
                        <button
                            className="btn btn-secondary"
                            onClick={() => {
                                setShowAddModal(false);
                                setError('');
                                setNewCategoryName('');
                                setEditingCategory(null);
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveCategory}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : 'Save'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSaveCategory}>
                    <div className="input-group">
                        <label className="input-label">Category Name</label>
                        <input
                            type="text"
                            className={`input ${error ? 'input-error' : ''}`}
                            placeholder="e.g. Dairy, Snacks, Drinks"
                            value={newCategoryName}
                            onChange={(e) => {
                                setNewCategoryName(e.target.value);
                                if (error) setError('');
                            }}
                            autoFocus
                        />
                        {error && <p className="input-error-message">{error}</p>}
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Category"
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </button>
                        <button
                            className="btn btn-danger"
                            onClick={async () => {
                                if (deleteConfirm) {
                                    await deleteCategory(deleteConfirm.id);
                                    setDeleteConfirm(null);
                                    loadData();
                                }
                            }}
                        >
                            Delete
                        </button>
                    </>
                }
            >
                <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                <p className="text-secondary mt-sm">Items in this category will NOT be deleted, but they will be categorized as "Uncategorized".</p>
            </Modal>
        </div>
    );
}
