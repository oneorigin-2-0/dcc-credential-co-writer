import express from 'express';
import cors from 'cors';
import { generateBadge } from './controllers/badgeController.js';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/badge/generate', generateBadge);

export default app;