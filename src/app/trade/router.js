import { Router } from 'express';
import trade from './trade';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.post('/:vcType', (req, res) => {
  trade.buy('test', req.params.vcType, null, req.body.units).then(result => {
    res.json({
      code: 200,
      result
    });
  });
});

router.delete('/:vcType', (req, res) => {
  trade.sell('test', req.params.vcType, null, req.body.units).then(result => {
    res.json({
      code: 200,
      result
    })
  }).catch(reason => {
    console.log(reason);
    res.json({
      code: 500,
      result: reason
    })
  });
});

router.get('/balance', (req, res) => {;
  trade.info('ALL').then(krw => {
    res.json({
      krw
    });
  }).catch(e => {
    res.send(e);
  });
});

export default router;
