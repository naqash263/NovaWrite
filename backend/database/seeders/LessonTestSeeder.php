<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Lesson;
use App\Models\LessonTest;

class LessonTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first lesson (Test Course)
        $lesson = Lesson::where('title', 'Test Course')->first();
        
        if ($lesson) {
            LessonTest::create([
                'lesson_id' => $lesson->id,
                'title' => 'Test Course Quiz',
                'description' => 'Test your understanding of the Test Course lesson',
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'What is the main topic of this lesson?',
                        'options' => [
                            'A' => 'React Development',
                            'B' => 'Test Course Content',
                            'C' => 'Node.js Programming',
                            'D' => 'Database Design'
                        ],
                        'correct_answer' => 'B'
                    ],
                    [
                        'id' => 2,
                        'question' => 'How long does this lesson take?',
                        'options' => [
                            'A' => '5 minutes',
                            'B' => '10 minutes',
                            'C' => '15 minutes',
                            'D' => '20 minutes'
                        ],
                        'correct_answer' => 'B'
                    ],
                    [
                        'id' => 3,
                        'question' => 'What should you do after completing this lesson?',
                        'options' => [
                            'A' => 'Skip to the next course',
                            'B' => 'Take the quiz to unlock the next lesson',
                            'C' => 'Review the content again',
                            'D' => 'Contact the instructor'
                        ],
                        'correct_answer' => 'B'
                    ]
                ],
                'passing_score' => 70,
                'time_limit_minutes' => 10,
                'is_active' => true,
                'order' => 1,
            ]);
        }

        // Get the second lesson (Paid One)
        $lesson2 = Lesson::where('title', 'Paid One')->first();
        
        if ($lesson2) {
            LessonTest::create([
                'lesson_id' => $lesson2->id,
                'title' => 'Paid One Quiz',
                'description' => 'Test your understanding of the Paid One lesson',
                'questions' => [
                    [
                        'id' => 1,
                        'question' => 'What type of content is in Paid One?',
                        'options' => [
                            'A' => 'Free content',
                            'B' => 'Paid content',
                            'C' => 'Premium content',
                            'D' => 'Basic content'
                        ],
                        'correct_answer' => 'B'
                    ],
                    [
                        'id' => 2,
                        'question' => 'How long does Paid One take?',
                        'options' => [
                            'A' => '5 minutes',
                            'B' => '10 minutes',
                            'C' => '15 minutes',
                            'D' => '30 minutes'
                        ],
                        'correct_answer' => 'B'
                    ]
                ],
                'passing_score' => 60,
                'time_limit_minutes' => 5,
                'is_active' => true,
                'order' => 1,
            ]);
        }
    }
}