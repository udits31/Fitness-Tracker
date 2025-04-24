let workoutList = [];
let exercises = [];

// DOM elements
let searchExerciseEl;
let filterMuscleEl;
let sortExercisesEl;
let exerciseListEl;
let workoutCartEl;
let workoutNameEl;
let workoutTagEl;
let errorMessageEl;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  searchExerciseEl = document.getElementById('searchExercise');
  filterMuscleEl = document.getElementById('filterMuscle');
  sortExercisesEl = document.getElementById('sortExercises');
  exerciseListEl = document.getElementById('exerciseList');
  workoutCartEl = document.getElementById('workoutCart');
  workoutNameEl = document.getElementById('workoutName');
  workoutTagEl = document.getElementById('workoutTag');
  errorMessageEl = document.getElementById('errorMessage');
  
  fetchExercises();
});

// Fetch exercises from the server
async function fetchExercises() {
  try {
    const response = await fetch('/api/workouts/exercises');
    if (!response.ok) {
      throw new Error('Failed to fetch exercises');
    }
    const data = await response.json();
    console.log('Fetched exercises data:', data); 
    if (data.success) {
      exercises = data.exercises.map(exercise => ({
        id: exercise.exercise_id,
        name: exercise.exercise_name,
        equipment: exercise.equipment,
        muscle: exercise.muscle_groups
      }));
      
      console.log('Processed exercises:', exercises); 
      updateMuscleGroupFilter();
      filterExercises();
    } else {
      throw new Error(data.message || 'Failed to fetch exercises');
    }
  } catch (error) {
    console.error('Error fetching exercises:', error);
    showErrorMessage('Error loading exercises. Please refresh the page.');
  }
}

// Update muscle group filter
function updateMuscleGroupFilter() {
  const uniqueMuscleGroups = [...new Set(exercises.map(ex => ex.muscle))].filter(Boolean);
  uniqueMuscleGroups.sort();
  
  filterMuscleEl.innerHTML = `
    <option value="">All Muscle Groups</option>
    ${uniqueMuscleGroups.map(muscle => `
      <option value="${muscle}">${muscle}</option>
    `).join('')}
  `;
}

// Filter exercises 
function filterExercises() {
  const searchTerm = searchExerciseEl.value.toLowerCase();
  const muscleFilter = filterMuscleEl.value;
  exerciseListEl.innerHTML = '';

  console.log('Filtering exercises:', { 
    totalExercises: exercises.length,
    searchTerm,
    muscleFilter
  });

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm);
    const matchesMuscle = !muscleFilter || exercise.muscle === muscleFilter;
    return matchesSearch && matchesMuscle;
  });

  console.log('Filtered exercises:', filteredExercises); 

  filteredExercises.forEach(exercise => {
    exerciseListEl.innerHTML += `
      <div class="exercise">
        <div class="exercise-info">
          <span class="exercise-name">${exercise.name}</span>
          <div class="exercise-tags">
            ${exercise.equipment ? 
              `<span class="equipment-tag">${exercise.equipment}</span>` : ''}
            ${exercise.muscle ? 
              `<span class="muscle-group">${exercise.muscle}</span>` : ''}
          </div>
        </div>
        <button class="btn" onclick="addToWorkout('${exercise.name}')">Add</button>
      </div>
    `;
  });
}

// Sort exercises 
function sortExercises() {
  const sortValue = sortExercisesEl.value;
  const [field, order] = sortValue.split('-');
  
  exercises.sort((a, b) => {
    if (order === 'asc') {
      return a[field].localeCompare(b[field]);
    } else {
      return b[field].localeCompare(a[field]);
    }
  });

  filterExercises();
}

// Add an exercise to workout list
function addToWorkout(name) {
  const exists = workoutList.find(ex => ex.name === name);
  
  if (!exists) {
    workoutList.push({ name, sets: 3, reps: 10, weight: '', rest: 60 });
    renderCart();
    clearErrorMessage();
  } else {
    showErrorMessage("Exercise already in workout!");
  }
}

