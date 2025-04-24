document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchExercise');
    const muscleFilter = document.getElementById('filterMuscle');
    const equipmentFilter = document.getElementById('filterEquipment');
    const exerciseGrid = document.getElementById('exerciseGrid');
    
    let exercises = [];
    let muscleGroups = new Set();
    let equipmentTypes = new Set();

    // Fetch exercises from the server
    fetch('/api/workouts/exercises')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                exercises = data.exercises;
                
                exercises.forEach(exercise => {
                    if (exercise.muscle_groups) {
                        muscleGroups.add(exercise.muscle_groups);
                    }
                    if (exercise.equipment) {
                        equipmentTypes.add(exercise.equipment);
                    }
                });

                populateFilterDropdowns();
                renderExercises(exercises);
            }
        })
        .catch(error => {
            console.error('Error fetching exercises:', error);
            exerciseGrid.innerHTML = `
                <div class="error-message">
                    <p>Error loading exercises. Please try again later.</p>
                </div>
            `;
        });

    // Populate filter dropdowns
    function populateFilterDropdowns() {
        muscleGroups.forEach(muscle => {
            const option = document.createElement('option');
            option.value = muscle;
            option.textContent = muscle;
            muscleFilter.appendChild(option);
        });

        equipmentTypes.forEach(equipment => {
            const option = document.createElement('option');
            option.value = equipment;
            option.textContent = equipment;
            equipmentFilter.appendChild(option);
        });
    }

    // Get image path for exercise
    function getExerciseImagePath(exerciseName) {
        if (exerciseName.toLowerCase().includes('2k run')) {
            return '/images/running.webp';
        }
        if (exerciseName.toLowerCase().includes('30 min yoga')) {
            return '/images/yoga.webp';
        }
        if (exerciseName.toLowerCase().includes('bicep curl')) {
            return '/images/bicep-curl.webp';
        }
        if (exerciseName.toLowerCase().includes('dips')) {
            return '/images/dips.webp';
        }
        if (exerciseName.toLowerCase().includes('jumping')) {
            return '/images/jumping-jack.webp';
        }
        if (exerciseName.toLowerCase().includes('pull ups')) {
            return '/images/pull-up.webp';
        }
        if (exerciseName.toLowerCase().includes('push ups')) {
            return '/images/push-up.webp';
        }

        const imageName = exerciseName.toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with hyphens
            .replace(/\(/g, '')             // Remove opening parentheses
            .replace(/\)/g, '')             // Remove closing parentheses
            .replace(/'/g, '')              // Remove apostrophes
            .trim();                        // Remove any whitespaces

        const imagePath = `/images/${imageName}.webp`;
        console.log(`Converting "${exerciseName}" to image path: ${imagePath}`);
        return imagePath;
    }

    // Check if image exists
    function imageExists(imagePath) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                console.log('Image loaded successfully:', imagePath);
                resolve(true);
            };
            img.onerror = () => {
                console.error('Image failed to load:', imagePath);
                console.log('Available image names:', [
                    'bench-press', 'bicep-curl', 'cable-high-pulley-overhead-tricep-extension',
                    'deadlift', 'dips', 'lat-pulldown', 'leg-curl', 'leg-press', 'plank',
                    'pull-up', 'push-up', 'romanian-deadlift', 'shoulder-press', 'squats',
                    '2k-run', '30-min-yoga'
                ].join(', '));
                resolve(false);
            };
            img.src = imagePath;
        });
    }

    // Render exercises based on filters
    async function renderExercises(exercisesToRender) {
        exerciseGrid.innerHTML = '';
        console.log('Rendering exercises:', exercisesToRender.map(e => e.exercise_name).join(', '));
        
        for (const exercise of exercisesToRender) {
            const card = document.createElement('div');
            card.className = 'exercise-card';
            
            const imagePath = getExerciseImagePath(exercise.exercise_name);
            console.log(`🔍 Attempting to load image for "${exercise.exercise_name}":`, imagePath);
            const hasImage = await imageExists(imagePath);
            
            card.innerHTML = `
                ${hasImage ? 
                    `<img src="${imagePath}" alt="${exercise.exercise_name}" class="exercise-image" 
                     onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\'exercise-image no-image\'><i class=\'fas fa-dumbbell\'></i></div>'">` :
                    `<div class="exercise-image no-image">
                        <i class="fas fa-dumbbell"></i>
                        <div class="no-image-text">No image available</div>
                    </div>`
                }
                <div class="exercise-name">${exercise.exercise_name}</div>
                <div class="exercise-tags">
                    ${exercise.muscle_groups ? 
                        `<span class="tag muscle">${exercise.muscle_groups}</span>` : ''}
                    ${exercise.equipment ? 
                        `<span class="tag equipment">${exercise.equipment}</span>` : ''}
                </div>
                <div class="exercise-actions">
                    <button class="info-button" onclick="showExerciseInfo('${exercise.exercise_name}')">
                        <i class="fas fa-info-circle"></i>
                        More Info
                    </button>
                </div>
            `;
            exerciseGrid.appendChild(card);
        }

        if (exercisesToRender.length === 0) {
            exerciseGrid.innerHTML = `
                <div class="no-results">
                    <p>No exercises found matching your criteria.</p>
                </div>
            `;
        }
    }

    // Filter exercises based on search and filters
    function filterExercises() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedMuscle = muscleFilter.value;
        const selectedEquipment = equipmentFilter.value;

        const filteredExercises = exercises.filter(exercise => {
            const matchesSearch = exercise.exercise_name.toLowerCase().includes(searchTerm);
            const matchesMuscle = !selectedMuscle || exercise.muscle_groups === selectedMuscle;
            const matchesEquipment = !selectedEquipment || exercise.equipment === selectedEquipment;
            return matchesSearch && matchesMuscle && matchesEquipment;
        });

        renderExercises(filteredExercises);
    }

    searchInput.addEventListener('input', filterExercises);
    muscleFilter.addEventListener('change', filterExercises);
    equipmentFilter.addEventListener('change', filterExercises);
});

// Function to show exercise information
function showExerciseInfo(exerciseName) {
    const pageName = exerciseName.toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with hyphens
        .replace(/\(/g, '')             // Remove opening parentheses
        .replace(/\)/g, '')             // Remove closing parentheses
        .replace(/'/g, '')               // Remove apostrophes
        .trim();                         // Remove any whitespaces

    window.location.href = `/pages/${pageName}.html`;
} 