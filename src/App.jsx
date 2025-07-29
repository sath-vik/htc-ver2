import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiUser, FiEye, FiEyeOff, FiFilter, FiPlus } from 'react-icons/fi';
import './App.css';
import HabitList from './components/HabitList/HabitList';
import CategoryModal from './components/CategoryModal/CategoryModal';
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal';
import AddHabitPanel from './components/AddHabitPanel/AddHabitPanel';
import TodoList from './components/TodoList/TodoList';
import CalendarView from './components/CalendarView/CalendarView';
import ContextMenu from './components/ContextMenu/ContextMenu';
import Tooltip from './components/Tooltip/Tooltip';

function App() {
  const [activeView, setActiveView] = useState('habits');
  const [habits, setHabits] = useState([]);
  const [todos, setTodos] = useState([]);
  const [categories, setCategories] = useState(['Daily', 'Health', 'Study']);
  const [activeCategory, setActiveCategory] = useState('Daily');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isHabitConfirmModalOpen, setIsHabitConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [habitToDelete, setHabitToDelete] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [totalCoins, setTotalCoins] = useState(10);
  const [lastIncrement, setLastIncrement] = useState(null);
  const [animationTimer, setAnimationTimer] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const [showCompleted, setShowCompleted] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [notification, setNotification] = useState('');

  const filterMenuRef = useRef(null);

  const getTodayString = () => new Date().toISOString().split('T')[0];

  const filterTitles = {
    all: 'All Habits',
    ongoing: 'On-going Habits',
    completed: 'Completed Habits',
  };

  const headerTitle = activeView === 'habits' ? filterTitles[filterType] : (activeView.charAt(0).toUpperCase() + activeView.slice(1));

  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    const mockProgress = (goal, initialTodayValue = 0) => {
        let progress = {};
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dateString = date.toISOString().split('T')[0];
            if (dateString === todayString) {
                progress[dateString] = initialTodayValue;
            } else {
                progress[dateString] = 0;
            }
        }
        return progress;
    };

    setHabits([
        { id: 1, text: 'Exercise', icon: '🏃', coins: 0.3, penalty: 0.1, goal: 10, category: 'Daily', progress: mockProgress(10, 3) },
        { id: 2, text: 'Read a book', icon: '📚', coins: 0.5, penalty: 0.2, goal: 1, category: 'Study', progress: mockProgress(1, 1) },
        { id: 3, text: 'Meditate', icon: '🧘', coins: 0.2, penalty: 0.1, goal: 1, category: 'Health', progress: mockProgress(1, 0) },
    ]);
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleContextMenu = (event, item, type) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    let options = [];

    if (type === 'category') {
      options = [
        { label: 'Edit name', action: () => handleEditCategory(item) },
        { label: 'Delete category', action: () => handleDeleteRequest(item) },
      ];
    } else if (type === 'habit') {
        if (categories.filter(c => c !== item.category).length > 0) {
            options = [{
                label: 'Move to',
                submenu: categories.filter(c => c !== item.category).map(cat => ({
                    label: cat,
                    action: () => onMoveToCategory(item.id, cat)
                }))
            }];
        }
    }

    setContextMenu({
      x: rect.left + window.scrollX,
      y: rect.bottom + window.scrollY + 5,
      options: options,
    });
  };

  const closeContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleGlobalClick = (event) => {
        if (contextMenu && !event.target.closest('.context-menu')) {
            closeContextMenu();
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === 'Escape') {
            closeContextMenu();
        }
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('click', handleGlobalClick);
        window.removeEventListener('keydown', handleKeyDown);
    };
}, [contextMenu]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
        setShowFilterMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowFilterMenu(false);
      }
    };

    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showFilterMenu]);

  const getTodaysProgress = (habit) => {
    const todayStr = getTodayString();
    return habit.progress[todayStr] || 0;
  }

  const completeHabit = (id) => {
    let coinGained = 0;
    const todayStr = getTodayString();

    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const todaysProgress = getTodaysProgress(habit);
        if (todaysProgress < habit.goal) {
          coinGained = habit.coins;
          const newProgress = { ...habit.progress, [todayStr]: todaysProgress + 1 };
          return { ...habit, progress: newProgress };
        }
      }
      return habit;
    }));

    if (coinGained > 0) {
      setTotalCoins(prevCoins => prevCoins + coinGained);
      if (animationTimer) clearTimeout(animationTimer);
      setLastIncrement({ amount: coinGained, key: Date.now() });
      const timer = setTimeout(() => setLastIncrement(null), 1500);
      setAnimationTimer(timer);
    }
  };

  const resetHabit = (id) => {
    let coinsToDeduct = 0;
    const todayStr = getTodayString();

    setHabits(habits.map(habit => {
      if (habit.id === id) {
        const todaysProgress = getTodaysProgress(habit);
        if (todaysProgress > 0) {
            coinsToDeduct = habit.coins * todaysProgress;
            const newProgress = { ...habit.progress, [todayStr]: 0 };
            return { ...habit, progress: newProgress };
        }
      }
      return habit;
    }));

    if (coinsToDeduct > 0) {
      setTotalCoins(prevCoins => prevCoins - coinsToDeduct);
    }
  };

  const completeTodo = (id, isCompleted) => {
    let pointsChanged = 0;
    setTodos(todos.map(todo => {
      if (todo.id === id) {
        pointsChanged = todo.points;
        return { ...todo, isCompleted: !isCompleted };
      }
      return habit;
    }));

    if (isCompleted) {
      setTotalCoins(prevCoins => prevCoins - pointsChanged);
    } else {
      setTotalCoins(prevCoins => prevCoins + pointsChanged);
    }
  };

  const addHabit = (newHabit) => {
    const habitToAdd = { 
        ...newHabit, 
        id: Date.now(), 
        progress: {}, 
        category: activeCategory 
    };
    setHabits([...habits, habitToAdd]);
    setIsAddPanelOpen(false);
  };

  const editHabit = (updatedHabit) => {
    setHabits(habits.map(habit => (habit.id === updatedHabit.id ? updatedHabit : habit)));
    setEditingHabit(null);
    setIsAddPanelOpen(false);
  };

  const deleteHabit = (id) => {
    setHabitToDelete(id);
    setIsHabitConfirmModalOpen(true);
  };

  const confirmDeleteHabit = () => {
    setHabits(habits.filter(habit => habit.id !== habitToDelete));
    setIsHabitConfirmModalOpen(false);
    setHabitToDelete(null);
  }

  const openAddHabitPanel = () => {
    setEditingHabit(null);
    setIsAddPanelOpen(true);
  };

  const openEditHabitPanel = (habit) => {
    setEditingHabit(habit);
    setIsAddPanelOpen(true);
  };

  const addCategory = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }
  
  const handleAddCategory = (newCategory) => {
    if (editingCategory) {
      setCategories(categories.map(c => c === editingCategory ? newCategory : c));
      setHabits(habits.map(h => h.category === editingCategory ? { ...h, category: newCategory } : h));
      if (activeCategory === editingCategory) {
        setActiveCategory(newCategory);
      }
    } else {
      if (newCategory && !categories.includes(newCategory)) {
        setCategories([...categories, newCategory]);
        setActiveCategory(newCategory);
      }
    }
    setIsModalOpen(false);
    setEditingCategory(null);
  };
  
  const handleDeleteRequest = (category) => {
    setShowFilterMenu(false);
    setCategoryToDelete(category);
    setIsConfirmModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    const newCategories = categories.filter(c => c !== categoryToDelete);
    setHabits(habits.filter(habit => habit.category !== categoryToDelete));
    setCategories(newCategories);
  
    if (activeCategory === categoryToDelete) {
      if (newCategories.length > 0) {
        setActiveCategory(newCategories[0]);
      } else {
        const newUntitledCategory = 'Untitled';
        setCategories([newUntitledCategory]);
        setActiveCategory(newUntitledCategory);
      }
    }
  
    setIsConfirmModalOpen(false);
    setCategoryToDelete(null);
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsModalOpen(true);
  };

  const handleMoveToCategory = (habitId, newCategory) => {
    const movedHabit = habits.find(h => h.id === habitId);
    setHabits(habits.map(h => h.id === habitId ? { ...h, category: newCategory } : h));
    setNotification(`Moved "${movedHabit.text}" to ${newCategory}`);
  };

  const onMoveToCategory = (habitId, newCategory) => {
    handleMoveToCategory(habitId, newCategory);
    closeContextMenu();
  };

  const handleStats = (habit) => {
    alert(`Showing stats for ${habit.text}`);
  }
  
  const toggleShowCompleted = () => {
    setShowFilterMenu(false);
    setNotification(showCompleted ? 'Hiding completed habits' : 'Showing completed habits');
    setShowCompleted(!showCompleted);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setShowFilterMenu(false);
    setNotification(`Showing: ${filterTitles[type]}`);
  };

  const filteredHabits = habits.filter(habit => {
    const todaysProgress = getTodaysProgress(habit);
    const isCompleted = todaysProgress >= habit.goal;
    
    if (habit.category !== activeCategory) return false;
    if (!showCompleted && isCompleted) return false;
    if (filterType === 'ongoing' && isCompleted) return false;
    if (filterType === 'completed' && !isCompleted) return false;
    return true;
  });

  return (
    <div className="App" onClick={closeContextMenu}>
      <div className="app-container">
        {notification && <div className="notification">{notification}</div>}
        {isModalOpen && <CategoryModal onAdd={handleAddCategory} onCancel={() => setIsModalOpen(false)} category={editingCategory} />}
        {isConfirmModalOpen && (
          <ConfirmationModal
            message={`This will also delete all habits in the "${categoryToDelete}" category.`}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setIsConfirmModalOpen(false)}
          />
        )}
        {isHabitConfirmModalOpen && (
          <ConfirmationModal
            message={`Are you sure you want to delete this habit?`}
            onConfirm={confirmDeleteHabit}
            onCancel={() => setIsHabitConfirmModalOpen(false)}
          />
        )}
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            options={contextMenu.options}
            onClose={closeContextMenu}
          />
        )}
        <header className="app-header">
          <div className="header-left">
            <button className="icon-button"><FiSettings /></button>
            <span className="header-title">{headerTitle}</span>
          </div>
          <div className="header-right">
            <div className="total-coins-container">
              <span className="total-coins-display">💰 {totalCoins.toFixed(1)}</span>
              {lastIncrement && <span key={lastIncrement.key} className="coin-increment-animation">+{lastIncrement.amount.toFixed(1)}</span>}
            </div>
            <button className="icon-button"><FiUser /></button>
          </div>
        </header>

        <div className="main-nav-container">
          <button className={`main-nav-btn ${activeView === 'habits' ? 'active' : ''}`} onClick={() => setActiveView('habits')}>HABITS</button>
          <button className={`main-nav-btn ${activeView === 'todo' ? 'active' : ''}`} onClick={() => setActiveView('todo')}>TODO</button>
          <button className={`main-nav-btn ${activeView === 'calendar' ? 'active' : ''}`} onClick={() => setActiveView('calendar')}>CALENDAR</button>
        </div>

        <main className="main-content">
          {activeView === 'habits' && (
            <>
              <div className="top-bar">
                <nav className="category-nav">
                  {categories.map(category => (
                    <div 
                      key={category} 
                      className="nav-button-group"
                      onContextMenu={(e) => handleContextMenu(e, category, 'category')}
                    >
                      <button onClick={() => setActiveCategory(category)} className={`nav-button ${activeCategory === category ? 'active' : ''}`}>{category}</button>
                      <button onClick={() => handleDeleteRequest(category)} className="delete-category-btn">
                        <span className="cross-icon">×</span>
                      </button>
                    </div>
                  ))}
                  <button onClick={addCategory} className="icon-button add-category-btn">
                    <FiPlus />
                  </button>
                </nav>

                <div className="actions-toolbar">
                  <Tooltip text={showCompleted ? 'Hide Completed' : 'Show Completed'}>
                    <button className="icon-button" onClick={toggleShowCompleted}>
                      {showCompleted ? <FiEye /> : <FiEyeOff />}
                    </button>
                  </Tooltip>
                  <div className="filter-menu" ref={filterMenuRef}>
                    <Tooltip text="Filter Habits">
                      <button className="icon-button" onClick={() => setShowFilterMenu(!showFilterMenu)}>
                        <FiFilter />
                      </button>
                    </Tooltip>
                    {showFilterMenu && (
                      <div className="filter-options">
                        <div className="filter-option" onClick={() => handleFilterChange('all')}>All Habits</div>
                        <div className="filter-option" onClick={() => handleFilterChange('ongoing')}>On-going</div>
                        <div className="filter-option" onClick={() => handleFilterChange('completed')}>Completed</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="main-layout-container">
                <HabitList
                  habits={filteredHabits}
                  categories={categories.filter(c => c !== activeCategory)}
                  completeHabit={completeHabit}
                  resetHabit={resetHabit}
                  onAddHabitClick={openAddHabitPanel}
                  onEditHabit={openEditHabitPanel}
                  onDeleteHabit={deleteHabit}
                  onMoveToCategory={onMoveToCategory}
                  onStats={handleStats}
                  onContextMenu={handleContextMenu}
                />
                {isAddPanelOpen && (
                  <div className="add-habit-panel-section">
                    <AddHabitPanel
                      onAddHabit={editingHabit ? editHabit : addHabit}
                      onCancel={() => setIsAddPanelOpen(false)}
                      habit={editingHabit}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          {activeView === 'todo' && <TodoList todos={todos} setTodos={setTodos} completeTodo={completeTodo} setTotalCoins={setTotalCoins} />}
          {activeView === 'calendar' && (
            <div className="calendar-view-wrapper">
              <CalendarView />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;