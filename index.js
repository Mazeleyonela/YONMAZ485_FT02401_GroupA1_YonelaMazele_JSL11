// Import functions and initial data
import { getTasks, createNewTask, patchTask, putTask, deleteTask } from './utils/taskFunctions.js';
import { initialData } from './initialData.js'; //import initialData

const STORAGE_KEYS = {
  TASKS: 'tasks',
  SHOW_SIDEBAR: 'showSideBar',
  ACTIVE_BOARD: 'activeBoard',
  LIGHT_THEME: 'light-theme'
};

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.TASKS)) {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(initialData)); 
    localStorage.setItem(STORAGE_KEYS.SHOW_SIDEBAR, 'true');
  } else {
    console.log('Data already exists in localStorage');
  }
}
initializeData();

// TASK: Get elements from the DOM
const elements = {
  addNewTaskBtn: document.getElementById("add-new-task-btn"),
  editBoardBtn: document.getElementById("edit-board-btn"),
  deleteBoardBtn: document.getElementById("deleteBoardBtn"),
  hideSideBarBtn: document.getElementById("hide-side-bar-btn"),
  showSideBarBtn: document.getElementById("show-side-bar-btn"),
  createTaskBtn: document.getElementById("create-task-btn"),
  cancelAddTaskBtn: document.getElementById("cancel-add-task-btn"),
  cancelEditBtn: document.getElementById("cancel-edit-btn"),
  saveTaskChangesBtn: document.getElementById("save-task-changes-btn"),
  deleteTaskBtn: document.getElementById("delete-task-btn"),
  titleInput: document.getElementById("title-input"),
  descInput: document.getElementById("desc-input"),
  statusSelect: document.getElementById("select-status"),
  editTaskTitleInput: document.getElementById("edit-task-title-input"),
  editTaskDescInput: document.getElementById("edit-task-desc-input"),
  editSelectStatus: document.getElementById("edit-select-status"),
  newTaskModal: document.getElementById("new-task-modal-window"),
  editTaskModal: document.getElementById("edit-task-form"),
  filterDiv: document.getElementById("filterDiv"),
  headerBoardName: document.getElementById("header-board-name"),
  boardsNavLinksDiv: document.getElementById("boards-nav-links-div"),
  columnDivs: document.querySelectorAll(".column-div"),
  themeSwitch: document.getElementById("switch")
};

console.log('Elements:', elements);

function toggleModal(show, modal = elements.newTaskModal) {
  if (modal) {
    modal.style.display = show ? 'block' : 'none';
    elements.filterDiv.style.display = show ? 'block' : 'none';
  }
}

// Global variable for activeBoard
let activeBoard = "";

// Function to fetch and display boards and tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  if (!tasks) {
    console.error('Failed to fetch tasks from local storage.');
    return;
  }

  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);

  if (boards.length > 0) {
    const localStorageBoard = localStorage.getItem(STORAGE_KEYS.ACTIVE_BOARD);
    try {
      activeBoard = JSON.parse(localStorageBoard) || boards[0];
    } catch (error) {
      console.error('Failed to parse active board from local storage:', error);
      activeBoard = boards[0];
    }

    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = elements.boardsNavLinksDiv;
  boardsContainer.innerHTML = '';

  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");

    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem(STORAGE_KEYS.ACTIVE_BOARD, JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });

    boardsContainer.appendChild(boardElement);
  });
}

