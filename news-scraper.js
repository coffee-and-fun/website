// news-scraper.js
const fs = require('fs').promises;
const path = require('path');

// Ensure fetch is available (for GitHub Actions/older Node versions)
const ensureFetch = async () => {
  if (!globalThis.fetch) {
    try {
      const { default: fetch } = await import('node-fetch');
      globalThis.fetch = fetch;
    } catch (error) {
      console.error('❌ fetch not available and node-fetch not installed. Run: npm install node-fetch');
      process.exit(1);
    }
  }
};

// Configuration
const CONFIG = {
  // Output settings
  OUTPUT_DIR: './docs',
  ARTICLES_PER_SOURCE: 15,
  
  // Rate limiting (increased for GitHub Actions)
  DELAY_BETWEEN_REQUESTS: 2000, // 2 seconds
  RETRY_DELAY: 5000, // 5 seconds for retries
  MAX_RETRIES: 2,
  REQUEST_TIMEOUT: 15000 // 15 seconds
};

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Enhanced fetch with timeout and headers
async function fetchWithRetry(url, options = {}, retries = CONFIG.MAX_RETRIES) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
  
const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Referer': 'https://www.reddit.com/',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none'
};
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...defaultHeaders, ...options.headers }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.log(`⏰ Rate limited on ${url}, waiting ${CONFIG.RETRY_DELAY/1000}s before retry...`);
        await delay(CONFIG.RETRY_DELAY);
        return fetchWithRetry(url, options, retries - 1);
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    if (retries > 0 && (error.message.includes('timeout') || error.message.includes('ECONNRESET') || error.message.includes('ENOTFOUND'))) {
      console.log(`🔄 Network error on ${url}, retrying in ${CONFIG.RETRY_DELAY/1000}s... (${retries} retries left)`);
      await delay(CONFIG.RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

// Fetch from multiple free sources (no API key needed)
async function fetchFreeNews() {
  await ensureFetch(); // Ensure fetch is available

  
  const sources = [
    {
      name: 'Hacker News',
      url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
      parser: async (data) => {
        // Get top stories
        const topIds = data.slice(0, CONFIG.ARTICLES_PER_SOURCE);
        const stories = [];
        
        for (const id of topIds) {
          try {
            const storyResponse = await fetchWithRetry(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            const story = await storyResponse.json();
            
            if (story && story.title && story.url && !story.url.includes('item?id=')) {
              stories.push({
                headline: story.title,
                link: story.url,
                source: 'Hacker News',
                publishedAt: new Date(story.time * 1000).toISOString(),
                category: 'technology'
              });
            }
            await delay(200); // Slightly longer delay for individual HN items
          } catch (err) {
            console.error(`Error fetching story ${id}:`, err.message);
          }
        }
        return stories;
      }
    },
    {
      name: 'Reddit WorldNews',
      url: 'https://old.reddit.com/r/worldnews/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit WorldNews',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'general'
          }));
      }
    },
    {
      name: 'Reddit Technology',
      url: 'https://old.reddit.com/r/technology/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Technology',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'technology'
          }));
      }
    },
    {
      name: 'Reddit Science',
      url: 'https://old.reddit.com/r/science/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Science',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'science'
          }));
      }
    },
    {
      name: 'Reddit Entertainment',
      url: 'https://old.reddit.com/r/entertainment/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Entertainment',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'entertainment'
          }));
      }
    },
    {
      name: 'Reddit Politics',
      url: 'https://old.reddit.com/r/politics/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Politics',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'politics'
          }));
      }
    },
    {
      name: 'Reddit Sports',
      url: 'https://old.reddit.com/r/sports/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Sports',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'sports'
          }));
      }
    },
    {
      name: 'Reddit Soccer',
      url: 'https://old.reddit.com/r/soccer/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Soccer',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'soccer'
          }));
      }
    },
    {
      name: 'Reddit Baseball',
      url: 'https://old.reddit.com/r/baseball/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Baseball',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'baseball'
          }));
      }
    },
    {
      name: 'Reddit Gaming',
      url: 'https://old.reddit.com/r/gaming/hot.json?limit=25',
      parser: async (data) => {
        if (!data.data || !data.data.children) return [];
        
        return data.data.children
          .filter(post => post.data.url && !post.data.is_self && !post.data.url.includes('reddit.com'))
          .slice(0, CONFIG.ARTICLES_PER_SOURCE)
          .map(post => ({
            headline: post.data.title,
            link: post.data.url,
            source: 'Reddit Gaming',
            publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
            category: 'gaming'
          }));
      }
    }
  ];


  

  const allNews = [];
  
  for (const source of sources) {
    try {
      console.log(`📡 Fetching from ${source.name}...`);
      if (source.name.includes('Reddit')) {
  await delay(CONFIG.DELAY_BETWEEN_REQUESTS * 2); // 4 seconds for Reddit
} else {
  await delay(CONFIG.DELAY_BETWEEN_REQUESTS); // 2 seconds for others
}
      // Use enhanced fetch with proper headers and retry logic
      const response = await fetchWithRetry(source.url);
      const data = await response.json();
      const parsed = await source.parser(data);
      
      allNews.push(...parsed);
      console.log(`✅ Got ${parsed.length} articles from ${source.name}`);
      
      // Longer delay for GitHub Actions environment
      await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
    } catch (error) {
      console.error(`❌ Error fetching from ${source.name}:`, error.message);
      
      // Continue with other sources even if one fails
      if (error.message.includes('Rate limited') || error.message.includes('429')) {
        console.log(`⏸️  Skipping ${source.name} due to rate limiting, continuing with other sources...`);
        await delay(CONFIG.RETRY_DELAY);
      } else {
        console.log(`⏸️  Skipping ${source.name}, continuing with other sources...`);
      }
    }
  }
  
  return allNews;
}

