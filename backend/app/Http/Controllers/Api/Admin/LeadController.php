<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use App\Models\WorkflowDownload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Admin inbox for enquiries (contact form + consultation bookings, both stored in
 * contacts) and for the marketing opt-ins collected by workflow downloads.
 */
class LeadController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Contact::query()->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('is_read', $request->status === 'read');
        }
        if ($request->filled('inquiry_type')) {
            $query->where('inquiry_type', $request->inquiry_type);
        }
        if ($request->filled('search')) {
            $term = '%' . mb_strtolower($request->search) . '%';
            $query->where(function ($q) use ($term) {
                $q->whereRaw('LOWER(name) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(company) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(subject) LIKE ?', [$term]);
            });
        }

        $perPage = min(max((int) $request->input('per_page', 25), 1), 100);

        return response()->json($query->paginate($perPage));
    }

    public function stats(): JsonResponse
    {
        $hasSource = Schema::hasColumn('contacts', 'source');

        return response()->json([
            'total' => Contact::count(),
            'unread' => Contact::where('is_read', false)->count(),
            'last_30_days' => Contact::where('created_at', '>=', now()->subDays(30))->count(),
            'by_type' => Contact::select('inquiry_type', DB::raw('COUNT(*) as total'))
                ->groupBy('inquiry_type')->pluck('total', 'inquiry_type'),
            'top_sources' => $hasSource
                ? Contact::whereNotNull('source')->select('source', DB::raw('COUNT(*) as total'))
                    ->groupBy('source')->orderByDesc('total')->limit(10)->get()
                : [],
            'subscribers' => Schema::hasTable('workflow_downloads')
                ? WorkflowDownload::where('marketing_opt_in', true)->whereNotNull('email')->where('email', '<>', '')->distinct()->count('email')
                : 0,
        ]);
    }

    public function show(int $id): JsonResponse
    {
        $contact = Contact::with('file')->findOrFail($id);
        if (!$contact->is_read) {
            $contact->update(['is_read' => true, 'read_at' => now()]);
        }

        return response()->json($contact);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $data = $request->validate(['is_read' => 'required|boolean']);
        $contact = Contact::findOrFail($id);
        $contact->update(['is_read' => $data['is_read'], 'read_at' => $data['is_read'] ? now() : null]);

        return response()->json($contact);
    }

    public function destroy(int $id): JsonResponse
    {
        Contact::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }

    /** People who ticked "send me updates" when downloading a workflow (latest opt-in per email). */
    public function subscribers(Request $request): JsonResponse
    {
        if (!Schema::hasTable('workflow_downloads')) {
            return response()->json(['data' => [], 'total' => 0]);
        }

        $rows = WorkflowDownload::query()
            ->where('marketing_opt_in', true)
            ->whereNotNull('email')->where('email', '<>', '')
            ->select('email', DB::raw('MAX(created_at) as last_opt_in'), DB::raw('COUNT(*) as downloads'))
            ->groupBy('email')
            ->orderByDesc('last_opt_in')
            ->paginate(min(max((int) $request->input('per_page', 50), 1), 200));

        return response()->json($rows);
    }
}
