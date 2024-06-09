// Function checks if local storage already has data, if not it loads initialData to localStorage
import {getTasks, createNewTask, patchTask, putTask, deleteTask} from './utils/taskFunctions.js';
import {initialData} from './initialData.js'; //import initialData
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData)); 
    localStorage.setItem('showSideBar', 'true')
  } else {
    console.log('Data already exists in localStorage');
  }
};
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
    columnDivs: document.querySelectorAll(".column-div")
  };
  
console.log('Elements:', elements);

function toggleModal(show, modal = elements.newTaskModal) {
  if (modal) {
      modal.style.display = show ? 'block' : 'none';
  }if (elements.addNewTaskBtn) {
    elements.addNewTaskBtn.addEventListener('click', () => {
      toggleModal(true,  elements.newTaskModal);
      elements.filterDiv.style.display = 'block';
    });
}
}
toggleModal();
//let activeBoard = ""

function fetchAndDisplayBoardsAndTasks() {
  // Fetch tasks from local storage
  const tasks = getTasks();

  if (!tasks) {
      console.error('Failed to fetch tasks from local storage.');
      return;
  }

  // Extract unique board names from tasks
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];

  // Display boards
  displayBoards(boards);

  if (boards.length > 0) {
      // Retrieve the active board from local storage
      const localStorageBoard = localStorage.getItem("activeBoard");

      let activeBoard;
      try {
          activeBoard = JSON.parse(localStorageBoard);
      } catch (error) {
          console.error('Failed to parse active board from local storage:', error);
          activeBoard = null;
      }

      // Set active board from local storage or default to the first board
      activeBoard = activeBoard ? activeBoard : boards[0];

      // Update header with active board name
      elements.headerBoardName.textContent = activeBoard;

      // Style active board and refresh the task UI
      styleActiveBoard(activeBoard);
      refreshTasksUI();
  }
}
fetchAndDisplayBoardsAndTasks();


// Creates different boards in the DOM
function displayBoards(boards) {
  // Get the boards navigation container
  const boardsContainer = document.getElementById("boards-nav-links-div");

  // Clear existing content in the container
  boardsContainer.innerHTML = '';

  // Iterate over each board
  boards.forEach(board => {
      // Create a new button element for each board
      const boardElement = document.createElement("button");
      boardElement.textContent = board;
      boardElement.classList.add("board-btn");

      // Add click event listener to the board button
      boardElement.addEventListener("click", () => {
          // Update the header with the board name
          elements.headerBoardName.textContent = board;

          // Filter and display tasks for the board
          filterAndDisplayTasksByBoard(board);

          // Set the active board and store it in local storage
          activeBoard = board;
          localStorage.setItem("activeBoard", JSON.stringify(activeBoard));

          // Style the active board
          styleActiveBoard(activeBoard);
      });

      // Append the board button to the container
      boardsContainer.appendChild(boardElement);
  });
}
displayBoards();

function filterAndDisplayTasksByBoard(boardName) {
  // Fetch tasks from local storage
  const tasks = getTasks();
  
  // Filter tasks by the specified board name
  const filteredTasks = tasks.filter(task => task.board === boardName);

  // Iterate over each column div
  elements.columnDivs.forEach(column => {
      // Get the status of the column
      const status = column.getAttribute("data-status");
      
      // Reset the column content while preserving the column header
      column.innerHTML = `
          <div class="column-head-div">
              <span class="dot" id="${status}-dot"></span>
              <h4 class="columnHeader">${status.toUpperCase()}</h4>
          </div>
      `;

      // Check if a tasks container already exists in the column
      let tasksContainer = column.querySelector('.tasks-container');
      if (!tasksContainer) {
          // If not, create a new tasks container
          tasksContainer = document.createElement("div");
          tasksContainer.className = "tasks-container";
          column.appendChild(tasksContainer);
      }

      // Filter tasks by status and display them in the column
      filteredTasks.filter(task => task.status === status).forEach(task => {
          // Create a task element
          const taskElement = document.createElement("div");
          taskElement.classList.add("task-div");
          taskElement.textContent = task.title;
          taskElement.setAttribute('data-task-id', task.id);
          
          // Add a click event listener to open the edit task modal
          taskElement.addEventListener("click", () => openEditTaskModal(task));
          
          // Append the task element to the tasks container
          tasksContainer.appendChild(taskElement);
      });
  });
}
filterAndDisplayTasksByBoard();


function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
};
refreshTasksUI();

// Styles the active board by adding an active class
// TASK: Fix Bugs
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => { // changed from foreach - forEach
    
    if(btn.textContent === boardName) {
      btn.classList.add('active') 
    }
    else {
      btn.classList.remove('active'); 
    }
  });
}
styleActiveBoard();

