import React, { useState, useEffect } from 'react';
import './CategoryModal.css';

const CategoryModal = ({ onAdd, onCancel, category }) => {
  const [categoryName, setCategoryName] = useState('');

  useEffect(() => {
    if (category) {
      setCategoryName(category);
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (categoryName.trim()) {
      onAdd(categoryName.trim());
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onCancel]);

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{category ? 'Edit Category' : 'Add New Category'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            placeholder="Category Name"
            className="category-input"
            autoFocus
          />
          <div className="modal-actions">
            <button type="submit" className="add-btn">{category ? 'Save' : 'Add'}</button>
            <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
