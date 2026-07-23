// Supabase Edge Function: search-web
// بحث في الإنترنت للمساعد الذكي - يدعم منتجات ومنافسين وتقارير سوق

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { query, type = 'general', country = 'EG' } = await req.json();

        if (!query) {
            return new Response(JSON.stringify({ error: 'query is required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        let results: any[] = [];

        // طريقة 1: DuckDuckGo Instant Answer API (مجاني)
        try {
            const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
            const ddgResp = await fetch(ddgUrl);
            if (ddgResp.ok) {
                const ddgData = await ddgResp.json();
                if (ddgData.AbstractText) {
                    results.push({
                        title: ddgData.Heading || query,
                        snippet: ddgData.AbstractText,
                        url: ddgData.AbstractURL || '',
                        source: 'DuckDuckGo'
                    });
                }
                if (ddgData.RelatedTopics && ddgData.RelatedTopics.length > 0) {
                    ddgData.RelatedTopics.slice(0, 5).forEach((topic: any) => {
                        if (topic.Text) {
                            results.push({
                                title: topic.Text.split(' - ')[0] || '',
                                snippet: topic.Text,
                                url: topic.FirstURL || '',
                                source: 'DuckDuckGo'
                            });
                        }
                    });
                }
            }
        } catch (e) {
            console.warn('DuckDuckGo search failed:', e);
        }

        // طريقة 2: DuckDuckGo HTML search results (أعمق)
        try {
            const htmlUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' ' + country === 'EG' ? 'مصر' : '')}`;
            const htmlResp = await fetch(htmlUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (htmlResp.ok) {
                const html = await htmlResp.text();
                // استخراج النتائج من HTML
                const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;
                let match;
                while ((match = resultRegex.exec(html)) !== null && results.length < 10) {
                    const url = match[1];
                    const title = match[2].replace(/<[^>]*>/g, '').trim();
                    const snippet = match[3].replace(/<[^>]*>/g, '').trim();
                    if (title && snippet) {
                        results.push({ title, snippet, url, source: 'Web' });
                    }
                }

                // بديل: استخراج أبسط
                if (results.length === 0) {
                    const simpleRegex = /<h2[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g;
                    while ((match = simpleRegex.exec(html)) !== null && results.length < 10) {
                        const url = match[1];
                        const title = match[2].replace(/<[^>]*>/g, '').trim();
                        if (title) {
                            results.push({ title, snippet: '', url, source: 'Web' });
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('HTML search failed:', e);
        }

        // طريقة 3: Wikipedia API (للمعلومات العامة)
        if (results.length === 0 || type === 'info') {
            try {
                const wikiLang = country === 'EG' ? 'ar' : 'en';
                const wikiUrl = `https://${wikiLang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
                const wikiResp = await fetch(wikiUrl);
                if (wikiResp.ok) {
                    const wikiData = await wikiResp.json();
                    if (wikiData.extract) {
                        results.push({
                            title: wikiData.title || query,
                            snippet: wikiData.extract,
                            url: wikiData.content_urls?.desktop?.page || '',
                            source: 'Wikipedia'
                        });
                    }
                }
            } catch (e) {
                console.warn('Wikipedia search failed:', e);
            }
        }

        // تجميع النتائج
        const response = {
            query,
            type,
            results: results.slice(0, 8),
            count: results.length,
            timestamp: new Date().toISOString()
        };

        return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message || 'Search failed' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
