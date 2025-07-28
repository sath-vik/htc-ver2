import React, { useState } from 'react';
import Todo from '../Todo/Todo';
import AddTodoModal from '../AddTodoModal/AddTodoModal';
import './TodoList.css';

const TodoList = ({ todos, setTodos, completeTodo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState(null);

  const handleAdd = (todo) => {
    setTodos([...todos, { id: Date.now(), ...todo, isCompleted: false }]);
    closeModal();
  };

  const handleEdit = (updatedTodo) => {
    setTodos(todos.map(todo => (todo.id === updatedTodo.id ? updatedTodo : todo)));
    closeModal();
  };

  const handleDelete = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const openEditModal = (todo) => {
    setEditingTodo(todo);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTodo(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTodo(null);
  };

  return (
    <div className="todo-list-container">
      {todos.length === 0 ? (
        <div className="empty-state">
          <p>No todo tasks as of now..</p>
          <button className="add-button" onClick={openAddModal}>+</button>
        </div>
      ) : (
        <div className="todos">
          {todos.map(todo => (
            <Todo
              key={todo.id}
              todo={todo}
              completeTodo={completeTodo}
              deleteTodo={handleDelete}
              onEdit={openEditModal}
            />
          ))}
          <button className="add-button" onClick={openAddModal}>+</button>
        </div>
      )}
      {isModalOpen && (
        <AddTodoModal
          onAdd={editingTodo ? handleEdit : handleAdd}
          onCancel={closeModal}
          todo={editingTodo}
        />
      )}
    </div>
  );
};

export default TodoList;
