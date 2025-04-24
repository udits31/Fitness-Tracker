document.addEventListener('DOMContentLoaded', function() {
    console.log('User profile page loaded');
    
    // Get current user
    fetch('/api/auth/current-user')
        .then(response => {
            console.log('Current user response:', response.status);
            if (!response.ok) {
                throw new Error('Not logged in');
            }
            return response.json();
        })
        .then(data => {
            console.log('Current user data:', data);
            if (data.success && data.user) {
                const userId = data.user.id;
                
                // Update name and email
                document.querySelector('.profile-info h2').textContent = data.user.name;
                document.querySelector('.profile-info .email').textContent = data.user.email;
                               
                // Fetch streak information
                fetch(`/api/workouts/streaks/${userId}`)
                    .then(response => response.json())
                    .then(streakData => {
                        if (streakData.success) {
                            const streakEl = document.querySelector('.streak-stat');
                            streakEl.innerHTML = `
                                <i class="fas fa-fire"></i>
                                <div class="streak-info">
                                    <span class="current-streak">${streakData.streak.current_streak} Day Streak</span>
                                    <span class="longest-streak">Best: ${streakData.streak.longest_streak} Days</span>
                                </div>
                            `;
                        }
                    })
                    .catch(error => {
                        console.error('Error fetching streak:', error);
                        document.querySelector('.streak-stat').innerHTML = `
                            <i class="fas fa-fire"></i>
                            <span>Error loading streak</span>
                        `;
                    });
                
                // Fetch workout history
                return fetch(`/api/workouts/history/${userId}`);
            } else {
                throw new Error('No user session found');
            }
        })
        .then(response => response.json())
        .then(data => {
            console.log('Workout history:', data);
            const workoutHistoryEl = document.querySelector('.workout-history');
            
            if (data.success && data.workouts && data.workouts.length > 0) {
                // Update workout count
                document.querySelector('.workout-count').textContent = `${data.workouts.length} Workouts`;
                
                workoutHistoryEl.innerHTML = '';
                
                // Display workouts
                data.workouts.forEach(workout => {
                    const workoutDate = new Date(workout.date_time);
                    const formattedDate = workoutDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    
                    // Create workout item HTML
                    const workoutItemHTML = `
                        <div class="workout-item">
                            <div class="workout-info">
                                <h3>${workout.workout_name}</h3>
                                <span class="workout-date">${formattedDate}</span>
                                <div class="workout-details">
                                    ${workout.tag ? `<span class="badge ${workout.tag.toLowerCase()}">${workout.tag}</span>` : ''}
                                    ${workout.exercises ? `
                                        <div class="exercise-list">
                                            ${workout.exercises.map(exercise => `
                                                <div class="exercise-item">
                                                    <span class="exercise-name">${exercise.name}</span>
                                                    <span class="exercise-stats">
                                                        ${exercise.sets} sets × ${exercise.reps} reps
                                                        ${exercise.weight ? ` @ ${exercise.weight}kg` : ''}
                                                    </span>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                        </div>
                    `;
                    
                    workoutHistoryEl.innerHTML += workoutItemHTML;
                });
            } else {
                // No workouts found
                workoutHistoryEl.innerHTML = `
                    <div class="no-workouts">
                        <h3>No workouts yet</h3>
                        <p>Start your fitness journey by creating your first workout!</p>
                        <a href="workouts.html" class="create-workout-btn">Create Workout</a>
                    </div>
                `;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('.workout-history').innerHTML = `
                <div class="error-message">
                    <p>Error loading workout history. Please try again later.</p>
                </div>
            `;
        });
});

// Logout
document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include' 
        });

        if (response.ok) {
            window.location.href = '/login.html';
        } else {
            console.error('Logout failed');
        }
    } catch (error) {
        console.error('Error during logout:', error);
    }
}); 