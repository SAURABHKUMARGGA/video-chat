import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

router.get("/", (req, res) => {
    res.sendFile(join(__dirname, "../ui/index.html"));
});

export default router;