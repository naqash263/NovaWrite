#!/usr/bin/env node
/**
 * Script to import issues from N8N agent JSON output into the Issues API
 * Usage: node import_issues_from_n8n.js <json_file> <api_token>
 */

const fs = require('fs');
const https = require('https');

const API_BASE_URL = 'https://naqashthaheem.com/api';

// Helper function to make HTTP requests
function makeRequest(method, url, headers, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: headers,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Fetch issue categories from API
async function fetchCategories(apiToken) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };

  const response = await makeRequest('GET', `${API_BASE_URL}/issue-categories`, headers);
  
  if (response.status !== 200) {
    console.error(`Error fetching categories: ${response.status}`);
    console.error(response.data);
    return {};
  }

  const categories = response.data.data || [];
  const categoryMap = {};

  categories.forEach((cat) => {
    categoryMap[cat.name] = cat.id;
  });

  console.log(`Fetched ${Object.keys(categoryMap).length} categories:`);
  Object.entries(categoryMap).forEach(([name, id]) => {
    console.log(`  - ${name}: ${id}`);
  });

  return categoryMap;
}

// Create an issue via API
async function createIssue(apiToken, issueData, categoryMap) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };

  // API now supports category_name directly, so we can use it as-is
  // Remove category_id if category_name is provided (API will handle the lookup)
  if (issueData.category_name) {
    delete issueData.category_id; // Remove category_id if category_name exists
  } else if (!issueData.category_id) {
    // If neither is provided, check if we can map from category_name
    const categoryName = issueData.category_name;
    if (categoryName && categoryMap[categoryName]) {
      issueData.category_id = categoryMap[categoryName];
      delete issueData.category_name;
    } else {
      issueData.category_id = null;
    }
  }

  // Ensure status is set
  issueData.status = 'resolved';

  const response = await makeRequest('POST', `${API_BASE_URL}/issues`, headers, issueData);

  if (response.status === 201) {
    return response.data.data;
  } else {
    console.error(`Error creating issue '${issueData.title}': ${response.status}`);
    console.error(response.data);
    return null;
  }
}

// Add resolution to an issue (admin only)
async function addResolution(apiToken, issueId, resolutionNotes) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };

  const response = await makeRequest(
    'POST',
    `${API_BASE_URL}/issues/${issueId}/status`,
    headers,
    {
      status: 'resolved',
      resolution_notes: resolutionNotes,
    }
  );

  if (response.status === 200) {
    return true;
  } else {
    console.error(`Error adding resolution to issue ${issueId}: ${response.status}`);
    console.error(response.data);
    return false;
  }
}

// Add a comment to an issue
async function addComment(apiToken, issueId, content) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiToken}`,
  };

  const response = await makeRequest(
    'POST',
    `${API_BASE_URL}/comments`,
    headers,
    {
      commentable_type: 'Issue',
      commentable_id: issueId,
      content: content,
    }
  );

  if (response.status === 201) {
    return true;
  } else {
    console.error(`Error adding comment to issue ${issueId}: ${response.status}`);
    console.error(response.data);
    return false;
  }
}

// Sleep helper
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Main import function
async function importIssues(jsonFile, apiToken) {
  // Load JSON file
  let data;
  try {
    const fileContent = fs.readFileSync(jsonFile, 'utf8');
    data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading file '${jsonFile}':`, error.message);
    process.exit(1);
  }

  const issuesData = data.issues || [];
  if (!issuesData.length) {
    console.error("Error: No 'issues' array found in JSON");
    process.exit(1);
  }

  console.log(`Found ${issuesData.length} issues to import\n`);

  // Fetch categories
  console.log('Fetching categories...');
  const categoryMap = await fetchCategories(apiToken);
  if (!Object.keys(categoryMap).length) {
    console.error('Error: Could not fetch categories. Exiting.');
    process.exit(1);
  }

  console.log('\nStarting import...\n');

  // Import each issue
  let successCount = 0;
  let failedCount = 0;

  for (let idx = 0; idx < issuesData.length; idx++) {
    const item = issuesData[idx];
    const issueData = item.issue || {};
    const resolutionData = item.resolution || {};
    const commentsData = item.comments || [];

    if (!Object.keys(issueData).length) {
      console.log(`Issue ${idx + 1}: Skipping - no issue data`);
      failedCount++;
      continue;
    }

    const title = issueData.title || 'Untitled Issue';
    console.log(`Issue ${idx + 1}/${issuesData.length}: ${title}`);

    // Create issue
    const createdIssue = await createIssue(apiToken, { ...issueData }, categoryMap);

    if (!createdIssue) {
      console.log(`  ❌ Failed to create issue\n`);
      failedCount++;
      continue;
    }

    const issueId = createdIssue.id;
    console.log(`  ✅ Issue created (ID: ${issueId})`);

    // Add resolution
    const resolutionNotes = resolutionData.resolution_notes;
    if (resolutionNotes) {
      if (await addResolution(apiToken, issueId, resolutionNotes)) {
        console.log(`  ✅ Resolution added`);
      } else {
        console.log(`  ⚠️  Failed to add resolution`);
      }
    }

    // Add comments
    if (commentsData.length) {
      let commentCount = 0;
      for (const comment of commentsData) {
        const content = comment.content;
        if (content) {
          if (await addComment(apiToken, issueId, content)) {
            commentCount++;
          }
          await sleep(500); // Rate limiting
        }
      }

      if (commentCount > 0) {
        console.log(`  ✅ ${commentCount} comment(s) added`);
      }
    }

    successCount++;
    console.log();

    // Rate limiting
    await sleep(1000);
  }

  console.log('\n' + '='.repeat(50));
  console.log('Import complete!');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failedCount}`);
  console.log('='.repeat(50));
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length !== 2) {
    console.log('Usage: node import_issues_from_n8n.js <json_file> <api_token>');
    console.log('\nExample:');
    console.log('  node import_issues_from_n8n.js issues.json your_api_token_here');
    process.exit(1);
  }

  const [jsonFile, apiToken] = args;
  importIssues(jsonFile, apiToken).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { importIssues };

