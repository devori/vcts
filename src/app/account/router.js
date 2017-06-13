import { Router } from 'express';
import account from './account';
import logger from '../util/logger';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/:accountId/history/:vcType?', (req, res) => {
  let history = account.searchHistory(req.params.accountId, req.params.vcType);
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.json(history || []);
});

export default router;
