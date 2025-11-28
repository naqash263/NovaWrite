#!/bin/bash

echo "🧪 Testing AI Tools API Endpoints"
echo "=================================="
echo ""

API_URL="http://localhost:8001/api"

# Test 1: Text Summarizer
echo "1️⃣ Testing Text Summarizer..."
curl -X POST "$API_URL/ai-tools/text-summarizer/summarize" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Artificial intelligence is transforming the way we work and live. Machine learning algorithms can now process vast amounts of data to identify patterns and make predictions. This technology is being used in healthcare, finance, education, and many other industries. As AI continues to evolve, it will create new opportunities and challenges for society.",
    "length": "short",
    "focus": "general"
  }' | jq -r '.success, .data.summary' 2>/dev/null || echo "❌ Text Summarizer test failed"
echo ""

# Test 2: Article Rewriter
echo "2️⃣ Testing Article Rewriter..."
curl -X POST "$API_URL/ai-tools/article-rewriter/rewrite" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "The quick brown fox jumps over the lazy dog. This is a test sentence for rewriting.",
    "style": "formal",
    "tone": "neutral",
    "preserve_meaning": true
  }' | jq -r '.success, .data.rewritten_text' 2>/dev/null || echo "❌ Article Rewriter test failed"
echo ""

# Test 3: Grammar Checker
echo "3️⃣ Testing Grammar Checker..."
curl -X POST "$API_URL/ai-tools/grammar-checker/check" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test sentance with some erors. It need to be check for grammer and speling mistakes.",
    "check_spelling": true,
    "check_grammar": true,
    "check_style": true,
    "suggest_improvements": true
  }' | jq -r '.success, .data.corrected_text' 2>/dev/null || echo "❌ Grammar Checker test failed"
echo ""

# Test 4: Language Translator
echo "4️⃣ Testing Language Translator..."
curl -X POST "$API_URL/ai-tools/language-translator/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, how are you today?",
    "source_language": "English",
    "target_language": "Spanish",
    "preserve_formatting": true
  }' | jq -r '.success, .data.translated_text' 2>/dev/null || echo "❌ Language Translator test failed"
echo ""

echo "✅ Testing complete!"
