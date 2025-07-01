// news-scraper.js
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  // Output settings
  OUTPUT_DIR: './docs',
  ARTICLES_PER_SOURCE: 15,
  
  // Rate limiting (milliseconds between requests)
  DELAY_BETWEEN_REQUESTS: 1000
};

// Utility function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch from multiple free sources (no API key needed)
async function fetchFreeNews() {
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
            const storyResponse = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
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
            await delay(100); // Small delay between requests
          } catch (err) {
            console.error(`Error fetching story ${id}:`, err.message);
          }
        }
        return stories;
      }
    },
    {
      name: 'Reddit WorldNews',
      url: 'https://www.reddit.com/r/worldnews/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/technology/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/science/hot.json?limit=25',
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
      name: 'Reddit Pop Culture',
      url: 'https://www.reddit.com/r/entertainment/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/politics/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/sports/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/soccer/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/baseball/hot.json?limit=25',
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
      url: 'https://www.reddit.com/r/gaming/hot.json?limit=25',
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
      const response = await fetch(source.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const parsed = await source.parser(data);
      allNews.push(...parsed);
      console.log(`✅ Got ${parsed.length} articles from ${source.name}`);
      
      await delay(CONFIG.DELAY_BETWEEN_REQUESTS);
    } catch (error) {
      console.error(`❌ Error fetching from ${source.name}:`, error.message);
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
  console.log('📰 Fetching from Hacker News, Reddit WorldNews, Technology & Science...\n');
  
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
    
    // Show breakdown by category
    const categories = [...new Set(uniqueArticles.map(a => a.category))];
    categories.forEach(cat => {
      const count = uniqueArticles.filter(a => a.category === cat).length;
      console.log(`   ${cat}: ${count} articles`);
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