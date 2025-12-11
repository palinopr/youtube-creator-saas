# YouTube Data API v3 - Complete Reference

## Overview

The YouTube Data API v3 lets you incorporate YouTube functionality into your application. You can use the API to fetch search results, retrieve channel and video information, manage playlists, and much more.

**Base URL**: `https://www.googleapis.com/youtube/v3`

**Authentication**: OAuth 2.0 or API Key (for public data only)

---

## Resources

### 1. Videos

Represents a YouTube video.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /videos` | Returns a list of videos that match the API request parameters |
| `insert` | `POST /videos` | Uploads a video to YouTube |
| `update` | `PUT /videos` | Updates a video's metadata |
| `delete` | `DELETE /videos` | Deletes a YouTube video |
| `rate` | `POST /videos/rate` | Add a like or dislike rating to a video |
| `getRating` | `GET /videos/getRating` | Retrieves the ratings that the authorized user gave to a list of videos |
| `reportAbuse` | `POST /videos/reportAbuse` | Reports a video for containing abusive content |

#### Parts (for `list` method)

| Part | Description |
|------|-------------|
| `contentDetails` | Duration, dimension, definition, caption, licensedContent, regionRestriction |
| `fileDetails` | File name, size, type, container, video/audio streams (owner only) |
| `id` | Video ID |
| `liveStreamingDetails` | Live broadcast metadata (start/end times, concurrent viewers) |
| `localizations` | Localized versions of title and description |
| `player` | Embed HTML for the video player |
| `processingDetails` | Video processing status and progress (owner only) |
| `recordingDetails` | Recording location and date |
| `snippet` | Title, description, thumbnails, channelId, publishedAt, tags, categoryId |
| `statistics` | viewCount, likeCount, dislikeCount, favoriteCount, commentCount |
| `status` | uploadStatus, privacyStatus, license, embeddable, publicStatsViewable |
| `suggestions` | Processing suggestions and warnings (owner only) |
| `topicDetails` | Freebase topic IDs associated with the video |

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=snippet,contentDetails,statistics
  &id=VIDEO_ID
  &key=YOUR_API_KEY
```

#### Quota Cost
- `list`: 1 unit per request
- `insert`: 1600 units per request
- `update`: 50 units per request
- `delete`: 50 units per request
- `rate`: 50 units per request
- `getRating`: 1 unit per request

---

### 2. Channels

Represents a YouTube channel.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /channels` | Returns channel resources matching the API request criteria |
| `update` | `PUT /channels` | Updates a channel's metadata |

#### Parts

| Part | Description |
|------|-------------|
| `auditDetails` | Channel eligibility for monetization features (owner only) |
| `brandingSettings` | Channel branding settings (banner, colors, featured channels) |
| `contentDetails` | Playlists associated with channel (uploads, likes, favorites) |
| `contentOwnerDetails` | Content owner linked to channel |
| `id` | Channel ID |
| `localizations` | Localized channel metadata |
| `snippet` | Title, description, customUrl, publishedAt, thumbnails, country |
| `statistics` | viewCount, subscriberCount, hiddenSubscriberCount, videoCount |
| `status` | privacyStatus, isLinked, longUploadsStatus, madeForKids |
| `topicDetails` | Freebase topic IDs associated with channel |

#### Filter Parameters (one required)
- `forHandle`: YouTube handle (e.g., `@channelname`)
- `forUsername`: YouTube username
- `id`: Channel ID(s), comma-separated
- `mine`: Set to `true` for authenticated user's channel

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/channels
  ?part=snippet,contentDetails,statistics
  &id=CHANNEL_ID
  &key=YOUR_API_KEY
```

#### Quota Cost
- `list`: 1 unit per request
- `update`: 50 units per request

---

### 3. Playlists

Represents a YouTube playlist.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /playlists` | Returns playlists matching the API request parameters |
| `insert` | `POST /playlists` | Creates a playlist |
| `update` | `PUT /playlists` | Modifies a playlist |
| `delete` | `DELETE /playlists` | Deletes a playlist |

#### Parts

| Part | Description |
|------|-------------|
| `contentDetails` | itemCount (number of videos in playlist) |
| `id` | Playlist ID |
| `localizations` | Localized playlist title and description |
| `player` | Embed HTML for playlist player |
| `snippet` | title, description, publishedAt, thumbnails, channelId, channelTitle |
| `status` | privacyStatus (public, unlisted, private) |

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/playlists
  ?part=snippet,contentDetails
  &channelId=CHANNEL_ID
  &maxResults=25
  &key=YOUR_API_KEY
```

