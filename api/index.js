const express = require('express');
const { createPaste, getPaste } = require('./dao');
const app = express();

app.use(express.json());


// Shared CSS for consistent styling across pages
const commonStyles = `
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f9; color: #333; display: flex; justify-content: center; padding-top: 50px; margin: 0; }
    .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 100%; max-width: 600px; }
    h1 { margin-top: 0; color: #2c3e50; }
    textarea { width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-family: monospace; font-size: 14px; resize: vertical; box-sizing: border-box; }
    .controls { display: flex; gap: 10px; margin-top: 15px; }
    input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
    button { background-color: #0070f3; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.2s; }
    button:hover { background-color: #0051a2; }
    .result { margin-top: 20px; padding: 15px; background: #e6fffa; border: 1px solid #b2f5ea; color: #234e52; border-radius: 4px; display: none; word-break: break-all; }
    pre { background: #2d2d2d; color: #f8f8f2; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; font-size: 14px; }
    .meta { margin-top: 10px; font-size: 0.9rem; color: #666; border-top: 1px solid #eee; padding-top: 10px; }
    .error { color: #e00; background: #fff5f5; border: 1px solid #feb2b2; padding: 1rem; border-radius: 4px; text-align: center; }
  </style>
`;


// API Routes
// Health Check
app.get('/api/healthz', (req, res) => res.json({ ok: true }));

// Create Paste
app.post('/api/pastes', async (req, res) => {
  try {
    const { content, ttl_seconds, max_views } = req.body;
    if (!content) return res.status(400).json({ error: 'Content required' });

    const id = await createPaste(content, ttl_seconds, max_views, req);
    
    // Construct full URL
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    res.json({ id, url: `${protocol}://${host}/p/${id}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// View Routes (HTML)
// View Paste Page
app.get('/p/:id', async (req, res) => {
  const paste = await getPaste(req.params.id, req);
  
  if (!paste) {
    return res.status(404).send(`
      <html>
        <head><title>404 Not Found</title>${commonStyles}</head>
        <body>
          <div class="container error">
            <h1>😕 Paste Not Found</h1>
            <p>This paste either never existed, has expired, or the view limit was reached.</p>
            <a href="/" style="color: #0070f3; text-decoration: none;">&larr; Create a new paste</a>
          </div>
        </body>
      </html>
    `);
  }

  const safeContent = paste.content.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  
  // Show remaining views if applicable
  const viewsInfo = paste.max_views 
    ? `<span>Views used: <strong>${paste.views_used} / ${paste.max_views}</strong></span>` 
    : `<span>Views used: <strong>${paste.views_used}</strong></span>`;

  res.send(`
    <html>
      <head>
        <title>View Paste</title>
        ${commonStyles}
      </head>
      <body>
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
             <h1>Paste Content</h1>
             <a href="/" style="text-decoration:none; color:#0070f3; font-size:0.9rem;">+ New Paste</a>
          </div>
          <pre>${safeContent}</pre>
          <div class="meta">
            ${viewsInfo}
          </div>
        </div>
      </body>
    </html>
  `);
});

// Home Page (Create)
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Pastebin Lite</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${commonStyles}
      </head>
      <body>
        <div class="container">
          <h1>📝 New Paste</h1>
          <p style="margin-bottom: 15px; color: #666;">Share text safely with optional expiration.</p>
          
          <textarea id="content" rows="10" placeholder="Paste your text here..."></textarea>
          
          <div class="controls">
            <input id="ttl" type="number" placeholder="TTL (seconds, e.g. 60)" min="1">
            <input id="views" type="number" placeholder="Max Views (e.g. 5)" min="1">
          </div>
          
          <div style="margin-top: 15px; text-align: right;">
             <button onclick="save()" id="saveBtn">Create Paste</button>
          </div>

          <div id="result" class="result"></div>
        </div>

        <script>
          async function save() {
            const btn = document.getElementById('saveBtn');
            const resultDiv = document.getElementById('result');
            
            // Disable button
            btn.disabled = true;
            btn.innerText = 'Creating...';
            resultDiv.style.display = 'none';

            const content = document.getElementById('content').value;
            const ttl = document.getElementById('ttl').value;
            const views = document.getElementById('views').value;

            try {
              const res = await fetch('/api/pastes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  content, 
                  ttl_seconds: ttl ? parseInt(ttl) : undefined,
                  max_views: views ? parseInt(views) : undefined
                })
              });
              
              const data = await res.json();
              
              if (res.ok) {
                resultDiv.style.display = 'block';
                resultDiv.style.background = '#e6fffa';
                resultDiv.style.borderColor = '#b2f5ea';
                resultDiv.style.color = '#234e52';
                resultDiv.innerHTML = '<strong>Success!</strong> Your paste is ready:<br><br><a href="' + data.url + '" target="_blank" style="color:#0070f3; word-break:break-all;">' + data.url + '</a>';
              } else {
                throw new Error(data.error || 'Unknown error');
              }
            } catch (err) {
              resultDiv.style.display = 'block';
              resultDiv.style.background = '#fff5f5';
              resultDiv.style.borderColor = '#feb2b2';
              resultDiv.style.color = '#c53030';
              resultDiv.innerText = 'Error: ' + err.message;
            } finally {
              btn.disabled = false;
              btn.innerText = 'Create Paste';
            }
          }
        </script>
      </body>
    </html>
  `);
});

// Local Start
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running locally on http://localhost:${PORT}`);
  });
}

module.exports = app;
