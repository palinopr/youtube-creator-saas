# YouTube API Rate Limits & Quotas - Complete Reference

## Overview

YouTube APIs use a quota system to manage API usage. Each project gets a default quota allocation, and different operations consume different amounts of quota units.

---

## Quota Allocation

### Default Quotas

| API | Default Daily Quota | Unit Measurement |
|-----|---------------------|------------------|
| YouTube Data API v3 | 10,000 units/day | Per project |
| YouTube Analytics API | 200 units/day | Per project |
| YouTube Reporting API | Minimal (job-based) | Per project |

### Quota Reset Time

- Quotas reset at **midnight Pacific Time (PT)**
- Pacific Time = UTC-8 (standard) or UTC-7 (daylight saving)

---

## YouTube Data API v3 Quota Costs

### Read Operations

| Operation | Quota Cost |
|-----------|------------|
| `list` (most resources) | 1 unit |
| `search.list` | **100 units** |
| `activities.list` | 1 unit |
| `captions.list` | 50 units |
| `captions.download` | 200 units |
| `commentThreads.list` | 1 unit |
| `comments.list` | 1 unit |

### Write Operations

| Operation | Quota Cost |
|-----------|------------|
| `videos.insert` | **1,600 units** |
| `videos.update` | 50 units |
| `videos.delete` | 50 units |
| `videos.rate` | 50 units |
| `videos.reportAbuse` | 50 units |
| `thumbnails.set` | 50 units |
| `captions.insert` | 400 units |
| `captions.update` | 450 units |
| `captions.delete` | 50 units |
| `channels.update` | 50 units |
| `channelBanners.insert` | 50 units |
| `channelSections.insert` | 50 units |
| `channelSections.update` | 50 units |
| `channelSections.delete` | 50 units |
| `playlists.insert` | 50 units |
| `playlists.update` | 50 units |
| `playlists.delete` | 50 units |
| `playlistItems.insert` | 50 units |
| `playlistItems.update` | 50 units |
| `playlistItems.delete` | 50 units |
| `subscriptions.insert` | 50 units |
| `subscriptions.delete` | 50 units |
| `comments.insert` | 50 units |
| `comments.update` | 50 units |
| `comments.delete` | 50 units |
| `comments.setModerationStatus` | 50 units |
| `comments.markAsSpam` | 50 units |
| `commentThreads.insert` | 50 units |
| `watermarks.set` | 50 units |
| `watermarks.unset` | 50 units |

### Part Parameters Impact

The `part` parameter affects quota usage. More parts = higher cost.

**Example Video List Costs**:

| Parts Requested | Approximate Cost |
|-----------------|------------------|
| `id` only | 0 units |
| `snippet` | 2 units |
| `snippet,statistics` | 3 units |
| `snippet,statistics,contentDetails` | 5 units |
| All parts | ~7 units |

---

## YouTube Analytics API Quota Costs

| Operation | Quota Cost |
|-----------|------------|
| `reports.query` | 1 unit |
| All queries | 1 unit each |

**Note**: Analytics API has a separate 200 units/day quota.

---

## YouTube Reporting API Quota

The Reporting API uses minimal quota:

| Operation | Quota Cost |
|-----------|------------|
| `jobs.create` | Minimal |
| `jobs.list` | Minimal |
| `jobs.delete` | Minimal |
| `reports.list` | Minimal |
| Report download | No quota cost |

**Key Advantage**: Once a job is created, reports are generated automatically with no ongoing quota cost.

---

## Quota Usage Calculation

### Daily Budget Planning

With 10,000 units/day default quota:

| Scenario | Units Used | Remaining |
|----------|------------|-----------|
| 100 video searches | 10,000 | 0 |
| 10,000 video lists | 10,000 | 0 |
| 6 video uploads | 9,600 | 400 |
| 200 playlist updates | 10,000 | 0 |

### Efficient Patterns

**Instead of**:
```
# 10 separate requests = 10 units
GET /videos?id=video1
GET /videos?id=video2
...
GET /videos?id=video10
```

**Use batch requests**:
```
# 1 request = 1 unit
GET /videos?id=video1,video2,...,video10
```

**Maximum IDs per request**: 50 (for most resources)

---

## Rate Limiting

### Request Rate Limits

In addition to daily quotas, there are per-second/minute limits:

