#!/usr/bin/env python3
"""
Script to import issues from N8N agent JSON output into the Issues API
Usage: python import_issues_from_n8n.py <json_file> <api_token>
"""

import json
import sys
import requests
import time
from typing import Dict, List, Any

# API Configuration
API_BASE_URL = "https://naqashthaheem.com/api"
HEADERS = {
    "Content-Type": "application/json"
}

# Category name to ID mapping (you'll need to fetch this from API)
CATEGORY_MAP = {
    "Technical Support": None,  # Will be fetched from API
    "Programming Help": None,
    "System Administration": None,
    "Database Questions": None,
    "Networking & Security": None,
    "DevOps & CI/CD": None,
    "Frontend Development": None,
    "General IT Discussion": None,
    "Other": None,
}


def fetch_categories(api_token: str) -> Dict[str, int]:
    """Fetch issue categories from API and create name-to-ID mapping"""
    headers = {**HEADERS, "Authorization": f"Bearer {api_token}"}
    response = requests.get(f"{API_BASE_URL}/issue-categories", headers=headers)
    
    if response.status_code != 200:
        print(f"Error fetching categories: {response.status_code}")
        print(response.text)
        return {}
    
    categories = response.json().get("data", [])
    category_map = {}
    
    for cat in categories:
        category_map[cat["name"]] = cat["id"]
    
    print(f"Fetched {len(category_map)} categories:")
    for name, cat_id in category_map.items():
        print(f"  - {name}: {cat_id}")
    
    return category_map


def create_issue(api_token: str, issue_data: Dict[str, Any], category_map: Dict[str, int]) -> Dict[str, Any]:
    """Create an issue via API"""
    headers = {**HEADERS, "Authorization": f"Bearer {api_token}"}
    
    # API now supports category_name directly, so we can use it as-is
    # Remove category_id if category_name is provided (API will handle the lookup)
    if "category_name" in issue_data and issue_data["category_name"]:
        issue_data.pop("category_id", None)  # Remove category_id if category_name exists
    elif "category_id" not in issue_data:
        # If neither is provided, check if we can map from category_name
        category_name = issue_data.get("category_name")
        if category_name and category_name in category_map:
            issue_data["category_id"] = category_map[category_name]
            issue_data.pop("category_name", None)
        else:
            issue_data["category_id"] = None
    
    # Ensure status is set
    issue_data["status"] = "resolved"
    
    response = requests.post(
        f"{API_BASE_URL}/issues",
        headers=headers,
        json=issue_data
    )
    
    if response.status_code == 201:
        return response.json().get("data")
    else:
        print(f"Error creating issue '{issue_data.get('title')}': {response.status_code}")
        print(response.text)
        return None


def add_resolution(api_token: str, issue_id: int, resolution_notes: str) -> bool:
    """Add resolution to an issue (admin only)"""
    headers = {**HEADERS, "Authorization": f"Bearer {api_token}"}
    
    response = requests.post(
        f"{API_BASE_URL}/issues/{issue_id}/status",
        headers=headers,
        json={
            "status": "resolved",
            "resolution_notes": resolution_notes
        }
    )
    
    if response.status_code == 200:
        return True
    else:
        print(f"Error adding resolution to issue {issue_id}: {response.status_code}")
        print(response.text)
        return False


def add_comment(api_token: str, issue_id: int, content: str) -> bool:
    """Add a comment to an issue"""
    headers = {**HEADERS, "Authorization": f"Bearer {api_token}"}
    
    response = requests.post(
        f"{API_BASE_URL}/comments",
        headers=headers,
        json={
            "commentable_type": "Issue",
            "commentable_id": issue_id,
            "content": content
        }
    )
    
    if response.status_code == 201:
        return True
    else:
        print(f"Error adding comment to issue {issue_id}: {response.status_code}")
        print(response.text)
        return False


def import_issues(json_file: str, api_token: str):
    """Main function to import issues from JSON file"""
    # Load JSON file
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{json_file}' not found")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in file '{json_file}': {e}")
        sys.exit(1)
    
    issues_data = data.get("issues", [])
    if not issues_data:
        print("Error: No 'issues' array found in JSON")
        sys.exit(1)
    
    print(f"Found {len(issues_data)} issues to import\n")
    
    # Fetch categories
    print("Fetching categories...")
    category_map = fetch_categories(api_token)
    if not category_map:
        print("Error: Could not fetch categories. Exiting.")
        sys.exit(1)
    
    print("\nStarting import...\n")
    
    # Import each issue
    success_count = 0
    failed_count = 0
    
    for idx, item in enumerate(issues_data, 1):
        issue_data = item.get("issue", {})
        resolution_data = item.get("resolution", {})
        comments_data = item.get("comments", [])
        
        if not issue_data:
            print(f"Issue {idx}: Skipping - no issue data")
            failed_count += 1
            continue
        
        title = issue_data.get("title", "Untitled Issue")
        print(f"Issue {idx}/{len(issues_data)}: {title}")
        
        # Create issue
        created_issue = create_issue(api_token, issue_data.copy(), category_map)
        
        if not created_issue:
            print(f"  ❌ Failed to create issue\n")
            failed_count += 1
            continue
        
        issue_id = created_issue.get("id")
        print(f"  ✅ Issue created (ID: {issue_id})")
        
        # Add resolution
        resolution_notes = resolution_data.get("resolution_notes")
        if resolution_notes:
            if add_resolution(api_token, issue_id, resolution_notes):
                print(f"  ✅ Resolution added")
            else:
                print(f"  ⚠️  Failed to add resolution")
        
        # Add comments
        if comments_data:
            comment_count = 0
            for comment in comments_data:
                content = comment.get("content")
                if content:
                    if add_comment(api_token, issue_id, content):
                        comment_count += 1
                    time.sleep(0.5)  # Rate limiting
        
            if comment_count > 0:
                print(f"  ✅ {comment_count} comment(s) added")
        
        success_count += 1
        print()
        
        # Rate limiting
        time.sleep(1)
    
    print(f"\n{'='*50}")
    print(f"Import complete!")
    print(f"  ✅ Success: {success_count}")
    print(f"  ❌ Failed: {failed_count}")
    print(f"{'='*50}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python import_issues_from_n8n.py <json_file> <api_token>")
        print("\nExample:")
        print("  python import_issues_from_n8n.py issues.json your_api_token_here")
        sys.exit(1)
    
    json_file = sys.argv[1]
    api_token = sys.argv[2]
    
    import_issues(json_file, api_token)

