import { NextRequest, NextResponse } from 'next/server';

interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface SearchResponse {
  query: string;
  results: SearchResult[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  if (!query) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required' },
      { status: 400 }
    );
  }

  try {
    // Use DuckDuckGo Instant Answer API for web search
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&pretty=1&no_html=1&skip_disambig=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'ai-chatbot/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Search API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    // Format results for our SearchCard component
    const results: SearchResult[] = [];
    
    // Add instant answer if available
    if (data.AbstractText) {
      results.push({
        title: data.Heading || query,
        snippet: data.AbstractText,
        url: data.AbstractURL || `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      });
    }

    // Add related topics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      data.RelatedTopics.slice(0, 5).forEach((topic: any) => {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.substring(0, 100),
            snippet: topic.Text,
            url: topic.FirstURL,
          });
        }
      });
    }

    // If no results from DuckDuckGo, provide fallback results
    if (results.length === 0) {
      results.push(
        {
          title: `Pesquisar "${query}" no Google`,
          snippet: `Clique para pesquisar "${query}" no Google`,
          url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        },
        {
          title: `Pesquisar "${query}" no DuckDuckGo`,
          snippet: `Clique para pesquisar "${query}" no DuckDuckGo`,
          url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
        },
        {
          title: `Pesquisar "${query}" na Wikipedia`,
          snippet: `Clique para pesquisar "${query}" na Wikipedia`,
          url: `https://pt.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`,
        }
      );
    }

    const searchResponse: SearchResponse = {
      query,
      results: results.slice(0, 6), // Limit to 6 results
    };

    return NextResponse.json(searchResponse);
  } catch (error) {
    console.error('Search API error:', error);
    
    // Return fallback results on error
    const fallbackResults: SearchResult[] = [
      {
        title: `Pesquisar "${query}" no Google`,
        snippet: `Clique para pesquisar "${query}" no Google`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      },
      {
        title: `Pesquisar "${query}" no DuckDuckGo`,
        snippet: `Clique para pesquisar "${query}" no DuckDuckGo`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      }
    ];

    return NextResponse.json({
      query,
      results: fallbackResults,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Call the same logic as GET but via POST
    const url = new URL(request.url);
    url.searchParams.set('q', query);
    const mockRequest = new NextRequest(url);
    
    return await GET(mockRequest);
  } catch (error) {
    console.error('POST search error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}