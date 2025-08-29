import app from './app.js';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Badge Generator API running on http://localhost:${PORT}`);
    console.log(`Endpoint: POST http://localhost:${PORT}/api/badge/generate`);
});