| Limit Type | Typical Value |
|------------|---------------|
| Requests per second | ~10-50 (varies) |
| Requests per minute | ~1,000 (varies) |
| Concurrent requests | ~10 |

### Rate Limit Headers

Check response headers for rate limit info:

```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9500
X-RateLimit-Reset: 1609459200
```

---

## Quota Error Handling

### Error Response

```json
{
  "error": {
    "code": 403,
    "message": "The request cannot be completed because you have exceeded your quota.",
    "errors": [
      {
        "domain": "youtube.quota",
        "reason": "quotaExceeded",
        "message": "The request cannot be completed because you have exceeded your quota."
      }
    ]
  }
}
```

### Error Codes Related to Quotas

| Error Code | Reason | Description |
|------------|--------|-------------|
| 403 | `quotaExceeded` | Daily quota exceeded |
| 403 | `rateLimitExceeded` | Per-second rate limit |
| 403 | `userRateLimitExceeded` | Per-user rate limit |
| 429 | `Too Many Requests` | Rate limiting |

### Retry Logic

```javascript
async function makeRequestWithRetry(endpoint, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(endpoint);

      if (response.status === 429 || response.status === 403) {
        const errorData = await response.json();

        if (errorData.error?.errors?.[0]?.reason === 'quotaExceeded') {
          throw new Error('Daily quota exceeded - wait until midnight PT');
        }

        if (errorData.error?.errors?.[0]?.reason === 'rateLimitExceeded') {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          await sleep(delay);
          continue;
        }
      }

      return response.json();

    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
    }
  }
}
```

---

## Quota Increase Requests

### When to Request Increase

- Legitimate business need exceeds default quota
- App has significant user base
- Usage patterns are efficient

### How to Request

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Quotas**
3. Find YouTube Data API v3
4. Click **Edit Quotas**
5. Fill out the request form

### Request Form Requirements

| Field | What to Provide |
|-------|-----------------|
| New quota limit | Specific number needed |
| Justification | Detailed explanation of use case |
| Expected usage | How quota will be consumed |
| Efficiency measures | Steps taken to minimize usage |
| Business documentation | Company info, app description |

### Typical Approval Times

| Increase Amount | Typical Timeline |
|-----------------|------------------|
| 2x default | 1-2 weeks |
| 5x default | 2-4 weeks |
| 10x+ default | 4+ weeks, may require review |

---

## Quota Optimization Strategies

### 1. Use Batch Requests

```javascript
// Instead of 50 separate requests
const videoIds = ['id1', 'id2', ..., 'id50'];

// Use one batched request
const response = await youtube.videos.list({
  part: 'snippet,statistics',
  id: videoIds.join(',')  // Max 50 IDs
});
```

### 2. Use Partial Responses (fields parameter)

```javascript
// Request only needed fields
const response = await youtube.videos.list({
  part: 'snippet,statistics',
  id: videoId,
  fields: 'items(id,snippet/title,statistics/viewCount)'  // Only specific fields
});
```

### 3. Cache Responses

```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getVideoWithCache(videoId) {
  const cacheKey = `video:${videoId}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const data = await youtube.videos.list({
    part: 'snippet,statistics',
    id: videoId
  });

  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}
```

### 4. Use ETags for Conditional Requests

```javascript
// First request
const response = await fetch(url);
const etag = response.headers.get('etag');

// Subsequent request with If-None-Match
const conditionalResponse = await fetch(url, {
  headers: { 'If-None-Match': etag }
});

if (conditionalResponse.status === 304) {
  // Not modified - use cached version (no quota cost)
}
```

### 5. Use Webhooks/Push Notifications

Instead of polling, use YouTube's push notification system where available.

### 6. Minimize Part Parameters

```javascript
// Bad: Request everything
const response = await youtube.videos.list({
  part: 'snippet,contentDetails,statistics,status,player,topicDetails,recordingDetails,fileDetails,processingDetails,suggestions,liveStreamingDetails,localizations',
  id: videoId
});

// Good: Request only what you need
const response = await youtube.videos.list({
  part: 'snippet,statistics',
  id: videoId
});
```

### 7. Use Reporting API for Bulk Data

For large-scale analytics, use Reporting API instead of making many Analytics API queries.

---

## Monitoring Quota Usage

### Google Cloud Console

1. Go to **APIs & Services** → **Dashboard**
2. Select **YouTube Data API v3**
3. View **Metrics** tab for usage graphs

### Programmatic Monitoring

```javascript
// Track quota usage in your application
class QuotaTracker {
  constructor(dailyLimit = 10000) {
    this.dailyLimit = dailyLimit;
    this.usedUnits = 0;
    this.operations = [];
  }