function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.getAttribute("data-status");
    column.innerHTML = `
      <div class="column-head-div">
        <span class="dot" id="${status}-dot"></span>
        <h4 class="columnHeader">${status.toUpperCase()}</h4>
      </div>
    `;

    let tasksContainer = column.querySelector('.tasks-container');
    if (!tasksContainer) {
      tasksContainer = document.createElement("div");
      tasksContainer.className = "tasks-container";
      column.appendChild(tasksContainer);
    }

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.setAttribute('data-task-id', task.id);

      taskElement.addEventListener("click", () => openEditTaskModal(task));

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent === boardName);
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    tasksContainer = document.createElement('div');
    tasksContainer.className = 'tasks-container';
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title;
  taskElement.setAttribute('data-task-id', task.id);

  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  if (elements.cancelEditBtn) {
    elements.cancelEditBtn.addEventListener("click", () => {
      toggleModal(false, elements.editTaskModal);
    });
  }

  if (elements.cancelAddTaskBtn) {
    elements.cancelAddTaskBtn.addEventListener('click', () => {
      toggleModal(false);
    });
  }

  if (elements.filterDiv) {
    elements.filterDiv.addEventListener('click', () => {
      toggleModal(false);
    });
  }

  if (elements.hideSideBarBtn) {
    elements.hideSideBarBtn.addEventListener("click", () => {
      toggleSidebar(false);
    });
  }

  if (elements.showSideBarBtn) {
    elements.showSideBarBtn.addEventListener("click", () => {
      toggleSidebar(true);
    });
  }

  // Ensure theme switch exists
  if (elements.themeSwitch) {
    elements.themeSwitch.addEventListener('click', toggleTheme);
  }

  if (elements.addNewTaskBtn) {
    elements.addNewTaskBtn.addEventListener('click', () => {
      toggleModal(true, elements.newTaskModal);
    });
  }

  if (elements.newTaskModal) {
    elements.newTaskModal.addEventListener('submit', addTask);
  }
  if (elements.saveTaskChangesBtn) {
    elements.saveTaskChangesBtn.addEventListener('click', () => {
      const taskId = elements.editTaskModal.getAttribute('data-task-id');
      saveTaskChanges(taskId);
    });
  }
  if (elements.deleteTaskBtn){
    elements.deleteTaskBtn.addEventListener('click', () =>{
      const taskId = elements.editTaskModal.getAttribute('data-task-id');
      removeTask(taskId);
    });
  }
}

function addTask(event) {
  event.preventDefault();

  const title = elements.titleInput.value.trim();
  const description = elements.descInput.value.trim();
  const status = elements.statusSelect.value;

  if (!title || !description || !status) {
    console.error('Invalid input: Title, description, and status are required.');
    return;
  }

  const task = { title, description, status, board: activeBoard };
  const newTask = createNewTask(task);

  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false, elements.newTaskModal);
    refreshTasksUI();
    event.target.reset();
  } else {
    console.error('Failed to create a new task.');
  }
}

function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');
  if (sidebar) {
    sidebar.style.display = show ? 'block' : 'none';
  }
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  const isLightTheme = document.body.classList.contains('light-theme');
  localStorage.setItem(STORAGE_KEYS.LIGHT_THEME, isLightTheme ? 'enabled' : 'disabled');
}

function openEditTaskModal(task) {
  if (!task || typeof task !== 'object' || !task.title || !task.description || !task.status) {
    console.error('Invalid task object provided');
    return;
  }

  elements.editTaskModal.setAttribute('data-task-id', task.id);
  elements.editTaskTitleInput.value = task.title;
  elements.editTaskDescInput.value = task.description;
  elements.editSelectStatus.value = task.status;

  toggleModal(true, elements.editTaskModal);
}

function saveTaskChanges(taskId) {
  if (!taskId) {
    console.error('Invalid task ID provided.');
    return;
  }

  const title = elements.editTaskTitleInput.value.trim();
  const description = elements.editTaskDescInput.value.trim();
  const status = elements.editSelectStatus.value;

  if (!title || !description || !status) {
    console.error('Invalid input: Title, description, and status are required.');
    return;
  }

  const updatedTask = { id: taskId, title, description, status, board: activeBoard };
  const success = patchTask(taskId, updatedTask);

  if (success) {
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  } else {
    console.error('Failed to update the task.');
  }
}

function removeTask(taskId) {
  if (!taskId) {
    console.error('Invalid task ID provided.');
    return;
  }

  const success = deleteTask(taskId);

  if (success) {
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI();
  } else {
    console.error('Failed to delete the task.');
  }
}

document.addEventListener('DOMContentLoaded', function() {
  init();
});

function init() {
  setupEventListeners();

  const showSidebar = localStorage.getItem(STORAGE_KEYS.SHOW_SIDEBAR) === 'true';
  toggleSidebar(showSidebar);

  const isLightTheme = localStorage.getItem(STORAGE_KEYS.LIGHT_THEME) === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);

  fetchAndDisplayBoardsAndTasks();
}



