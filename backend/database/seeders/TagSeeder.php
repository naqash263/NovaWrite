<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tag;

class TagSeeder extends Seeder
{
    public function run(): void
    {
        $tags = [
            ['name' => 'AI', 'color' => '#3B82F6', 'description' => 'Artificial Intelligence'],
            ['name' => 'Automation', 'color' => '#10B981', 'description' => 'Process Automation'],
            ['name' => 'Technology', 'color' => '#8B5CF6', 'description' => 'General Technology'],
            ['name' => 'Programming', 'color' => '#F59E0B', 'description' => 'Programming and Development'],
            ['name' => 'Machine Learning', 'color' => '#EF4444', 'description' => 'Machine Learning'],
            ['name' => 'Data Science', 'color' => '#06B6D4', 'description' => 'Data Science and Analytics'],
            ['name' => 'Web Development', 'color' => '#84CC16', 'description' => 'Web Development'],
            ['name' => 'Mobile', 'color' => '#F97316', 'description' => 'Mobile Development'],
            ['name' => 'Cloud', 'color' => '#6366F1', 'description' => 'Cloud Computing'],
            ['name' => 'Security', 'color' => '#DC2626', 'description' => 'Cybersecurity'],
        ];

        foreach ($tags as $tagData) {
            Tag::create([
                'name' => $tagData['name'],
                'slug' => \Illuminate\Support\Str::slug($tagData['name']),
                'color' => $tagData['color'],
                'description' => $tagData['description'],
            ]);
        }
    }
}