  trackOperation(operation, units) {
    this.usedUnits += units;
    this.operations.push({
      operation,
      units,
      timestamp: new Date(),
      totalUsed: this.usedUnits
    });

    if (this.usedUnits >= this.dailyLimit * 0.8) {
      console.warn(`Quota warning: ${this.usedUnits}/${this.dailyLimit} used`);
    }
  }

  getRemainingQuota() {
    return this.dailyLimit - this.usedUnits;
  }

  canPerformOperation(units) {
    return this.usedUnits + units <= this.dailyLimit;
  }
}

// Usage
const tracker = new QuotaTracker();

if (tracker.canPerformOperation(100)) {
  const results = await youtube.search.list({ ... });
  tracker.trackOperation('search.list', 100);
}
```

---

## Multi-Tenant Quota Management

For SaaS applications serving multiple users:

### Strategy 1: Shared Quota Pool

```javascript
// Track per-user usage within shared pool
const userQuotas = new Map();
const DAILY_USER_LIMIT = 1000;  // Per-user limit

function getUserQuota(userId) {
  if (!userQuotas.has(userId)) {
    userQuotas.set(userId, { used: 0, operations: [] });
  }
  return userQuotas.get(userId);
}

async function executeWithUserQuota(userId, operation, units) {
  const userQuota = getUserQuota(userId);

  if (userQuota.used + units > DAILY_USER_LIMIT) {
    throw new Error('User daily quota exceeded');
  }

  const result = await operation();
  userQuota.used += units;
  userQuota.operations.push({ units, timestamp: new Date() });

  return result;
}
```

### Strategy 2: Priority Queue

```javascript
class PriorityQuotaQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(operation, priority = 'normal') {
    const priorityValue = { high: 0, normal: 1, low: 2 }[priority];

    this.queue.push({ operation, priority: priorityValue });
    this.queue.sort((a, b) => a.priority - b.priority);

    this.process();
  }

  async process() {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    while (this.queue.length > 0) {
      const { operation } = this.queue.shift();

      try {
        await operation();
      } catch (error) {
        if (error.message.includes('quotaExceeded')) {
          // Put back in queue and stop processing
          this.queue.unshift({ operation, priority: 0 });
          break;
        }
        throw error;
      }

      // Rate limiting delay
      await sleep(100);
    }

    this.processing = false;
  }
}
```

---

## LangGraph Agent Quota Management

### Quota-Aware Agent Design

```python
from langgraph.graph import StateGraph
from typing import TypedDict

class AgentState(TypedDict):
    quota_remaining: int
    quota_used: int
    pending_operations: list
    results: dict

QUOTA_COSTS = {
    'search': 100,
    'video_list': 1,
    'channel_list': 1,
    'analytics_query': 1,
    'video_update': 50,
}

def check_quota_node(state: AgentState):
    """Check if quota is available for pending operations"""
    total_cost = sum(
        QUOTA_COSTS.get(op['type'], 1)
        for op in state['pending_operations']
    )

    if total_cost > state['quota_remaining']:
        # Prioritize operations to fit within quota
        state['pending_operations'] = prioritize_operations(
            state['pending_operations'],
            state['quota_remaining']
        )

    return state

def execute_operations_node(state: AgentState):
    """Execute operations within quota limits"""
    for op in state['pending_operations']:
        cost = QUOTA_COSTS.get(op['type'], 1)

        if cost <= state['quota_remaining']:
            result = execute_youtube_operation(op)
            state['results'][op['id']] = result
            state['quota_remaining'] -= cost
            state['quota_used'] += cost

    return state

# Build quota-aware graph
graph = StateGraph(AgentState)
graph.add_node("check_quota", check_quota_node)
graph.add_node("execute", execute_operations_node)
graph.add_edge("check_quota", "execute")
```

---

## Next Steps

- See [06-LANGGRAPH-AGENT-PATTERNS.md](./06-LANGGRAPH-AGENT-PATTERNS.md) for agent design patterns
- See [01-YOUTUBE-DATA-API-V3.md](./01-YOUTUBE-DATA-API-V3.md) for API reference
