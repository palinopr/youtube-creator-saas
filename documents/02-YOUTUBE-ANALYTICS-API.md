# YouTube Analytics API - Complete Reference

## Overview

The YouTube Analytics API provides access to YouTube Analytics data. Use it to generate custom reports containing YouTube Analytics data for channels and content owners.

**Base URL**: `https://youtubeanalytics.googleapis.com/v2`

**Authentication**: OAuth 2.0 required (no API key access)

**Required Scopes**:
- `https://www.googleapis.com/auth/yt-analytics.readonly` - View analytics
- `https://www.googleapis.com/auth/yt-analytics-monetary.readonly` - View monetary analytics

---

## Core Endpoint

### Reports

#### Method

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `query` | `GET /reports` | Retrieves Analytics data |

#### Required Parameters

| Parameter | Description |
|-----------|-------------|
| `ids` | `channel==MINE` or `channel==CHANNEL_ID` or `contentOwner==OWNER_ID` |
| `startDate` | Start date (YYYY-MM-DD format) |
| `endDate` | End date (YYYY-MM-DD format) |
| `metrics` | Comma-separated list of metrics to retrieve |

#### Optional Parameters

| Parameter | Description |
|-----------|-------------|
| `dimensions` | Comma-separated list of dimensions for grouping |
| `filters` | Filter expression (e.g., `video==VIDEO_ID;country==US`) |
| `sort` | Sort order (prefix with `-` for descending) |
| `maxResults` | Maximum rows to return (default: unlimited) |
| `startIndex` | 1-based index for pagination |
| `currency` | Currency for revenue metrics (ISO 4217, e.g., `USD`) |

---

## Metrics Reference

### View Metrics

| Metric | Description |
|--------|-------------|
| `views` | Total number of video views |
| `engagedViews` | Views where user watched significant portion OR engaged (new in 2025) |
| `redViews` | Views from YouTube Premium subscribers |
| `uniques` | Estimated unique viewers |

### Watch Time Metrics

| Metric | Description |
|--------|-------------|
| `estimatedMinutesWatched` | Total watch time in minutes |
| `estimatedRedMinutesWatched` | Watch time from YouTube Premium |
| `averageViewDuration` | Average view duration in seconds |
| `averageViewPercentage` | Average percentage of video watched |

### Engagement Metrics

| Metric | Description |
|--------|-------------|
| `likes` | Number of likes |
| `dislikes` | Number of dislikes |
| `comments` | Number of comments |
| `shares` | Number of shares |
| `subscribersGained` | New subscribers gained |
| `subscribersLost` | Subscribers lost |

### Revenue Metrics (Monetary Scope Required)

| Metric | Description |
|--------|-------------|
| `estimatedRevenue` | Total estimated revenue (USD) |
| `estimatedAdRevenue` | Revenue from ads |
| `estimatedRedPartnerRevenue` | Revenue from YouTube Premium |
| `grossRevenue` | Gross revenue before splits |
| `cpm` | Cost per mille (1000 impressions) |
| `playbackBasedCpm` | CPM based on playbacks |
| `adImpressions` | Number of ad impressions |
| `monetizedPlaybacks` | Playbacks that showed ads |

### Annotation Metrics

| Metric | Description |
|--------|-------------|
| `annotationClickThroughRate` | CTR for annotations |
| `annotationCloseRate` | Close rate for annotations |
| `annotationImpressions` | Annotation impression count |
| `annotationClickableImpressions` | Clickable annotation impressions |
| `annotationClosableImpressions` | Closable annotation impressions |
| `annotationClicks` | Total annotation clicks |
| `annotationCloses` | Total annotation closes |

### Card Metrics

| Metric | Description |
|--------|-------------|
| `cardImpressions` | Number of card impressions |
| `cardClicks` | Number of card clicks |
| `cardClickRate` | Card click-through rate |
| `cardTeaserImpressions` | Card teaser impressions |
| `cardTeaserClicks` | Card teaser clicks |
| `cardTeaserClickRate` | Card teaser CTR |

