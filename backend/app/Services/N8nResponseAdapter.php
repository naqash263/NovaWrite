<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class N8nResponseAdapter
{
    /**
     * Adapt N8N response to match Gemini API format
     */
    public function adapt($n8nResponse, string $toolType): array
    {
        // If response is already in correct format, return as-is
        if (is_array($n8nResponse) && isset($n8nResponse['data'])) {
            $data = $n8nResponse['data'];
            
            // Validate and return
            return $this->validateAndFormat($data, $toolType);
        }
        
        // If response is direct data (no wrapper)
        if (is_array($n8nResponse)) {
            return $this->validateAndFormat($n8nResponse, $toolType);
        }
        
        // If response is string, try to parse as JSON
        if (is_string($n8nResponse)) {
            $parsed = json_decode($n8nResponse, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $this->validateAndFormat($parsed, $toolType);
            }
            
            // Try to extract JSON from text
            if (preg_match('/\{.*\}/s', $n8nResponse, $matches)) {
                $extracted = json_decode($matches[0], true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    return $this->validateAndFormat($extracted, $toolType);
                }
            }
        }
        
        Log::warning('Failed to adapt N8N response', [
            'tool_type' => $toolType,
            'response_type' => gettype($n8nResponse)
        ]);
        
        return [];
    }

    /**
     * Validate and format response based on tool type
     */
    private function validateAndFormat(array $data, string $toolType): array
    {
        switch ($toolType) {
            case 'cv_extract':
                return $this->formatCvExtractResponse($data);
            
            case 'cv_tailor':
                return $this->formatCvTailorResponse($data);
            
            case 'cover_letter':
            case 'interview_prep':
            case 'salary_negotiation':
            case 'skills_assessment':
            case 'career_path':
            case 'job_search':
            case 'linkedin_analysis':
                // These should already be in correct format
                return $data;
            
            case 'grammar_check':
                return $this->formatGrammarCheckResponse($data);
            
            case 'text_summarize':
                return $this->formatTextSummarizeResponse($data);
            
            case 'article_rewrite':
                return $this->formatArticleRewriteResponse($data);
            
            case 'language_translate':
                return $this->formatLanguageTranslateResponse($data);
            
            default:
                return $data;
        }
    }

    /**
     * Format CV extract response
     */
    private function formatCvExtractResponse(array $data): array
    {
        // Ensure all required fields exist
        return array_merge([
            'fullName' => '',
            'jobTitle' => '',
            'email' => '',
            'phoneNumber' => '',
            'address' => '',
            'professionalSummary' => '',
            'workExperience' => [],
            'education' => [],
            'skills' => '',
            'projects' => [],
            'certificates' => [],
            'languages' => [],
            'achievements' => [],
            'references' => []
        ], $data);
    }

    /**
     * Format CV tailor response
     */
    private function formatCvTailorResponse(array $data): array
    {
        // Same structure as CV extract
        return $this->formatCvExtractResponse($data);
    }

    /**
     * Format grammar check response
     */
    private function formatGrammarCheckResponse(array $data): array
    {
        return array_merge([
            'corrected_text' => '',
            'suggestions' => [],
            'errors' => [],
            'score' => 0
        ], $data);
    }

    /**
     * Format text summarize response
     */
    private function formatTextSummarizeResponse(array $data): array
    {
        // If it's just a string, wrap it
        if (is_string($data)) {
            return ['summary' => $data];
        }
        
        return array_merge([
            'summary' => '',
            'length' => 0,
            'original_length' => 0
        ], $data);
    }

    /**
     * Format article rewrite response
     */
    private function formatArticleRewriteResponse(array $data): array
    {
        // If it's just a string, wrap it
        if (is_string($data)) {
            return ['rewritten_text' => $data];
        }
        
        return array_merge([
            'rewritten_text' => '',
            'original_text' => '',
            'changes_made' => []
        ], $data);
    }

    /**
     * Format language translate response
     */
    private function formatLanguageTranslateResponse(array $data): array
    {
        // If it's just a string, wrap it
        if (is_string($data)) {
            return ['translated_text' => $data];
        }
        
        return array_merge([
            'translated_text' => '',
            'source_language' => '',
            'target_language' => '',
            'confidence' => 0
        ], $data);
    }
}