#### Quota Cost
- `list`: 1 unit
- `insert`: 50 units
- `update`: 50 units
- `delete`: 50 units

---

### 4. PlaylistItems

Represents a video in a playlist.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /playlistItems` | Returns items in a playlist |
| `insert` | `POST /playlistItems` | Adds a video to a playlist |
| `update` | `PUT /playlistItems` | Updates a playlist item |
| `delete` | `DELETE /playlistItems` | Removes a video from a playlist |

#### Parts

| Part | Description |
|------|-------------|
| `contentDetails` | videoId, startAt, endAt, note, videoPublishedAt |
| `id` | Playlist item ID |
| `snippet` | playlistId, position, resourceId, title, description, thumbnails |
| `status` | privacyStatus |

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/playlistItems
  ?part=snippet,contentDetails
  &playlistId=PLAYLIST_ID
  &maxResults=50
  &key=YOUR_API_KEY
```

---

### 5. Search

Search for videos, channels, and playlists.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /search` | Returns search results matching query parameters |

#### Parameters

| Parameter | Description |
|-----------|-------------|
| `q` | Search query string |
| `type` | Restrict to: `video`, `channel`, `playlist` (comma-separated) |
| `order` | Sort by: `date`, `rating`, `relevance`, `title`, `viewCount` |
| `publishedAfter` | Filter by publish date (RFC 3339) |
| `publishedBefore` | Filter by publish date (RFC 3339) |
| `regionCode` | ISO 3166-1 alpha-2 country code |
| `channelId` | Search within a specific channel |
| `videoDuration` | `any`, `short` (<4min), `medium` (4-20min), `long` (>20min) |
| `videoDefinition` | `any`, `high`, `standard` |
| `videoType` | `any`, `episode`, `movie` |
| `videoCategoryId` | Filter by video category |
| `eventType` | `completed`, `live`, `upcoming` (for live broadcasts) |
| `forMine` | Restrict to authenticated user's videos |

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/search
  ?part=snippet
  &q=coding+tutorial
  &type=video
  &order=viewCount
  &maxResults=25
  &key=YOUR_API_KEY
```

#### Quota Cost
- `list`: **100 units per request** (most expensive read operation)

---

### 6. Comments

Represents a single comment.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /comments` | Returns comments |
| `insert` | `POST /comments` | Creates a reply to an existing comment |
| `update` | `PUT /comments` | Modifies a comment |
| `delete` | `DELETE /comments` | Deletes a comment |
| `setModerationStatus` | `POST /comments/setModerationStatus` | Sets moderation status |
| `markAsSpam` | `POST /comments/markAsSpam` | Marks comments as spam |

#### Parts

| Part | Description |
|------|-------------|
| `id` | Comment ID |
| `snippet` | authorDisplayName, authorProfileImageUrl, authorChannelUrl, textOriginal, textDisplay, parentId, videoId, canRate, viewerRating, likeCount, publishedAt, updatedAt |

---

### 7. CommentThreads

Represents a top-level comment and its replies.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /commentThreads` | Returns comment threads |
| `insert` | `POST /commentThreads` | Creates a new top-level comment |

#### Parts

| Part | Description |
|------|-------------|
| `id` | Comment thread ID |
| `snippet` | channelId, videoId, topLevelComment, canReply, totalReplyCount, isPublic |
| `replies` | Array of reply comments |

#### Filter Parameters
- `allThreadsRelatedToChannelId`: All comments on channel's videos
- `channelId`: Comments about the channel itself
- `videoId`: Comments on a specific video
- `id`: Specific comment thread IDs

#### Example Request
```
GET https://www.googleapis.com/youtube/v3/commentThreads
  ?part=snippet,replies
  &videoId=VIDEO_ID
  &maxResults=100
  &order=relevance
  &key=YOUR_API_KEY
```

