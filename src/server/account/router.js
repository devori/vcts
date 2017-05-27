import { Router } from 'express';
import account from './account';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/:accountId/assets', (req, res) => {
  res.json({
    code: 200,
    result: account.searchTradingInfo(req.params.accountId)
  });
});

router.post('/:accountId/assets/:vcType', (req, res) => {
  res.json({
    code: 200,
    result: account.addVcTradingInfo(req.params.accountId, req.params.vcType, req.body)
  });
});

router.delete('/:accountId/assets/:vcType/:tradingId', (req, res) => {
  res.json({
    code: 200,
    result: account.removeVcTradingInfo(req.params.accountId, req.params.vcType, req.params.tradingId)
  });
});

export default router;
