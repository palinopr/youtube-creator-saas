export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  content: string;
  date: string;
  readTime: string;
  category: string;
  author: {
    name: string;
    avatar?: string;
  };
  image?: string;
}

// Static blog posts - can be replaced with CMS later
export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-use-youtube-analytics-grow-channel",
    title: "How to Use YouTube Analytics to Grow Your Channel",
    description:
      "Learn how to leverage YouTube Analytics to understand your audience, optimize your content strategy, and accelerate channel growth.",
    category: "Analytics",
    date: "2024-12-01",
    readTime: "8 min read",
    author: {
      name: "TubeGrow Team",
    },
    content: `
# How to Use YouTube Analytics to Grow Your Channel

YouTube Analytics is a goldmine of insights that can help you understand your audience and optimize your content strategy. In this guide, we'll break down the most important metrics and how to use them.

## Understanding Your Key Metrics

### Watch Time
Watch time is one of the most important metrics for YouTube's algorithm. It measures the total minutes viewers spend watching your content. Higher watch time signals to YouTube that your content is valuable.

**Tips to improve watch time:**
- Create compelling hooks in the first 30 seconds
- Use pattern interrupts to maintain engagement
- Structure your videos with clear segments

### Click-Through Rate (CTR)
Your CTR shows what percentage of people who see your thumbnail actually click on your video. A good CTR is typically between 4-10%.

**Tips to improve CTR:**
- Test different thumbnail styles
- Use contrasting colors and readable text
- Create curiosity gaps in your titles

### Audience Retention
This shows you exactly where viewers drop off in your videos. Use this to identify weak points and improve future content.

## Using Analytics for Content Strategy

### Best Performing Topics
Look at which videos get the most views and engagement. Double down on topics that resonate with your audience.

### Traffic Sources
Understanding where your viewers come from helps you optimize for those channels:
- **Search**: Focus on SEO optimization
- **Suggested Videos**: Optimize thumbnails and titles
- **External**: Build relationships with referrers

### Audience Demographics
Know who's watching to tailor your content. Consider:
- Age and gender
- Geographic location
- Device type

## Action Items

1. Check your analytics weekly
2. Identify your top 5 performing videos
3. Analyze what they have in common
4. Apply those learnings to new content

Start implementing these insights today and watch your channel grow!
    `,
  },
  {
    slug: "best-times-to-post-youtube-2024",
    title: "Best Times to Post on YouTube in 2024",
    description:
      "Discover the optimal posting times for YouTube based on data from millions of videos. Maximize your views with strategic scheduling.",
    category: "Growth",
    date: "2024-11-28",
    readTime: "6 min read",
    author: {
      name: "TubeGrow Team",
    },
    content: `
# Best Times to Post on YouTube in 2024

Timing can significantly impact your video's initial performance. While the "best time" depends on your specific audience, here's what the data shows.

## General Best Times

Based on analysis of millions of videos:

### Weekdays
- **Best**: Thursday and Friday, 12pm - 3pm
- **Good**: Monday - Wednesday, 2pm - 4pm

### Weekends
- **Best**: Saturday and Sunday, 9am - 11am

## Why Timing Matters

YouTube's algorithm gives new videos a "testing period" where it shows your content to a sample of your subscribers. If these initial viewers engage well:

1. YouTube shows it to more people
2. It gets recommended in suggested videos
3. It can appear in search results

Posting when your audience is active gives you the best chance of strong initial engagement.

## Finding Your Optimal Time

### Check Your Analytics
Go to YouTube Studio > Analytics > Audience to see when your viewers are online.

### Consider Time Zones
If your audience is global, you may need to balance multiple time zones.

### Test and Iterate
Try posting at different times and track your results over 4-6 weeks.

## Pro Tips

1. **Schedule in advance**: Use YouTube's scheduler to post consistently
2. **Give buffer time**: Videos can take 1-2 hours to be fully processed
3. **Be consistent**: Same day/time helps build audience habits

Remember: Great content beats perfect timing every time. Focus on quality first, then optimize timing.
    `,
  },
  {
    slug: "ai-changing-youtube-content-creation",
    title: "How AI is Changing YouTube Content Creation",
    description:
      "Explore how artificial intelligence is revolutionizing content creation, from analytics to editing, and how creators can leverage these tools.",
    category: "AI",
    date: "2024-11-25",
    readTime: "10 min read",
    author: {
      name: "TubeGrow Team",
    },
    content: `
# How AI is Changing YouTube Content Creation

Artificial intelligence is transforming how creators produce, optimize, and grow their content. Here's what you need to know.

## AI-Powered Analytics

Traditional analytics tell you what happened. AI analytics tell you why and what to do about it.

### Predictive Insights
AI can analyze patterns across your videos to predict:
- Which topics will perform best
- Optimal video length for your audience
- Expected view counts

### Natural Language Queries
Instead of digging through dashboards, you can ask questions like:
- "Why did my last video underperform?"
- "What should I make a video about next?"

## Content Optimization

### Title and Thumbnail Generation
AI can suggest optimized titles and analyze thumbnail effectiveness based on:
- Emotional impact
- Text readability
- Visual contrast

### SEO Optimization
AI tools can:
- Research relevant keywords
- Optimize descriptions
- Suggest tags

## Automated Clip Generation

One of the most time-consuming tasks for creators is repurposing content. AI can:
- Identify viral-worthy moments
- Auto-generate Shorts and clips
- Optimize for different platforms

## The Human Element

While AI is powerful, it's a tool to augment human creativity, not replace it:

1. **Your unique perspective** can't be replicated
2. **Authentic connection** with your audience matters
3. **Creative decisions** still need human judgment

## Getting Started with AI Tools

1. **Start with analytics**: AI insights can guide your strategy
2. **Experiment with one tool at a time**: Don't overwhelm yourself
3. **Measure results**: Track how AI recommendations impact performance

The creators who thrive will be those who effectively combine AI capabilities with human creativity.
    `,
  },
];

export function getAllPosts(): BlogPost[] {
  return blogPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((post) => post.category === category);
}
