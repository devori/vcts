import { Router } from 'express';
import priceFileDB from '../database/price-file-db'
import { VCTYPES_POLONIEX } from '../properties'
import logger from '../util/logger';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/:vcType?', (req, res) => {
  let priceDB = priceFileDB.load('poloniex');
  let result = {};
  if (req.params.vcType) {
    result[req.params.vcType] = priceDB.getLast(req.params.vcType);
  } else {
    VCTYPES_POLONIEX.forEach(vcType => {
      result[vcType] = priceDB.getLast(vcType);
    });
  }
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.json(result);
});

export default router;