### End Screen Metrics

| Metric | Description |
|--------|-------------|
| `endScreenElementImpressions` | End screen element impressions |
| `endScreenElementClicks` | End screen element clicks |
| `endScreenElementClickRate` | End screen CTR |

### Playlist Metrics

| Metric | Description |
|--------|-------------|
| `playlistStarts` | Number of playlist starts |
| `viewsPerPlaylistStart` | Average views per playlist start |
| `averageTimeInPlaylist` | Average time spent in playlist |

### Shorts Metrics (2025 Update)

| Metric | Description |
|--------|-------------|
| `views` | Now counts Shorts views at 0+ seconds (changed from loop count) |
| `engagedViews` | User watched majority OR engaged with Short |

---

## Dimensions Reference

### Time Dimensions

| Dimension | Description |
|-----------|-------------|
| `day` | Daily granularity (YYYY-MM-DD) |
| `month` | Monthly granularity (YYYY-MM) |
| `7DayTotals` | 7-day rolling totals (deprecated) |
| `30DayTotals` | 30-day rolling totals (deprecated) |

### Geography Dimensions

| Dimension | Description |
|-----------|-------------|
| `country` | ISO 3166-1 alpha-2 country code |
| `province` | ISO 3166-2 region code (US/Canada only) |
| `city` | City ID |
| `continent` | Continent code |
| `subContinent` | UN sub-region code |

### Content Dimensions

| Dimension | Description |
|-----------|-------------|
| `video` | Individual video ID |
| `channel` | Channel ID |
| `playlist` | Playlist ID |
| `group` | Asset group ID |
| `asset` | Content owner asset ID |
| `claimedStatus` | `claimed` or `notClaimed` |
| `uploaderType` | `self` or `thirdParty` |

### Playback Dimensions

| Dimension | Description |
|-----------|-------------|
| `liveOrOnDemand` | `live` or `onDemand` |
| `subscribedStatus` | `subscribed` or `unsubscribed` |
| `youtubeProduct` | `core`, `gaming`, `kids`, `music` |
| `creatorContentType` | `shorts`, `livestream`, `videoOnDemand` |

### Device Dimensions

| Dimension | Description |
|-----------|-------------|
| `deviceType` | `mobile`, `desktop`, `tablet`, `tv`, `gameConsole`, `unknownPlatform` |
| `operatingSystem` | OS name (Android, iOS, Windows, etc.) |

### Demographic Dimensions

| Dimension | Description |
|-----------|-------------|
| `ageGroup` | `age13-17`, `age18-24`, `age25-34`, `age35-44`, `age45-54`, `age55-64`, `age65-` |
| `gender` | `male`, `female`, `userSpecified` |

### Traffic Source Dimensions

| Dimension | Description |
|-----------|-------------|
| `insightTrafficSourceType` | High-level traffic source category |
| `insightTrafficSourceDetail` | Specific referrer details |

#### Traffic Source Types

| Value | Description |
|-------|-------------|
| `ADVERTISING` | YouTube ads |
| `ANNOTATION` | Video annotations |
| `CAMPAIGN_CARD` | Campaign cards |
| `END_SCREEN` | End screen elements |
| `EXT_URL` | External websites |
| `HASHTAGS` | Hashtag pages |
| `LIVE_REDIRECT` | Live stream redirects |
| `NO_LINK_EMBEDDED` | Embedded players without links |
| `NO_LINK_OTHER` | Other views without links |
| `NOTIFICATION` | YouTube notifications |
| `PLAYLIST` | Playlist views |
| `PRODUCT_PAGE` | YouTube product pages |
| `PROMOTED` | Promoted content |
| `RELATED_VIDEO` | Related/suggested videos |
| `SHORTS` | Shorts feed |
| `SOUND_PAGE` | Shorts sound pages |
| `SUBSCRIBER` | Subscriber feeds |
| `YT_CHANNEL` | Channel pages |
| `YT_OTHER_PAGE` | Other YouTube pages |
| `YT_PLAYLIST_PAGE` | Playlist pages |
| `YT_SEARCH` | YouTube search |
| `VIDEO_REMIXES` | Video remixes/clips |

