# YouTube Reporting API - Complete Reference

## Overview

The YouTube Reporting API schedules reporting jobs for bulk asynchronous data retrieval. Unlike the Analytics API which provides real-time queries, the Reporting API generates downloadable reports containing large datasets.

**Base URL**: `https://youtubereporting.googleapis.com/v1`

**Authentication**: OAuth 2.0 required

**Required Scopes**:
- `https://www.googleapis.com/auth/yt-analytics.readonly` - View analytics
- `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` - View monetary analytics

---

## Key Concepts

### Reports vs Jobs

| Concept | Description |
|---------|-------------|
| **Report Type** | Template defining what data is included (dimensions + metrics) |
| **Job** | A scheduled request to generate reports of a specific type |
| **Report** | Generated data file (downloadable) from a job |

### Report Generation Schedule

- Reports are generated **daily** after jobs are created
- Historical reports are backfilled for up to **30 days**
- Reports are available within **24-48 hours** of the reporting day

---

## Endpoints

### 1. ReportTypes

List available report types.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /reportTypes` | Lists all available report types |

#### Example Request
```
GET https://youtubereporting.googleapis.com/v1/reportTypes
  ?onBehalfOfContentOwner=CONTENT_OWNER_ID
```

#### Response Structure
```json
{
  "reportTypes": [
    {
      "id": "channel_basic_a2",
      "name": "Channel basic report",
      "deprecateTime": null,
      "systemManaged": false
    }
  ]
}
```

---

### 2. Jobs

Manage report generation jobs.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `create` | `POST /jobs` | Creates a new reporting job |
| `delete` | `DELETE /jobs/{jobId}` | Deletes a reporting job |
| `get` | `GET /jobs/{jobId}` | Gets a specific job |
| `list` | `GET /jobs` | Lists all jobs |

#### Create Job Request
```
POST https://youtubereporting.googleapis.com/v1/jobs

{
  "reportTypeId": "channel_basic_a2",
  "name": "My Channel Basic Report"
}
```

#### Job Response Structure
```json
{
  "id": "JOB_ID",
  "reportTypeId": "channel_basic_a2",
  "name": "My Channel Basic Report",
  "createTime": "2024-01-15T10:30:00Z",
  "expireTime": null,
  "systemManaged": false
}
```

---

### 3. Reports

Access generated reports.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /jobs/{jobId}/reports` | Lists reports for a job |
| `get` | `GET /jobs/{jobId}/reports/{reportId}` | Gets a specific report |

#### Report Response Structure
```json
{
  "reports": [
    {
      "id": "REPORT_ID",
      "jobId": "JOB_ID",
      "startTime": "2024-01-14T00:00:00Z",
      "endTime": "2024-01-15T00:00:00Z",
      "createTime": "2024-01-15T08:30:00Z",
      "downloadUrl": "https://youtubereporting.googleapis.com/v1/media/..."
    }
  ]
}
```

#### Downloading Reports
```
GET {downloadUrl}
Authorization: Bearer ACCESS_TOKEN
```

Reports are delivered as **gzip-compressed CSV files**.

---

## Available Report Types

### Channel Reports

| Report Type ID | Description |
|----------------|-------------|
| `channel_basic_a2` | Basic channel metrics |
| `channel_province_a2` | Province-level metrics |
| `channel_playback_location_a2` | Playback location metrics |
| `channel_traffic_source_a2` | Traffic source metrics |
| `channel_device_os_a2` | Device and OS metrics |
| `channel_subtitles_a2` | Subtitle/CC metrics |
| `channel_combined_a2` | Combined channel metrics |
| `channel_demographics_a1` | Demographics metrics |
| `channel_sharing_service_a1` | Sharing service metrics |
| `channel_annotations_a1` | Annotation metrics |
| `channel_cards_a1` | Card metrics |
| `channel_end_screens_a1` | End screen metrics |

### Content Owner Reports

| Report Type ID | Description |
|----------------|-------------|
| `content_owner_basic_a3` | Basic content owner metrics |
| `content_owner_province_a2` | Province-level metrics |
| `content_owner_playback_location_a2` | Playback location metrics |
| `content_owner_traffic_source_a2` | Traffic source metrics |
| `content_owner_device_os_a2` | Device and OS metrics |
| `content_owner_subtitles_a2` | Subtitle metrics |
| `content_owner_combined_a2` | Combined metrics |
| `content_owner_demographics_a1` | Demographics metrics |
| `content_owner_sharing_service_a1` | Sharing service metrics |
| `content_owner_annotations_a1` | Annotation metrics |
| `content_owner_cards_a1` | Card metrics |
| `content_owner_end_screens_a1` | End screen metrics |

