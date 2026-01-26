import { useState, useEffect } from 'react';
import { getAllItems, addItem, updateItem, deleteItem, getAllCategories } from '../db/database';
import { formatCurrency, formatUnitType } from '../utils/formatters';
import Modal from '../components/UI/Modal';

const ITEMS_PER_PAGE = 20;

const UNIT_TYPES = [
    { value: 'kg', label: 'Per Kg' },
    { value: 'packet', label: 'Per Packet' },
    { value: 'piece', label: 'Per Piece' },
    { value: 'box', label: 'Per Box' },
    { value: 'custom', label: 'Custom' }
];

const emptyItem = {
    name: '',
    category: '',
    unitType: 'piece',
    customUnit: '',
    price: '',
    notes: '',
    isFavorite: false
};

export default function AllItems() {
    const [items, setItems] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [formData, setFormData] = useState(emptyItem);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [allItems, allCats] = await Promise.all([
            getAllItems(),
            getAllCategories()
        ]);
        setItems(allItems);
        setCategories(allCats);
    };

    // Filter and paginate
    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const openAddModal = () => {
        setEditItem(null);
        setFormData(emptyItem);
        setErrors({});
        setModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditItem(item);
        setErrors({});
        setFormData({
            name: item.name,
            category: item.category || '',
            unitType: item.unitType,
            customUnit: item.customUnit || '',
            price: item.price.toString(),
            notes: item.notes || '',
            isFavorite: item.isFavorite || false
        });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Item name is required';
        if (!formData.price) newErrors.price = 'Price is required';

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        const itemData = {
            name: formData.name.trim(),
            category: formData.category.trim(),
            unitType: formData.unitType,
            customUnit: formData.unitType === 'custom' ? formData.customUnit.trim() : '',
            price: parseFloat(formData.price),
            notes: formData.notes.trim(),
            isFavorite: formData.isFavorite
        };

        if (editItem) {
            await updateItem({ ...editItem, ...itemData });
        } else {
            await addItem(itemData);
        }

        setModalOpen(false);
        setErrors({});
        loadData();
    };

    const handleDelete = async () => {
        if (deleteConfirm) {
            await deleteItem(deleteConfirm.id);
            setDeleteConfirm(null);
            loadData();
        }
    };

    const toggleFavorite = async (item) => {
        await updateItem({ ...item, isFavorite: !item.isFavorite });
        loadData();
    };

    const duplicateItem = async (item) => {
        const newItem = {
            name: `${item.name} (Copy)`,
            category: item.category || '',
            unitType: item.unitType,
            customUnit: item.customUnit || '',
            price: item.price,
            notes: item.notes || '',
            isFavorite: false
        };
        await addItem(newItem);
        loadData();
    };

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">All Items</h1>
                    <p className="page-subtitle">{items.length} items</p>
                </div>
                <button className="btn btn-primary" onClick={openAddModal}>
                    + Add Item
                </button>
            </div>

            {/* Search */}
            <div className="input-group mb-md">
                <input
                    type="text"
                    className="input input-search"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            {/* Items List */}
            {paginatedItems.length === 0 ? (
                <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="empty-state-title">
                        {searchQuery ? 'No items found' : 'No items yet'}
                    </p>
                    <p>
                        {searchQuery ? 'Try a different search' : 'Add your first item to get started'}
                    </p>
                </div>
            ) : (
                <div>
                    {paginatedItems.map(item => (
                        <div key={item.id} className="card mb-sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }} onClick={() => openEditModal(item)}>
                                <div className="flex items-center gap-sm">
                                    <span className="font-semibold">{item.name}</span>
                                    {item.isFavorite && <span>⭐</span>}
                                </div>
                                <div className="text-secondary" style={{ fontSize: '0.875rem' }}>
                                    {formatCurrency(item.price)} • {formatUnitType(item.unitType, item.customUnit)}
                                    {item.category && ` • ${item.category}`}
                                </div>
                            </div>
                            <div className="flex gap-sm">
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => duplicateItem(item)}
                                    title="Duplicate item"
                                >
                                    📋
                                </button>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => toggleFavorite(item)}
                                    title={item.isFavorite ? 'Remove favorite' : 'Add favorite'}
                                >
                                    {item.isFavorite ? '⭐' : '☆'}
                                </button>
                                <button
                                    className="btn btn-ghost btn-icon text-danger"
                                    onClick={() => setDeleteConfirm(item)}
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editItem ? 'Edit Item' : 'Add New Item'}
                footer={
                    <>
                        <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
                            Cancel
                        </button>
                        <button className="btn btn-primary" onClick={handleSubmit}>
                            {editItem ? 'Save Changes' : 'Add Item'}
                        </button>
                    </>
                }
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-group mb-md">
                        <label className="input-label">Item Name *</label>
                        <input
                            type="text"
                            className={`input ${errors.name ? 'input-error' : ''}`}
                            placeholder="e.g. چینی Sugar"
                            value={formData.name}
                            onChange={(e) => {
                                setFormData({ ...formData, name: e.target.value });
                                if (errors.name) setErrors({ ...errors, name: null });
                            }}
                            autoFocus
                        />
                        {errors.name && <span className="text-danger text-sm">{errors.name}</span>}
                    </div>

                    <div className="input-group mb-md">
                        <label className="input-label">Category</label>
                        <select
                            className="input"
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group mb-md">
                        <label className="input-label">Unit Type *</label>
                        <select
                            className="input"
                            value={formData.unitType}
                            onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                        >
                            {UNIT_TYPES.map(unit => (
                                <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.unitType === 'custom' && (
                        <div className="input-group mb-md">
                            <label className="input-label">Custom Unit</label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g. 2 Liter Bottle"
                                value={formData.customUnit}
                                onChange={(e) => setFormData({ ...formData, customUnit: e.target.value })}
                            />
                        </div>
                    )}

                    <div className="input-group mb-md">
                        <label className="input-label">Price (₨) *</label>
                        <input
                            type="number"
                            className={`input ${errors.price ? 'input-error' : ''}`}
                            placeholder="0"
                            value={formData.price}
                            onChange={(e) => {
                                setFormData({ ...formData, price: e.target.value });
                                if (errors.price) setErrors({ ...errors, price: null });
                            }}
                            min="0"
                            step="0.01"
                        />
                        {errors.price && <span className="text-danger text-sm">{errors.price}</span>}
                    </div>

                    <div className="input-group mb-md">
                        <label className="input-label">Notes (optional)</label>
                        <textarea
                            className="input"
                            placeholder="Any additional info"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows="2"
                            style={{ resize: 'vertical' }}
                        />
                    </div>

                    <div className="settings-item" style={{ marginBottom: 0 }}>
                        <span>Mark as Favorite</span>
                        <div
                            className={`toggle ${formData.isFavorite ? 'active' : ''}`}
                            onClick={() => setFormData({ ...formData, isFavorite: !formData.isFavorite })}
                        />
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Delete Item"
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
                <p>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>?</p>
                <p className="text-secondary mt-sm">This action cannot be undone.</p>
            </Modal>
        </div>
    );
}