### Playback Location Dimensions

| Dimension | Description |
|-----------|-------------|
| `insightPlaybackLocationType` | Where video was watched |
| `insightPlaybackLocationDetail` | Specific location details |

#### Playback Location Types

| Value | Description |
|-------|-------------|
| `BROWSE` | Browse/home page |
| `CHANNEL` | Channel page |
| `EMBEDDED` | Embedded in external site |
| `EXTERNAL_APP` | External application |
| `MOBILE` | Mobile app |
| `SEARCH` | Search results |
| `SHORTS` | Shorts player |
| `WATCH` | Watch page |
| `YT_OTHER` | Other YouTube pages |

### Sharing Dimensions

| Dimension | Description |
|-----------|-------------|
| `sharingService` | Platform where video was shared |

#### Sharing Services

| Value | Description |
|-------|-------------|
| `AMEBA` | Ameba |
| `ANDROID_EMAIL` | Android Email app |
| `ANDROID_MESSENGER` | Android Messenger |
| `ANDROID_MMS` | Android MMS |
| `BLOGGER` | Blogger |
| `COPY_PASTE` | Copy to clipboard |
| `EMBED` | Embed code |
| `FACEBOOK` | Facebook |
| `FACEBOOK_MESSENGER` | Facebook Messenger |
| `GMAIL` | Gmail |
| `GOO` | Goo |
| `GOOGLEPLUS` | Google+ |
| `HANGOUTS` | Hangouts |
| `HTC_MMS` | HTC MMS |
| `KAKAO_STORY` | Kakao Story |
| `KAKAO_TALK` | Kakao Talk |
| `KIK` | Kik |
| `LINE` | LINE |
| `LINKEDIN` | LinkedIn |
| `LK_MMS` | LK MMS |
| `MAIL` | Email |
| `MOTOROLA_MESSAGING` | Motorola Messaging |
| `MYSPACE` | Myspace |
| `NAVER` | Naver |
| `NEARBY_SHARE` | Nearby Share |
| `NUJIJ` | NUjij |
| `ODNOKLASSNIKI` | Odnoklassniki |
| `OTHER` | Other |
| `PINTEREST` | Pinterest |
| `REDDIT` | Reddit |
| `SKYPE` | Skype |
| `SMS` | SMS |
| `SONY_CONVERSATIONS` | Sony Conversations |
| `STUMBLEUPON` | StumbleUpon |
| `TELEGRAM` | Telegram |
| `TEXT_MESSAGE` | Text Message |
| `TUMBLR` | Tumblr |
| `TWITTER` | Twitter/X |
| `VERIZON_MMS` | Verizon MMS |
| `VIBER` | Viber |
| `VKONTAKTE` | VKontakte |
| `WECHAT` | WeChat |
| `WEIBO` | Weibo |
| `WHATS_APP` | WhatsApp |
| `YAHOO` | Yahoo |

---

## Example Queries

### Basic Channel Stats (Last 30 Days)

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,likes,comments
```

### Top 10 Videos by Views

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched,averageViewPercentage
  &dimensions=video
  &sort=-views
  &maxResults=10
```

### Daily Views Trend

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched
  &dimensions=day
  &sort=day
```

### Traffic Sources Breakdown

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched
  &dimensions=insightTrafficSourceType
  &sort=-views
```

### Demographics Analysis

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=viewerPercentage
  &dimensions=ageGroup,gender
```

### Geographic Performance

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched
  &dimensions=country
  &sort=-views
  &maxResults=25
```

### Device Type Analysis

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched,averageViewDuration
  &dimensions=deviceType
```

### Revenue Report (Monetary Scope Required)

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=estimatedRevenue,estimatedAdRevenue,cpm,monetizedPlaybacks
  &dimensions=day
  &currency=USD
```

### Subscriber Growth Analysis

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=subscribersGained,subscribersLost
  &dimensions=day
  &sort=day
