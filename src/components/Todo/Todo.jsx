import React, { useState } from 'react';
import './Todo.css';
import { FiMoreHorizontal } from 'react-icons/fi';

const Todo = ({ todo, completeTodo, deleteTodo, onEdit }) => {
  const handleComplete = () => {
    completeTodo(todo.id, todo.isCompleted);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    deleteTodo(todo.id);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(todo);
  };

  const formattedDueDate = new Date(todo.dueDate).toLocaleString([], {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const isOverdue = new Date(todo.dueDate) < new Date();

  return (
    <div
      className={`todo-item ${todo.isCompleted ? 'completed' : ''}`}
      onClick={handleComplete}
    >
      <div className="checkbox"></div>
      <span className="text">{todo.text}</span>
      <div className="todo-details">
        <span className="points">💰{todo.points}</span>
        <span className={`due-date ${isOverdue && !todo.isCompleted ? 'overdue' : ''}`}>
          Due: {formattedDueDate}
        </span>
        <button className="edit-button" onClick={handleEdit}>
          <FiMoreHorizontal />
        </button>
        <button className="delete-button" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </div>
  );
};

export default Todo;
