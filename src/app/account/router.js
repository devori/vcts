import { Router } from 'express';
import account from './account';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/:accountId/assets', (req, res) => {
  res.json({
    code: 200,
    result: account.searchAssets(req.params.accountId)
  });
});

export default router;