```

### Video Performance for Specific Video

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,likes,comments,shares,averageViewDuration,averageViewPercentage
  &filters=video==VIDEO_ID
  &dimensions=day
```

### Shorts vs Regular Video Performance

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=views,estimatedMinutesWatched,averageViewDuration
  &dimensions=creatorContentType
```

### Playlist Performance

```
GET https://youtubeanalytics.googleapis.com/v2/reports
  ?ids=channel==MINE
  &startDate=2024-01-01
  &endDate=2024-01-31
  &metrics=playlistStarts,viewsPerPlaylistStart,averageTimeInPlaylist
  &dimensions=playlist
  &sort=-playlistStarts
```

---

## Response Structure

```json
{
  "kind": "youtubeAnalytics#resultTable",
  "columnHeaders": [
    {
      "name": "day",
      "columnType": "DIMENSION",
      "dataType": "STRING"
    },
    {
      "name": "views",
      "columnType": "METRIC",
      "dataType": "INTEGER"
    }
  ],
  "rows": [
    ["2024-01-01", 1500],
    ["2024-01-02", 1750],
    ["2024-01-03", 2100]
  ]
}
```

---

## Dimension & Metric Compatibility

Not all dimensions can be combined with all metrics. Common compatible groupings:

### Basic Reports
- **Dimensions**: `day`, `country`, `video`
- **Metrics**: `views`, `estimatedMinutesWatched`, `averageViewDuration`, `likes`, `comments`, `shares`

### Traffic Reports
- **Dimensions**: `insightTrafficSourceType`, `insightTrafficSourceDetail`
- **Metrics**: `views`, `estimatedMinutesWatched`

### Device Reports
- **Dimensions**: `deviceType`, `operatingSystem`
- **Metrics**: `views`, `estimatedMinutesWatched`, `averageViewDuration`

### Demographics Reports
- **Dimensions**: `ageGroup`, `gender`
- **Metrics**: `viewerPercentage`

### Revenue Reports
- **Dimensions**: `day`, `country`, `video`
- **Metrics**: `estimatedRevenue`, `cpm`, `adImpressions`, `monetizedPlaybacks`

### Engagement Reports
- **Dimensions**: `sharingService`
- **Metrics**: `shares`

---

## Data Availability

| Data Type | Availability |
|-----------|--------------|
| Historical Reports | Data available since 2013 |
| Real-time Data | ~72 hour delay for most metrics |
| Revenue Data | ~10 day delay |
| Geographic Data | May have sampling for low-volume channels |

---

## Quotas & Limits

- **Default Quota**: 200 units/day for Analytics API
- **Query Cost**: 1 unit per query
- **Max Results**: No hard limit, but large result sets may timeout
- **Date Range**: Up to 366 days per query

---

## LangGraph Agent Opportunities

### 1. Performance Dashboard Agent
- Automated daily/weekly performance reports
- Trend analysis and anomaly detection
- Comparative analysis across time periods

### 2. Audience Insights Agent
- Demographic segmentation analysis
- Geographic expansion recommendations
- Device optimization suggestions

### 3. Traffic Source Optimizer
- Identify top-performing traffic sources
- Recommend SEO improvements based on search traffic
- Analyze referral patterns

### 4. Revenue Optimization Agent
- CPM trend analysis
- Monetization opportunity identification
- Revenue forecasting

### 5. Content Strategy Agent
- Identify high-performing video characteristics
- Optimal posting time analysis
- Content gap identification

### 6. Engagement Analyzer
- Comment sentiment correlation with performance
- Share pattern analysis
- Subscriber behavior insights

---

## Next Steps

- See [03-YOUTUBE-REPORTING-API.md](./03-YOUTUBE-REPORTING-API.md) for bulk data exports
- See [04-OAUTH-AUTHENTICATION.md](./04-OAUTH-AUTHENTICATION.md) for authentication setup
- See [05-RATE-LIMITS-QUOTAS.md](./05-RATE-LIMITS-QUOTAS.md) for quota management