// Display the workout cart with all exercises
function renderCart() {
  workoutCartEl.innerHTML = '';
  workoutList.forEach((item, index) => {
    workoutCartEl.innerHTML += `
      <div class="cart-item">
        <strong>${item.name}</strong>
        <label>Sets: <input type="number" value="${item.sets}" onchange="updateItem(${index}, 'sets', this.value)"></label>
        <label>Reps: <input type="number" value="${item.reps}" onchange="updateItem(${index}, 'reps', this.value)"></label>
        <label>Weight (kg): <input type="number" step="0.5" value="${item.weight}" onchange="updateItem(${index}, 'weight', this.value)"></label>
        <label>Rest (sec): <input type="number" value="${item.rest}" onchange="updateItem(${index}, 'rest', this.value)"></label>
        <button class="btn" onclick="removeItem(${index})">Remove</button>
      </div>
    `;
  });
  
  // Auto-scroll
  if (workoutList.length > 0) {
    const lastCartItem = workoutCartEl.lastElementChild;
    if (lastCartItem) {
      lastCartItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }
}

function updateItem(index, field, value) {
  workoutList[index][field] = parseInt(value);
}

function removeItem(index) {
  workoutList.splice(index, 1);
  renderCart();
}

function showErrorMessage(message) {
  errorMessageEl.textContent = message;
}

function clearErrorMessage() {
  errorMessageEl.textContent = "";
}

// Validation workout
function validateWorkout() {
  const name = workoutNameEl.value.trim();
  
  if (!name) {
    showErrorMessage("Please enter a workout name before starting!");
    return false;
  }
  
  if (workoutList.length === 0) {
    showErrorMessage("Add at least one exercise to start!");
    return false;
  }
  
  return true;
}

// Get User ID
async function getCurrentUserId() {
    try {
        const response = await fetch('/api/auth/current-user');
        if (!response.ok) {
            throw new Error('Not logged in');
        }
        const data = await response.json();
        if (data.success && data.user && data.user.id) {
            return data.user.id;
        } else {
            throw new Error('No user ID found');
        }
    } catch (error) {
        console.error('Error getting user ID:', error);
        window.location.href = '/pages/login.html';
        throw error;
    }
}

async function startWorkout() {
    if (!validateWorkout()) {
        return;
    }
    
    try {
        const userId = await getCurrentUserId();
        
        const workoutData = {
            workoutName: workoutNameEl.value.trim(),
            workoutTag: workoutTagEl.value.trim() || null,
            exercises: workoutList,
            userId: userId
        };
        
        const startButton = document.querySelector('.button-error-container .btn');
        startButton.textContent = 'Saving...';
        startButton.disabled = true;
        
        const response = await saveWorkoutToServer(workoutData);
        
        if (response.success) {
            workoutNameEl.value = '';
            workoutTagEl.value = '';
            workoutList = [];
            renderCart();
            
            showSuccessMessage('Workout saved successfully!');
            
            setTimeout(() => {
                window.location.href = '/pages/user.html';
            }, 1500);
        } else {
            showErrorMessage(response.message || 'Error saving workout');
        }
    } catch (error) {
        console.error('Error:', error);
        showErrorMessage('Error saving workout. Please try again.');
    } finally {
        const startButton = document.querySelector('.button-error-container .btn');
        startButton.textContent = 'Start Workout Now';
        startButton.disabled = false;
    }
}

function saveWorkoutToServer(workoutData) {
    const formattedData = {
        name: workoutData.workoutName,
        tag: workoutData.workoutTag,
        userId: workoutData.userId,
        exercises: workoutData.exercises.map(exercise => ({
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps.toString(),
            weight: exercise.weight ? exercise.weight.toString() : null,
            restTimer: exercise.rest
        }))
    };

    return fetch('/api/workouts/sessions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formattedData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

function showSuccessMessage(message) {
  errorMessageEl.textContent = message;
  errorMessageEl.style.color = '#28a745'; 
}