---

### 8. Subscriptions

Represents a subscription to a channel.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /subscriptions` | Returns subscriptions matching criteria |
| `insert` | `POST /subscriptions` | Adds a subscription |
| `delete` | `DELETE /subscriptions` | Removes a subscription |

#### Parts

| Part | Description |
|------|-------------|
| `contentDetails` | totalItemCount, newItemCount, activityType |
| `id` | Subscription ID |
| `snippet` | publishedAt, title, description, resourceId, channelId, thumbnails |
| `subscriberSnippet` | Subscriber's channel info |

#### Filter Parameters
- `channelId`: Subscriptions for a specific channel
- `mine`: Authenticated user's subscriptions
- `myRecentSubscribers`: Recent subscribers (owner only)
- `mySubscribers`: All subscribers (owner only)

---

### 9. Captions

Represents a caption track for a video.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /captions` | Returns caption tracks for a video |
| `insert` | `POST /captions` | Uploads a caption track |
| `update` | `PUT /captions` | Updates a caption track |
| `delete` | `DELETE /captions` | Deletes a caption track |
| `download` | `GET /captions/{id}` | Downloads a caption track |

#### Parts

| Part | Description |
|------|-------------|
| `id` | Caption track ID |
| `snippet` | videoId, lastUpdated, trackKind, language, name, audioTrackType, isCC, isLarge, isEasyReader, isDraft, isAutoSynced, status |

#### Caption Track Kinds
- `standard`: Normal caption track
- `ASR`: Auto-generated speech recognition
- `forced`: Forced narrative captions

---

### 10. ChannelSections

Represents a section displayed on a channel page.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /channelSections` | Returns channel sections |
| `insert` | `POST /channelSections` | Creates a channel section |
| `update` | `PUT /channelSections` | Updates a channel section |
| `delete` | `DELETE /channelSections` | Deletes a channel section |

#### Section Types
- `allPlaylists`: All playlists
- `completedEvents`: Completed live events
- `likedPlaylists`: Liked playlists
- `likes`: Liked videos
- `liveEvents`: Current live events
- `multipleChannels`: Featured channels
- `multiplePlaylists`: Featured playlists
- `popularUploads`: Popular uploads
- `recentActivity`: Recent activity
- `recentPosts`: Recent posts
- `recentUploads`: Recent uploads
- `singlePlaylist`: Single playlist
- `subscriptions`: Subscriptions
- `upcomingEvents`: Upcoming live events

---

### 11. Activities

Represents channel activity (uploads, likes, comments, etc.).

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /activities` | Returns channel activity |

#### Parts

| Part | Description |
|------|-------------|
| `contentDetails` | Details specific to activity type |
| `id` | Activity ID |
| `snippet` | type, publishedAt, channelId, title, description, thumbnails |

#### Activity Types
- `upload`: Video upload
- `like`: Liked a video
- `favorite`: Favorited a video
- `comment`: Commented on a video
- `subscription`: Subscribed to a channel
- `playlistItem`: Added video to playlist
- `social`: Social network post
- `channelItem`: Added resource to channel
- `bulletin`: Channel bulletin posted

---

### 12. VideoCategories

Represents a video category.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /videoCategories` | Returns video categories |

#### Common Video Categories

| ID | Category |
|----|----------|
| 1 | Film & Animation |
| 2 | Autos & Vehicles |
| 10 | Music |
| 15 | Pets & Animals |
| 17 | Sports |
| 19 | Travel & Events |
| 20 | Gaming |
| 22 | People & Blogs |
| 23 | Comedy |
| 24 | Entertainment |
| 25 | News & Politics |
| 26 | Howto & Style |
| 27 | Education |
| 28 | Science & Technology |
| 29 | Nonprofits & Activism |

---

### 13. Thumbnails

Manages video thumbnails.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `set` | `POST /thumbnails/set` | Uploads and sets a custom thumbnail |

#### Thumbnail Sizes

| Size | Dimensions | Description |
|------|------------|-------------|
| `default` | 120x90 | Default thumbnail |
| `medium` | 320x180 | Medium quality |
| `high` | 480x360 | High quality |
| `standard` | 640x480 | Standard quality |
| `maxres` | 1280x720 | Maximum resolution |

---

### 14. I18nLanguages

Returns supported application languages.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /i18nLanguages` | Returns supported languages |

