// src/pages/members/learning/CategoryFilter.jsx
import React from 'react';

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div style={styles.container}>
      <div style={styles.categoriesGrid}>
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            style={{
              ...styles.categoryButton,
              ...(selectedCategory === category.id ? styles.categoryButtonActive : {}),
              borderColor: category.color,
              ...(selectedCategory === category.id ? { backgroundColor: category.color, color: 'white' } : {}),
            }}
          >
            <span style={styles.categoryIcon}>{category.icon}</span>
            <span style={styles.categoryName}>{category.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    marginBottom: '30px',
    overflowX: 'auto',
    padding: '5px 0',
  },
  categoriesGrid: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  categoryButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: 'white',
    border: '2px solid',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
    whiteSpace: 'nowrap',
  },
  categoryButtonActive: {
    color: 'white',
  },
  categoryIcon: {
    fontSize: '16px',
  },
  categoryName: {
    fontSize: '14px',
  },
};

export default CategoryFilter;