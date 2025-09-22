exports.handler = async (event) => {
  const allowedOrigin = event.headers.origin || '*';
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    if (!accessToken) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Missing INSTAGRAM_ACCESS_TOKEN' }) };
    }

    const qs = event.queryStringParameters || {};
    const urlsParam = qs.urls || '';

    if (urlsParam) {
      const urls = urlsParam.split(',').map((u) => u.trim()).filter(Boolean);
      const results = (await Promise.all(urls.map(async (u) => {
        try {
          const endpoint = new URL('https://graph.facebook.com/v19.0/instagram_oembed');
          endpoint.searchParams.set('url', u);
          endpoint.searchParams.set('access_token', accessToken);
          endpoint.searchParams.set('omitscript', 'true');
          endpoint.searchParams.set('hidecaption', 'true');
          const resp = await fetch(endpoint.toString());
          if (!resp.ok) return null;
          const data = await resp.json();
          const thumb = data.thumbnail_url || null;
          return thumb ? {
            id: data.media_id || u,
            type: 'IMAGE',
            src: thumb,
            thumbnail: thumb,
            permalink: data.author_url || u,
            caption: data.title || '',
            timestamp: null,
            username: data.author_name || 'instagram',
          } : null;
        } catch (_) {
          return null;
        }
      }))).filter(Boolean);

      return { statusCode: 200, headers, body: JSON.stringify({ items: results }) };
    }

    const url = new URL('https://graph.instagram.com/me/media');
    const limit = Math.min(parseInt(qs.limit || '12', 10) || 12, 50);
    url.searchParams.set('fields', 'id,media_type,media_url,permalink,caption,thumbnail_url,timestamp,username');
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('limit', String(limit));

    const res = await fetch(url.toString());
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: res.status, headers, body: JSON.stringify({ error: 'Instagram API error', detail: text }) };
    }

    const data = await res.json();
    const items = (data.data || []).map((item) => ({
      id: item.id,
      type: item.media_type,
      src: item.media_type === 'VIDEO' ? item.thumbnail_url || null : item.media_url,
      thumbnail: item.thumbnail_url || item.media_url,
      permalink: item.permalink,
      caption: item.caption || '',
      timestamp: item.timestamp,
      username: item.username || 'instagram',
    }));

    return { statusCode: 200, headers, body: JSON.stringify({ items }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Server error', detail: err && err.message ? err.message : String(err) }) };
  }
};
