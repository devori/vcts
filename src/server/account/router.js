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

router.post('/:accountId/assets/:vcType', (req, res) => {
  res.json({
    code: 200,
    result: account.addAsset(req.params.accountId, req.params.vcType, req.body)
  });
});

router.delete('/:accountId/assets/:vcType/:assetId', (req, res) => {
  res.json({
    code: 200,
    result: account.removeAsset(req.params.accountId, req.params.vcType, req.params.assetId)
  });
});

export default router;