### Asset Reports (Content Owners)

| Report Type ID | Description |
|----------------|-------------|
| `content_owner_asset_basic_a1` | Basic asset metrics |
| `content_owner_asset_province_a1` | Asset province metrics |
| `content_owner_asset_playback_location_a1` | Asset playback location |
| `content_owner_asset_traffic_source_a1` | Asset traffic source |
| `content_owner_asset_device_os_a1` | Asset device/OS metrics |
| `content_owner_asset_combined_a1` | Combined asset metrics |
| `content_owner_asset_demographics_a1` | Asset demographics |
| `content_owner_asset_sharing_service_a1` | Asset sharing metrics |

### Ad Performance Reports

| Report Type ID | Description |
|----------------|-------------|
| `content_owner_ad_rates_a1` | Ad rates report |
| `content_owner_ad_performance_a1` | Ad performance metrics |

### Playlist Reports

| Report Type ID | Description |
|----------------|-------------|
| `playlist_basic_a1` | Basic playlist metrics |
| `playlist_province_a1` | Playlist province metrics |
| `playlist_playback_location_a1` | Playlist playback location |
| `playlist_traffic_source_a1` | Playlist traffic source |
| `playlist_device_os_a1` | Playlist device/OS metrics |
| `playlist_combined_a1` | Combined playlist metrics |

### System-Managed Reports

System-managed reports are auto-generated by YouTube:

| Report Type ID | Description |
|----------------|-------------|
| `channel_basic_a2_system_managed` | Auto-generated basic channel |
| `content_owner_basic_a3_system_managed` | Auto-generated content owner |

---

## Report Columns

### channel_basic_a2 Columns

| Column | Type | Description |
|--------|------|-------------|
| `date` | STRING | YYYYMMDD format |
| `channel_id` | STRING | Channel ID |
| `video_id` | STRING | Video ID |
| `claimed_status` | STRING | claimed/not_claimed |
| `uploader_type` | STRING | self/thirdParty |
| `live_or_on_demand` | STRING | LIVE/ON_DEMAND |
| `subscribed_status` | STRING | SUBSCRIBED/UNSUBSCRIBED |
| `country_code` | STRING | ISO 3166-1 alpha-2 |
| `views` | INTEGER | View count |
| `comments` | INTEGER | Comment count |
| `likes` | INTEGER | Like count |
| `dislikes` | INTEGER | Dislike count |
| `shares` | INTEGER | Share count |
| `watch_time_minutes` | FLOAT | Watch time in minutes |
| `average_view_duration_seconds` | FLOAT | Average view duration |
| `average_view_duration_percentage` | FLOAT | Average view percentage |
| `annotation_click_through_rate` | FLOAT | Annotation CTR |
| `annotation_close_rate` | FLOAT | Annotation close rate |
| `annotation_impressions` | INTEGER | Annotation impressions |
| `annotation_clickable_impressions` | INTEGER | Clickable impressions |
| `annotation_closable_impressions` | INTEGER | Closable impressions |
| `annotation_clicks` | INTEGER | Annotation clicks |
| `annotation_closes` | INTEGER | Annotation closes |
| `card_click_rate` | FLOAT | Card CTR |
| `card_teaser_click_rate` | FLOAT | Card teaser CTR |
| `card_impressions` | INTEGER | Card impressions |
| `card_teaser_impressions` | INTEGER | Card teaser impressions |
| `card_clicks` | INTEGER | Card clicks |
| `card_teaser_clicks` | INTEGER | Card teaser clicks |
| `subscribers_gained` | INTEGER | New subscribers |
| `subscribers_lost` | INTEGER | Lost subscribers |
| `videos_added_to_playlists` | INTEGER | Added to playlists |
| `videos_removed_from_playlists` | INTEGER | Removed from playlists |
| `red_views` | INTEGER | YouTube Premium views |
| `red_watch_time_minutes` | FLOAT | Premium watch time |

### channel_traffic_source_a2 Columns

| Column | Type | Description |
|--------|------|-------------|
| `date` | STRING | YYYYMMDD format |
| `channel_id` | STRING | Channel ID |
| `video_id` | STRING | Video ID |
| `claimed_status` | STRING | Claim status |
| `uploader_type` | STRING | Uploader type |
| `live_or_on_demand` | STRING | Live/On-demand |
| `subscribed_status` | STRING | Subscription status |
| `country_code` | STRING | Country code |
| `traffic_source_type` | INTEGER | Traffic source type code |
| `traffic_source_detail` | STRING | Traffic source detail |
| `views` | INTEGER | View count |
| `watch_time_minutes` | FLOAT | Watch time |