---

### 15. I18nRegions

Returns supported content regions.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /i18nRegions` | Returns supported regions |

---

### 16. Members

Represents channel members (for channels with memberships enabled).

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /members` | Returns channel members |

#### Parts

| Part | Description |
|------|-------------|
| `snippet` | memberSince, memberTotalDuration, memberDetails |

**Required Scope**: `https://www.googleapis.com/auth/youtube.channel-memberships.creator`

---

### 17. MembershipsLevels

Represents membership levels for a channel.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /membershipsLevels` | Returns membership levels |

#### Parts

| Part | Description |
|------|-------------|
| `id` | Level ID |
| `snippet` | levelDetails (displayName, creatorChannelId) |

---

### 18. VideoAbuseReportReasons

Returns reasons for reporting abusive videos.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /videoAbuseReportReasons` | Returns abuse report reasons |

---

### 19. Watermarks

Manages channel watermarks (branding images on videos).

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `set` | `POST /watermarks/set` | Uploads and sets a watermark |
| `unset` | `POST /watermarks/unset` | Removes the watermark |

---

### 20. ChannelBanners

Manages channel banner images.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `insert` | `POST /channelBanners/insert` | Uploads a channel banner |

---

### 21. PlaylistImages

Manages playlist thumbnail images.

#### Methods

| Method | HTTP Request | Description |
|--------|--------------|-------------|
| `list` | `GET /playlistImages` | Returns playlist images |
| `insert` | `POST /playlistImages` | Uploads a playlist image |
| `update` | `PUT /playlistImages` | Updates a playlist image |
| `delete` | `DELETE /playlistImages` | Deletes a playlist image |

---

## Common Parameters

These parameters apply to all API methods:

| Parameter | Description |
|-----------|-------------|
| `key` | API key for public data access |
| `access_token` | OAuth 2.0 token for private data |
| `part` | Resource parts to include in response (required) |
| `maxResults` | Maximum items per page (default: 5, max: 50) |
| `pageToken` | Token for pagination |
| `fields` | Partial response (reduce response size) |
| `prettyPrint` | Format JSON response (default: true) |
| `quotaUser` | Alternative to userIp for quota tracking |

---

## Response Structure

All list operations return paginated responses:

```json
{
  "kind": "youtube#videoListResponse",
  "etag": "...",
  "nextPageToken": "CDIQAA",
  "prevPageToken": "CDIQAQ",
  "pageInfo": {
    "totalResults": 1000,
    "resultsPerPage": 25
  },
  "items": [
    {
      "kind": "youtube#video",
      "etag": "...",
      "id": "VIDEO_ID",
      "snippet": { ... },
      "statistics": { ... }
    }
  ]
}
```

---

## Error Handling

### Common Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameter |
| 401 | Unauthorized - Invalid/expired credentials |
| 403 | Forbidden - Insufficient permissions or quota exceeded |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource conflict |
| 500 | Internal Server Error |

### Error Response Structure

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

---

## LangGraph Agent Opportunities

### 1. Video Analysis Agent
- Fetch video details, statistics, and comments
- Analyze engagement patterns
- Generate content insights

### 2. Channel Growth Agent
- Monitor subscriber changes
- Track video performance over time
- Identify trending content patterns

### 3. Content Discovery Agent
- Search for relevant videos
- Analyze competitor channels
- Find collaboration opportunities

### 4. Comment Management Agent
- Monitor and respond to comments
- Identify sentiment patterns
- Flag spam or inappropriate content

### 5. Playlist Optimization Agent
- Organize videos into optimal playlists
- Track playlist performance
- Suggest video ordering

---

## Next Steps

- See [02-YOUTUBE-ANALYTICS-API.md](./02-YOUTUBE-ANALYTICS-API.md) for detailed metrics
- See [03-YOUTUBE-REPORTING-API.md](./03-YOUTUBE-REPORTING-API.md) for bulk data exports
- See [04-OAUTH-AUTHENTICATION.md](./04-OAUTH-AUTHENTICATION.md) for auth setup
