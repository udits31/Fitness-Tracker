const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get user's streak information
router.get('/streaks/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        const [streaks] = await db.query(
            'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ?',
            [userId]
        );
        
        res.json({
            success: true,
            streak: streaks.length > 0 ? streaks[0] : { current_streak: 0, longest_streak: 0 }
        });
    } catch (error) {
        console.error('Error fetching streak information:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching streak information',
            error: error.message
        });
    }
});

// Get all exercises
router.get('/exercises', async (req, res) => {
    try {
        console.log('Fetching exercises from database...'); 
        
        const [exercises] = await db.query(
            'SELECT exercise_id, exercise_name, equipment, muscle_groups FROM exercises ORDER BY exercise_name'
        );
        
        console.log(`Found ${exercises.length} exercises`);
        
        res.json({
            success: true,
            exercises: exercises
        });
    } catch (error) {
        console.error('Error fetching exercises:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching exercises',
            error: error.message
        });
    }
});

// Save a new workout session
router.post('/sessions', async (req, res) => {
    const { name, tag, exercises, userId } = req.body;
    
    if (!name || !exercises || !userId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        // Insert workout session
        const [result] = await connection.query(
            'INSERT INTO workouts (user_id, name, tag, date_time) VALUES (?, ?, ?, NOW())',
            [userId, name, tag]
        );
        
        const workoutId = result.insertId;

        // Insert exercises
        for (const exercise of exercises) {
            const [exerciseResult] = await connection.query(
                'SELECT exercise_id FROM exercises WHERE exercise_name = ?',
                [exercise.name]
            );

            let exerciseId;
            if (exerciseResult.length === 0) {
                const [newExercise] = await connection.query(
                    'INSERT INTO exercises (exercise_name, muscle_groups, equipment) VALUES (?, ?, ?)',
                    [exercise.name, exercise.muscleGroup || 'Unknown', exercise.equipment || 'Unknown']
                );
                exerciseId = newExercise.insertId;
            } else {
                exerciseId = exerciseResult[0].exercise_id;
            }

            await connection.query(
                'INSERT INTO exercise_history (session_id, exercise_id, sets, reps, weight, rest_timer) VALUES (?, ?, ?, ?, ?, ?)',
                [workoutId, exerciseId, exercise.sets, exercise.reps, exercise.weight, exercise.restTimer]
            );
        }

        await connection.commit();
        res.json({ message: 'Workout saved successfully', workoutId });

    } catch (error) {
        await connection.rollback();
        console.error('Error saving workout:', error);
        res.status(500).json({ error: 'Failed to save workout' });
    } finally {
        connection.release();
    }
});

// Get workout history for a user
router.get('/history/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        const [workouts] = await db.query(`
            SELECT 
                ws.session_id,
                ws.name as workout_name,
                ws.tag,
                ws.date_time,
                GROUP_CONCAT(
                    JSON_OBJECT(
                        'exercise_id', e.exercise_id,
                        'name', e.exercise_name,
                        'muscle_group', e.muscle_groups,
                        'equipment', e.equipment,
                        'sets', eh.sets,
                        'reps', eh.reps,
                        'weight', eh.weight,
                        'rest_timer', eh.rest_timer
                    )
                ) as exercises
            FROM workouts ws
            LEFT JOIN exercise_history eh ON ws.session_id = eh.session_id
            LEFT JOIN exercises e ON eh.exercise_id = e.exercise_id
            WHERE ws.user_id = ?
            GROUP BY ws.session_id
            ORDER BY ws.date_time DESC
        `, [userId]);

        workouts.forEach(workout => {
            if (workout.exercises) {
                workout.exercises = JSON.parse(`[${workout.exercises}]`);
            } else {
                workout.exercises = [];
            }
        });

        res.json({
            success: true,
            workouts: workouts
        });
    } catch (error) {
        console.error('Error fetching workout history:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch workout history' 
        });
    }
});

// Get Personal Records for a specific exercise for a user
router.get('/prs/:userId/:exerciseId', async (req, res) => {
    try {
        const { userId, exerciseId } = req.params;
        
        const [records] = await db.query(
            `SELECT 
                record_id, 
                value, 
                units, 
                date_achieved 
            FROM personal_records 
            WHERE user_id = ? AND exercise_id = ?
            ORDER BY date_achieved DESC`, 
            [userId, exerciseId]
        );
        
        res.json({
            success: true,
            personalRecords: records
        });
    } catch (error) {
        console.error('Error fetching personal records:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching personal records',
            error: error.message
        });
    }
});

module.exports = router; 