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

    const url = new URL('https://graph.instagram.com/me/media');
    const limit = Math.min(parseInt((event.queryStringParameters && event.queryStringParameters.limit) || '12', 10) || 12, 50);
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