### channel_demographics_a1 Columns

| Column | Type | Description |
|--------|------|-------------|
| `date` | STRING | YYYYMMDD format |
| `channel_id` | STRING | Channel ID |
| `video_id` | STRING | Video ID |
| `claimed_status` | STRING | Claim status |
| `uploader_type` | STRING | Uploader type |
| `live_or_on_demand` | STRING | Live/On-demand |
| `subscribed_status` | STRING | Subscription status |
| `country_code` | STRING | Country code |
| `age_group` | STRING | Age group |
| `gender` | STRING | Gender |
| `views_percentage` | FLOAT | Percentage of views |

---

## Workflow Example

### Step 1: List Available Report Types

```python
import requests

headers = {'Authorization': f'Bearer {access_token}'}

response = requests.get(
    'https://youtubereporting.googleapis.com/v1/reportTypes',
    headers=headers
)

report_types = response.json()['reportTypes']
```

### Step 2: Create a Job

```python
job_data = {
    'reportTypeId': 'channel_basic_a2',
    'name': 'Daily Channel Report'
}

response = requests.post(
    'https://youtubereporting.googleapis.com/v1/jobs',
    headers=headers,
    json=job_data
)

job = response.json()
job_id = job['id']
```

### Step 3: List Generated Reports

```python
# Wait 24-48 hours for reports to generate

response = requests.get(
    f'https://youtubereporting.googleapis.com/v1/jobs/{job_id}/reports',
    headers=headers
)

reports = response.json()['reports']
```

### Step 4: Download Report

```python
import gzip
import io

for report in reports:
    download_url = report['downloadUrl']

    response = requests.get(download_url, headers=headers)

    # Decompress gzip content
    with gzip.GzipFile(fileobj=io.BytesIO(response.content)) as f:
        csv_content = f.read().decode('utf-8')

    # Process CSV data
    print(csv_content)
```

---

## Report Availability Timeline

| Report Type | Historical Data | Future Reports |
|-------------|-----------------|----------------|
| Historical Backfill | Up to 30 days back | Generated daily |
| Non-Historical | 60 days back | Generated daily |
| System-Managed | Up to 180 days back | Auto-generated |

---

## Best Practices

### 1. Job Management
- Create one job per report type needed
- Don't delete jobs you still need data from
- Jobs that haven't generated reports in 60 days expire

### 2. Report Processing
- Reports can be large (gigabytes for big channels)
- Process reports incrementally if possible
- Store processed data in your own database

### 3. Error Handling
- Check for empty reports
- Handle partial data gracefully
- Implement retry logic for download failures

### 4. Data Freshness
- Reports have 24-48 hour delay
- Revenue data may have additional delays
- Plan dashboards with appropriate lag times

---

## Comparison: Analytics API vs Reporting API

| Feature | Analytics API | Reporting API |
|---------|---------------|---------------|
| Query Type | Real-time queries | Scheduled bulk reports |
| Response Format | JSON | Gzip CSV |
| Data Granularity | Flexible (aggregated) | Daily, detailed |
| Data Volume | Limited per query | Unlimited |
| Latency | ~72 hours | 24-48 hours |
| Custom Date Ranges | Yes | Fixed daily reports |
| Quota Cost | Per query | Per job (minimal) |
| Best For | Dashboards, ad-hoc | ETL, data warehouse |

---

## LangGraph Agent Opportunities

### 1. ETL Pipeline Agent
- Automated report retrieval and processing
- Data warehouse population
- Historical data backfill management

### 2. Anomaly Detection Agent
- Process daily reports for anomalies
- Alert on significant metric changes
- Pattern recognition across time series

### 3. Competitive Analysis Agent
- Compare performance across multiple channels
- Benchmark against content owner network
- Track asset performance for content owners

### 4. Revenue Reconciliation Agent
- Process ad performance reports
- Match against expected revenue
- Identify discrepancies early

### 5. Content Audit Agent
- Track all video performance
- Identify underperforming content
- Generate optimization recommendations

---

## Next Steps

- See [04-OAUTH-AUTHENTICATION.md](./04-OAUTH-AUTHENTICATION.md) for authentication setup
- See [05-RATE-LIMITS-QUOTAS.md](./05-RATE-LIMITS-QUOTAS.md) for quota management
- See [06-LANGGRAPH-AGENT-PATTERNS.md](./06-LANGGRAPH-AGENT-PATTERNS.md) for agent design
