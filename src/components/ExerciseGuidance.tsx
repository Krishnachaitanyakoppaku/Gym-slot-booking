import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Exercise {
  name: string;
  details: string;
  videoUrl: string;
}

interface ExerciseData {
  [muscleGroup: string]: Exercise[];
}

const ExerciseGuidance: React.FC = () => {
  const navigate = useNavigate();

  const exerciseData: ExerciseData = {
    'Chest': [
      {
        name: 'Bench Press',
        details: '4 sets x 12-15 reps | Rest: 90 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=SCVCLChPQFY'
      },
      {
        name: 'Incline Dumbbell Press',
        details: '3 sets x 12 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=Fv5EYoJfRt4'
      },
      {
        name: 'Push-Ups',
        details: '3 sets x 15-20 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=WDIpL0pjun0'
      }
    ],
    'Back': [
      {
        name: 'Lat Pull-Downs',
        details: '4 sets x 12 reps | Rest: 90 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=JGeRYIZdojU'
      },
      {
        name: 'Seated Cable Rows',
        details: '3 sets x 12-15 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=SLOtxuaStoQ'
      },
      {
        name: 'Deadlifts',
        details: '4 sets x 8-10 reps | Rest: 120 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=AweC3UaM14o'
      }
    ],
    'Biceps': [
      {
        name: 'Barbell Curls',
        details: '3 sets x 12 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=ZQWL7omZh94'
      },
      {
        name: 'Hammer Curls',
        details: '3 sets x 12 reps each arm | Rest: 45 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=CFBZ4jN1CMI'
      },
      {
        name: 'Preacher Curls',
        details: '3 sets x 12-15 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=sxA__DoLsgo'
      }
    ],
    'Triceps': [
      {
        name: 'Tricep Pushdowns',
        details: '4 sets x 12-15 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=JDEDaZTEzGE'
      },
      {
        name: 'Skull Crushers',
        details: '3 sets x 12 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=l3rHYPtMUo8'
      },
      {
        name: 'Diamond Push-Ups',
        details: '3 sets x 12-15 reps | Rest: 45 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=XtU2VQVuLYs'
      }
    ],
    'Legs': [
      {
        name: 'Squats',
        details: '4 sets x 12 reps | Rest: 90 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=YaXPRqUwItQ'
      },
      {
        name: 'Leg Press',
        details: '4 sets x 12-15 reps | Rest: 90 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=b0CvIhY8xVg'
      },
      {
        name: 'Calf Raises',
        details: '3 sets x 20 reps | Rest: 45 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=H1b_tKeq3Us'
      }
    ],
    'Shoulders': [
      {
        name: 'Military Press',
        details: '4 sets x 10-12 reps | Rest: 90 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=0rChzYPyuYI'
      },
      {
        name: 'Lateral Raises',
        details: '3 sets x 12-15 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=OuG1smZTsQQ'
      },
      {
        name: 'Front Raises',
        details: '3 sets x 12 reps | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=hRJ6tR5-if0'
      }
    ],
    'Abs': [
      {
        name: 'Crunches',
        details: '3 sets x 15-20 reps | Rest: 45 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=O0pIQ2UqeCY'
      },
      {
        name: 'Plank',
        details: '3 sets x 30-60 seconds | Rest: 60 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=pvIjsG5Svck'
      },
      {
        name: 'Russian Twists',
        details: '3 sets x 20 reps | Rest: 45 seconds between sets',
        videoUrl: 'https://www.youtube.com/watch?v=Tau0hsW8iR0'
      }
    ]
  };

  const openVideo = (url: string): void => {
    window.open(url, '_blank');
  };

  return (
    <div className="exercise-background">
      <div className="container">
        <div className="page-header">
          <button className="back-button" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
          <h1>Exercise Guidance</h1>
          <p>Proper form and technique guide for different muscle groups</p>
        </div>

        {Object.entries(exerciseData).map(([muscleGroup, exercises]) => (
          <div key={muscleGroup} className="exercise-section">
            <h2>{muscleGroup}</h2>
            <ul className="exercise-list">
              {exercises.map((exercise, index) => (
                <li key={index} className="exercise-item">
                  <div className="exercise-info">
                    <div className="exercise-name">{exercise.name}</div>
                    <div className="exercise-details">{exercise.details}</div>
                  </div>
                  <button 
                    className="video-btn" 
                    onClick={() => openVideo(exercise.videoUrl)}
                  >
                    Watch Tutorial
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExerciseGuidance;