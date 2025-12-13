<?php

namespace App\Console\Commands;

use App\Models\Issue;
use Illuminate\Console\Command;

class SyncIssueCommentsCount extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'issues:sync-comments-count';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync comments_count for all issues with actual comment counts';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Syncing comments count for all issues...');
        
        $issues = Issue::all();
        $total = $issues->count();
        $synced = 0;
        $fixed = 0;
        
        $bar = $this->output->createProgressBar($total);
        $bar->start();
        
        foreach ($issues as $issue) {
            $actualCount = $issue->comments()->count();
            $storedCount = $issue->comments_count;
            
            if ($actualCount != $storedCount) {
                $issue->update(['comments_count' => $actualCount]);
                $fixed++;
                $this->line("\nIssue #{$issue->id}: Fixed count from {$storedCount} to {$actualCount}");
            }
            
            $synced++;
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Sync complete!");
        $this->info("Total issues: {$total}");
        $this->info("Issues synced: {$synced}");
        $this->info("Issues fixed: {$fixed}");
        
        return Command::SUCCESS;
    }
}
