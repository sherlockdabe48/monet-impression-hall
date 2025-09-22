404: Not Found
// Instagram dynamic gallery
async function loadInstagramGallery() {
  try {
    const response = await fetch('/api/instagram?limit=12');
    if (!response.ok) return;
    const { items } = await response.json();
    const grid = document.getElementById('insta-grid');
    if (!grid || !Array.isArray(items)) return;

    const fragment = document.createDocumentFragment();
    items.forEach((it) => {
      if (!it.thumbnail && !it.src) return;
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'gallery-item';
      btn.setAttribute('aria-label', `Open Instagram post by ${it.username}`);
      if (it.src) btn.dataset.full = it.src;
      const img = document.createElement('img');
      img.loading = 'lazy';
      img.width = 600;
      img.height = 400;
      img.src = it.thumbnail || it.src;
      img.alt = (it.caption || 'Instagram image').slice(0, 120);
      btn.appendChild(img);
      li.appendChild(btn);
      fragment.appendChild(li);
    });
    grid.appendChild(fragment);
  } catch (_) {
    // ignore
  }
}

const igEl=document.getElementById('insta-grid');
if (igEl) {
  const urlsAttr = igEl.getAttribute('data-ig-urls');
  if (urlsAttr && urlsAttr.trim()) {
    const urls = urlsAttr.split(/\s+/).filter(Boolean);
    loadInstagramSpecific(urls);
  } else {
    loadInstagramGallery();
  }
}
  loadInstagramGallery();
}


async function loadInstagramSpecific(urls){
  try{
    const q = encodeURIComponent(urls.join(","));
    const r = await fetch(`/api/instagram?urls=${q}`);
    if(!r.ok) return;
    const { items } = await r.json();
    const grid = document.getElementById("insta-grid");
    if(!grid || !Array.isArray(items)) return;
    const frag = document.createDocumentFragment();
    items.forEach(it=>{
      if(!it.thumbnail && !it.src) return;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = it.permalink || 