function addTaskToUI(task) {
  // Find the appropriate column based on task status
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
      console.error(`Column not found for status: ${task.status}`);
      return;
  }

  // Find or create the tasks container in the column
  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
      console.warn(`Tasks container not found for status: ${task.status}, creating one.`);
      tasksContainer = document.createElement('div');
      tasksContainer.className = 'tasks-container';
      column.appendChild(tasksContainer);
  }

  // Create a task element and set its properties
  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Set the task title
  taskElement.setAttribute('data-task-id', task.id); // Set the task ID attribute

  // Append the task element to the tasks container
  tasksContainer.appendChild(taskElement);
}
addTaskToUI();

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener("click", () => {
      toggleModal(false, elements.editTaskModal);
      elements.filterDiv.style.display = 'none';
  });

  // Cancel adding new task event listener
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
      toggleModal(false);
      elements.filterDiv.style.display = 'none';
  });

  // Clicking outside the modal to close it
  elements.filterDiv.addEventListener('click', () => {
      toggleModal(false);
      elements.filterDiv.style.display = 'none';
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener("click", () => {
      toggleSidebar(false);
  });

  elements.showSideBarBtn.addEventListener("click", () => {
      toggleSidebar(true);
  });

  // Theme switch event listener
  elements.themeSwitch.addEventListener('click', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
      toggleModal(true, elements.newTaskModal);
      elements.filterDiv.style.display = 'block';
  });

  // Add new task form submission event listener
  elements.modalWindow.addEventListener('submit', addTask);
}
setupEventListeners();


// Toggles tasks modal
// Task: Fix bugs
/*function toggleModal(show, modal = elements.modalWindow) {
  console.log('toggleModal called with', show, modal);
  modal.style.display = show ? 'block' : 'none'; // sytanx error fixed
}*/
function addTask(event) {
  // Prevent the default form submission behavior
  event.preventDefault();

  // Retrieve user input from the form
  const title = document.getElementById("modal-title-input").value.trim();
  const description = document.getElementById("modal-desc-input").value.trim();
  const status = document.getElementById("modal-select-status").value;

  // Validate user input
  if (!title || !description || !status) {
      console.error('Invalid input: Title, description, and status are required.');
      return;
  }

  // Create a new task object with the retrieved user input
  const task = {
      title,
      description,
      status,
  };

  // Create the new task using the createNewTask function
  const newTask = createNewTask(task);

  // Check if the task was successfully created
  if (newTask) {
      // Add the new task to the UI using addTaskToUI
      addTaskToUI(newTask);

      // Close the modal and hide the filter div
      toggleModal(false, elements.newTaskModal);
      elements.filterDiv.style.display = 'none';

      // Reset the form inputs
      event.target.reset();

      // Refresh the task UI to reflect the changes
      refreshTasksUI();
  } else {
      console.error('Failed to create a new task.');
  }
}
addTask();


function toggleSidebar(show) {
  const sidebar = document.getElementById('side-bar-div');
  if (sidebar) {
    sidebar.style.display = show ? 'block' : 'none';
  }
}
toggleSidebar();

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  // Save the current theme preference to local storage
  const isLightTheme = document.body.classList.contains('light-theme');
  localStorage.setItem('light-theme', isLightTheme ? 'enabled' : 'disabled');
}
toggleTheme();

function openEditTaskModal(task) {
  // Ensure that the task object is defined and contains the necessary properties
  if (!task || typeof task !== 'object' || !task.title || !task.description || !task.status) {
      console.error('Invalid task object provided');
      return;
  }

  // Retrieve the edit inputs from the elements object
  const titleInput = elements.editTaskTitleInput;
  const descInput = elements.editTaskDescInput;
  const statusSelect = elements.editSelectStatus;

  // Check if the inputs are defined and accessible
  if (!titleInput || !descInput || !statusSelect) {
      console.error('One or more modal inputs are missing');
      return;
  }

  // Populate the modal inputs with the task details
  titleInput.value = task.title;
  descInput.value = task.description;
  statusSelect.value = task.status;

  // Show the edit task modal using the toggleModal function
  toggleModal(true, elements.editTaskModal);
}
openEditTaskModal();

function saveTaskChanges(taskId) {
  // Validate the provided taskId
  if (taskId === null || taskId === undefined) {
      console.error('Invalid task ID provided.');
      return;
  }

  // Retrieve updated values from the form inputs
  const title = elements.editTaskTitleInput.value.trim(); // Trim whitespace
  const description = elements.editTaskDescInput.value.trim(); // Trim whitespace
  const status = elements.editSelectStatus.value;

  // Validate the updated values
  if (!title || !description || !status) {
      console.error('Invalid input: Title, description, and status are required.');
      return;
  }

  // Create an object with the updated task details
  const updatedTask = {
      id: taskId,
      title,
      description,
      status,
      board: activeBoard, // The task's board should remain the same
  };

  // Update the task using the patchTask function
  const success = patchTask(taskId, updatedTask);

  // Handle the update success and failure
  if (success) {
      // Close the modal and refresh the UI to reflect the changes
      toggleModal(false, elements.editTaskModal);
      refreshTasksUI();
  } else {
      // Log an error message if the update failed
      console.error('Failed to update the task.');
  }
}
saveTaskChanges();

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
})

function init() {
  setupEventListeners(); // Sets up event listeners for the application

  // Toggle the visibility of the sidebar based on stored preference
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);

  // Toggle the light theme based on stored preference
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);

  // Fetch and display initial set of boards and tasks
  fetchAndDisplayBoardsAndTasks();
}
init();


