
let cachedNews = null;
let lastFetched = 0;

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

export async function getNews(req, res) {
    try {
        // Use cached news to reduce API requests.
        if (
            cachedNews &&
            Date.now() - lastFetched < CACHE_DURATION
        ) {
            return res.status(200).json({
                success: true,
                articles: cachedNews
            });
        }

        const apiKey = process.env.NEWSDATA_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                success: false,
                message: "NewsData.io API key is missing"
            });
        }

        // Build NewsData.io API request.
        const params = new URLSearchParams({
            apikey: apiKey.trim(),
            language: "en",
            size: "10"
        });

        const apiUrl =
            `https://newsdata.io/api/1/latest?${params}`;

        const response = await fetch(apiUrl);

        if (!response.ok) {
            const errorBody = await response.text();

            console.error("NewsData.io API error:", {
                status: response.status,
                responseBody: errorBody
            });

            return res.status(502).json({
                success: false,
                message: "NewsData.io request failed",
                providerStatus: response.status
            });
        }

        const data = await response.json();

        if (data.status !== "success") {
            console.error("NewsData.io response:", data);

            return res.status(502).json({
                success: false,
                message: "NewsData.io returned an unsuccessful response"
            });
        }

        // Convert NewsData.io articles into the format
        // already expected by your Posts.jsx component.
        const articles = (data.results || []).map((article) => ({
            title: article.title || "Untitled news",
            description: article.description || "",
            image: article.image_url || null,
            url: article.link || null,
            source: {
                name: article.source_name || "News source"
            },
            publishedAt: article.pubDate || null
        }));

        // Save successful response in cache.
        cachedNews = articles;
        lastFetched = Date.now();

        return res.status(200).json({
            success: true,
            articles: cachedNews
        });

    } catch (error) {
        console.error("NewsData.io fetching error:", error);

        return res.status(500).json({
            success: false,
            message: "Server error while fetching news"
        });
    }
}