// Process and clean article data
function processArticles(articles) {
  return articles
    .filter(article => 
      article && 
      article.headline && 
      article.link &&
      article.source
    )
    .map(article => ({
      headline: article.headline.trim(),
      link: article.link,
      source: article.source,
      publishedAt: article.publishedAt || new Date().toISOString(),
      category: article.category,
      fetchedAt: new Date().toISOString()
    }));
}

// Save data to JSON file
async function saveToFile(data, filename) {
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
    
    const filepath = path.join(CONFIG.OUTPUT_DIR, filename);
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`✅ Saved ${data.length} articles to ${filepath}`);
    return filepath;
  } catch (error) {
    console.error(`❌ Error saving to ${filename}:`, error.message);
    throw error;
  }
}

// Main function - scrape free news sources
async function scrapeFreeNews() {
  console.log('🚀 Starting free news scraper...');
  console.log('📰 Fetching from multiple Reddit communities + Hacker News...\n');
  console.log('📊 Categories: General, Technology, Science, Entertainment, Politics, Sports, Soccer, Baseball, Gaming\n');
  
  const articles = await fetchFreeNews();
  const processed = processArticles(articles);
  
  // Remove duplicates based on URL
  const uniqueArticles = processed.filter((article, index, self) => 
    index === self.findIndex(a => a.link === article.link)
  );
  
  if (uniqueArticles.length > 0) {
    // Save all articles to single file
    await saveToFile(uniqueArticles, 'news.json');
    
    console.log(`\n🎉 Scraping complete!`);
    console.log(`📊 Total unique articles: ${uniqueArticles.length}`);
    console.log(`📁 File saved to: ${CONFIG.OUTPUT_DIR}/news.json`);
    
    // Show breakdown by category with emojis
    const categoryEmojis = {
      'general': '🌍',
      'technology': '💻',
      'science': '🔬',
      'entertainment': '🎬',
      'politics': '🏛️',
      'sports': '⚽',
      'soccer': '⚽',
      'baseball': '⚾',
      'gaming': '🎮'
    };
    
    const categories = [...new Set(uniqueArticles.map(a => a.category))];
    categories.forEach(cat => {
      const count = uniqueArticles.filter(a => a.category === cat).length;
      const emoji = categoryEmojis[cat] || '📰';
      console.log(`   ${emoji} ${cat}: ${count} articles`);
    });
  } else {
    console.log('❌ No articles found');
  }
}

// CLI interface
async function main() {
  try {
    await scrapeFreeNews();
  } catch (error) {
    console.error('❌ Scraper failed:', error.message);
    process.exit(1);
  }
}

// Export functions for potential module use
module.exports = {
  scrapeFreeNews,
  fetchFreeNews,
  processArticles,
  saveToFile
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}