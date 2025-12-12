export type NicheSlug =
  | "gaming"
  | "fitness"
  | "finance"
  | "tech-ai"
  | "education"
  | "cooking"
  | "beauty-lifestyle"
  | "music"
  | "entertainment-reactions"
  | "podcasts";

export type NicheData = {
  slug: NicheSlug;
  name: string;
  tagline: string;
  description: string;
  painPoints: string[];
  howTubeGrowHelps: string[];
  exampleTitles: string[];
  exampleTags: string[];
  exampleShortsHooks: string[];
};

export const niches: NicheData[] = [
  {
    slug: "gaming",
    name: "Gaming",
    tagline: "Win the algorithm without burning out.",
    description:
      "Gaming channels live on momentum: trends shift weekly, series matter, and Shorts often outperform long‑form for discovery. TubeGrow helps you identify what game modes, formats, and upload cadences actually drive retention and subscribers for your audience.",
    painPoints: [
      "Trends change faster than your upload cycle.",
      "Series videos can tank if the first episode underperforms.",
      "Shorts and long‑form need different titles and hooks.",
      "It’s hard to tell if growth comes from search or browse.",
    ],
    howTubeGrowHelps: [
      "Breaks down performance by game, series, and format so you know what to double down on.",
      "Finds retention drop‑offs to fix pacing, intros, and highlights.",
      "Generates SEO‑aligned titles/tags for new uploads and Shorts.",
      "Surfaces the best posting windows for your specific viewer base.",
    ],
    exampleTitles: [
      "I Tried the New Ranked Meta for 7 Days… Here’s What Happened",
      "This One Setting Instantly Boosted My FPS (2025 Update)",
      "Top 10 Hidden Mechanics You’re Still Missing",
    ],
    exampleTags: [
      "gaming tips 2025",
      "ranked meta",
      "fps settings",
      "beginner guide",
      "best builds",
    ],
    exampleShortsHooks: [
      "Wait until you see what this combo does…",
      "This patch changed everything in 10 seconds.",
      "If you’re stuck in low rank, try this first.",
    ],
  },
  {
    slug: "fitness",
    name: "Fitness",
    tagline: "Turn viewers into consistent clients.",
    description:
      "Fitness content is crowded, but demand is always high. The winners are channels that pair trust with clear transformation outcomes. TubeGrow shows which workout formats, challenges, and angles convert viewers into repeat watchers and subscribers.",
    painPoints: [
      "Videos plateau after week one.",
      "It’s unclear which topics bring search traffic vs subscribers.",
      "Retention drops during long explanations.",
      "Shorts hooks feel repetitive.",
    ],
    howTubeGrowHelps: [
      "Maps topic → performance so you know which routines drive long‑term traffic.",
      "Highlights retention dips to tighten explanations and pacing.",
      "AI suggests SEO titles/descriptions for workouts and challenges.",
      "Finds viral moments to cut into Shorts with strong hooks.",
    ],
    exampleTitles: [
      "30‑Minute Fat‑Loss Workout You Can Repeat All Week",
      "I Did This Mobility Routine Daily for 14 Days (Results)",
      "The 3 Biggest Form Mistakes Killing Your Gains",
    ],
    exampleTags: [
      "home workout",
      "fat loss routine",
      "mobility 2025",
      "beginner fitness",
      "form tips",
    ],
    exampleShortsHooks: [
      "Stop doing this if you want results.",
      "Try this 20‑second warm‑up before every lift.",
      "This move hits your core instantly.",
    ],
  },
  {
    slug: "finance",
    name: "Finance",
    tagline: "Explain money clearly and rank for it.",
    description:
      "Finance channels depend on trust, clarity, and evergreen search traffic. TubeGrow helps you spot which concepts bring long‑tail views, where viewers drop off, and how to structure titles/descriptions for real keyword demand.",
    painPoints: [
      "Evergreen videos are hard to prioritize.",
      "Retention drops during jargon or disclaimers.",
      "Search traffic feels inconsistent.",
      "Titles need to be click‑worthy but accurate.",
    ],
    howTubeGrowHelps: [
      "Identifies your highest‑value evergreen topics by long‑term views.",
      "Flags retention cliffs so you can simplify explanations.",
      "AI generates accurate, SEO‑aligned titles and chapters.",
      "Shows which videos convert viewers into subscribers over time.",
    ],
    exampleTitles: [
      "How I Budget in 2025 (Simple System That Works)",
      "The Truth About High‑Yield Savings Right Now",
      "Beginner Investing: What I’d Do With $1,000 Today",
    ],
    exampleTags: [
      "budgeting 2025",
      "high yield savings",
      "investing for beginners",
      "personal finance",
      "money tips",
    ],
    exampleShortsHooks: [
      "Here’s where most people lose money without noticing.",
      "If you have $100, start here.",
      "One chart explains the whole market right now.",
    ],
  },
  {
    slug: "tech-ai",
    name: "Tech/AI",
    tagline: "Capture trends early, compound views later.",
    description:
      "Tech and AI content moves fast. TubeGrow helps you track which tools and topics spike, how quickly they decay, and which formats (reviews, tutorials, comparisons) keep viewers watching.",
    painPoints: [
      "Trends peak before your follow‑up uploads.",
      "Hard to tell if a tool is a one‑week spike or evergreen.",
      "Retention drops on long setup sections.",
      "SEO titles can be too generic.",
    ],
    howTubeGrowHelps: [
      "Surfaces early trend signals across your uploads.",
      "Shows decay curves so you invest in topics with staying power.",
      "AI suggests titles/descriptions keyed to real queries.",
      "Finds clean Shorts clips from demos and reactions.",
    ],
    exampleTitles: [
      "This New AI Tool Replaces 3 Apps at Once (Live Test)",
      "Top 7 Creator AI Tools That Actually Save Time",
      "I Compared the 3 Best Video AIs — Here’s the Winner",
    ],
    exampleTags: [
      "ai tools 2025",
      "creator tech",
      "ai comparison",
      "productivity ai",
      "tutorial",
    ],
    exampleShortsHooks: [
      "Watch what happens when I click this one button…",
      "This AI feature feels like cheating.",
      "I didn’t expect this result at all.",
    ],
  },
  {
    slug: "education",
    name: "Education",
    tagline: "Teach better, grow faster.",
    description:
      "Educational channels win by clarity, structure, and strong search intent. TubeGrow helps you see which lessons bring repeat traffic and how to tighten pacing for higher retention.",
    painPoints: [
      "Great content doesn’t always get discovered.",
      "Retention drops during slow intros.",
      "Hard to know which topics students want next.",
      "Chapters and descriptions take time.",
    ],
    howTubeGrowHelps: [
      "Finds search‑driven topics and keyword clusters for your niche.",
      "Highlights retention dips to refine structure.",
      "AI generates chapters, descriptions, and tags quickly.",
      "Lets you ask AI what to teach next based on data.",
    ],
    exampleTitles: [
      "Learn This in 15 Minutes: The Core Idea Everyone Misses",
      "Complete Beginner Guide to [Topic] in 2025",
      "The Fastest Way to Understand [Concept]",
    ],
    exampleTags: [
      "beginner guide",
      "learn fast",
      "tutorial 2025",
      "study tips",
      "explained",
    ],
    exampleShortsHooks: [
      "Here’s the one rule that makes this click.",
      "You only need to remember this.",
      "Let me show you the shortcut in 10 seconds.",
    ],
  },
  {
    slug: "cooking",
    name: "Cooking",
    tagline: "Make recipes that get re‑watched.",
    description:
      "Cooking channels depend on watch‑through and repeat views. TubeGrow shows which recipes and formats keep viewers watching, and helps you turn long recipes into high‑performing Shorts.",
    painPoints: [
      "Viewers skip ahead and retention drops.",
      "Hard to know which recipes are evergreen.",
      "Titles can be too vague for search.",
      "Shorts need stronger hooks than long videos.",
    ],
    howTubeGrowHelps: [
      "Analyzes retention to spot where viewers lose interest.",
      "Surfaces top evergreen recipe topics for your audience.",
      "AI creates search‑aligned recipe titles/descriptions.",
      "Finds the best 15–45s moments for Shorts.",
    ],
    exampleTitles: [
      "The 5‑Ingredient Dinner I Make Every Week",
      "Perfect [Dish] in 20 Minutes (No Fancy Tools)",
      "I Tested 3 Viral Recipes — Only One Was Worth It",
    ],
    exampleTags: [
      "easy dinner",
      "quick recipe",
      "meal prep",
      "viral recipes",
      "cooking tips",
    ],
    exampleShortsHooks: [
      "This sauce changes everything.",
      "Don’t blink — this trick is fast.",
      "You can make this with what you have at home.",
    ],
  },
  {
    slug: "beauty-lifestyle",
    name: "Beauty/Lifestyle",
    tagline: "Stand out in a crowded feed.",
    description:
      "Beauty and lifestyle growth comes from consistency, trend timing, and strong packaging. TubeGrow helps you track what formats (tutorials, routines, hauls, reviews) convert to subscribers and which hooks drive Shorts reach.",
    painPoints: [
      "Trends move quickly, views decay fast.",
      "Retention drops in long intros.",
      "Packaging needs to match real search.",
      "Hard to scale Shorts output.",
    ],
    howTubeGrowHelps: [
      "Shows which formats and topics grow your audience.",
      "Flags retention dips to tighten openings.",
      "AI generates keyword‑aligned titles/descriptions/tags.",
      "Finds viral Shorts clips from long routines or reviews.",
    ],
    exampleTitles: [
      "My 10‑Minute Morning Routine for Glowing Skin (2025)",
      "I Tried the Viral [Product] So You Don’t Have To",
      "3 Makeup Mistakes That Age You Instantly",
    ],
    exampleTags: [
      "skincare routine 2025",
      "makeup tips",
      "product review",
      "beauty hacks",
      "lifestyle",
    ],
    exampleShortsHooks: [
      "This product surprised me in 3 seconds.",
      "If you’re doing this, stop now.",
      "Here’s the glow‑up trick nobody tells you.",
    ],
  },
  {
    slug: "music",
    name: "Music",
    tagline: "Grow fans, not just plays.",
    description:
      "Music channels need repeat listening and strong suggested reach. TubeGrow helps you see which covers, originals, and formats build loyal fans and how to turn performances into Shorts that travel.",
    painPoints: [
      "Hard to know which songs/genres drive subs.",
      "Performance videos can have uneven retention.",
      "Search titles need clarity on style and artist.",
      "Shorts clips are time‑consuming to cut.",
    ],
    howTubeGrowHelps: [
      "Breaks performance down by song, style, and series.",
      "Highlights retention dips to refine pacing or editing.",
      "AI suggests clear search‑friendly titles and tags.",
      "Auto‑finds the best chorus/hook moments for Shorts.",
    ],
    exampleTitles: [
      "I Re‑Imagined [Song] as a 2025 Pop Ballad",
      "The One Scale That Made My Playing 10x Cleaner",
      "Live Session: [Genre] Jam With a Twist",
    ],
    exampleTags: [
      "music cover",
      "live session",
      "guitar tips",
      "vocal tutorial",
      "original music",
    ],
    exampleShortsHooks: [
      "Wait for the drop at 0:12.",
      "This chorus hits different live.",
      "Here’s the 5‑second trick for cleaner notes.",
    ],
  },
  {
    slug: "entertainment-reactions",
    name: "Entertainment/Reactions",
    tagline: "Make moments that travel.",
    description:
      "Reaction and entertainment channels win on pacing, emotion, and clipability. TubeGrow helps you see what keeps viewers watching and automatically finds the best moments to post as Shorts.",
    painPoints: [
      "Retention is sensitive to pacing.",
      "Hard to identify the best reaction moments quickly.",
      "Shorts need punchier hooks.",
      "Topics can be hit‑or‑miss.",
    ],
    howTubeGrowHelps: [
      "Shows retention curves so you can tighten edits.",
      "Finds emotional peaks and quotable moments for Shorts.",
      "AI generates titles that match search + curiosity.",
      "Identifies which topics reliably outperform on your channel.",
    ],
    exampleTitles: [
      "I Didn’t Expect THIS to Happen… (Real Reaction)",
      "Top 5 Moments That Broke the Internet This Week",
      "Watching [Show/Event] for the First Time — Wild",
    ],
    exampleTags: [
      "reaction video",
      "viral moments",
      "entertainment 2025",
      "first time reaction",
      "funny clips",
    ],
    exampleShortsHooks: [
      "My jaw dropped at this part.",
      "This is the craziest moment so far.",
      "If you missed this, watch now.",
    ],
  },
  {
    slug: "podcasts",
    name: "Podcasts",
    tagline: "Turn long conversations into growth.",
    description:
      "Podcast channels grow through Shorts and consistent long‑form. TubeGrow helps you find viral moments, optimize episode metadata, and track which topics drive subscribers.",
    painPoints: [
      "Episodes are long and hard to clip.",
      "Shorts need a clear hook + loop.",
      "SEO for podcast titles is inconsistent.",
      "Hard to measure topic impact over time.",
    ],
    howTubeGrowHelps: [
      "Analyzes transcripts to auto‑find clip‑worthy moments.",
      "Suggests Shorts hooks and timestamps.",
      "AI generates episode titles/descriptions/tags.",
      "Tracks topic → growth so you can book better guests.",
    ],
    exampleTitles: [
      "The Conversation That Changed How I Think About [Topic]",
      "[Guest] Explains the Truth About [Trend] in 2025",
      "3 Lessons From a 2‑Hour Talk (Condensed)",
    ],
    exampleTags: [
      "podcast clips",
      "interview",
      "long form content",
      "shorts strategy",
      "creator podcast",
    ],
    exampleShortsHooks: [
      "This 12‑second answer is everything.",
      "Here’s the moment the room went silent.",
      "If you only hear one thing, hear this.",
    ],
  },
];

export const nichesBySlug: Record<NicheSlug, NicheData> = niches.reduce(
  (acc, n) => {
    acc[n.slug] = n;
    return acc;
  },
  {} as Record<NicheSlug, NicheData>
);

