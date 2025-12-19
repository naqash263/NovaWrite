# N8N Agent Prompt (Concise Version)

## Task
Search for viral/popular IT issues from Stack Overflow, GitHub, Reddit, Dev.to with high engagement (upvotes, comments, views) that have clear resolutions. Extract issue details and format as JSON.

## Output Format (JSON Array)

```json
{
  "issues": [
    {
      "issue": {
        "title": "Clear issue title (5-255 chars)",
        "description": "Detailed problem description (10-10000 chars). Include: problem, error messages, what was tried, environment",
        "category_name": "Technical Support|Programming Help|System Administration|Database Questions|Networking & Security|DevOps & CI/CD|Frontend Development|General IT Discussion|Other",
        "priority": "low|medium|high|critical",
        "labels": ["tag1", "tag2", "max 50 chars each"],
        "status": "resolved"
      },
      "resolution": {
        "resolution_notes": "Step-by-step solution (max 2000 chars). Include root cause, solution steps, code/config examples"
      },
      "comments": [
        {
          "content": "Helpful comment (3-5000 chars)",
          "is_solution": false
        }
      ]
    }
  ]
}
```

## Requirements
- 5-10 high-quality issues per search
- All issues must have verified solutions
- Include 2-3 helpful comments per issue
- Category must match exactly from the list above
- Priority: critical (crashes/security), high (blocking bugs), medium (common issues), low (optimization)
- Labels: technology, problem type, platform (max 50 chars each)

## Example

```json
{
  "issues": [
    {
      "issue": {
        "title": "PostgreSQL connection refused error in Laravel",
        "description": "Getting 'Connection refused' when connecting Laravel to PostgreSQL. Error: SQLSTATE[08006] [7] could not connect to server. Checked: service running, credentials correct, firewall. Environment: Laravel 10, PostgreSQL 14, Ubuntu 22.04",
        "category_name": "Database Questions",
        "priority": "high",
        "labels": ["postgresql", "laravel", "database-connection"],
        "status": "resolved"
      },
      "resolution": {
        "resolution_notes": "PostgreSQL wasn't accepting external connections. Solution: 1) Set listen_addresses = '*' in postgresql.conf, 2) Add 'host all all 0.0.0.0/0 md5' to pg_hba.conf, 3) Restart PostgreSQL service, 4) Verify connection. Root cause: PostgreSQL only listening on localhost."
      },
      "comments": [
        {
          "content": "Also check firewall: sudo ufw status",
          "is_solution": false
        },
        {
          "content": "For Docker, ensure port is exposed: -p 5432:5432",
          "is_solution": false
        }
      ]
    }
  ]
}
```



