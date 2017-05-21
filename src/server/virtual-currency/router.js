import { Router } from 'express';
import vc from '../virtual-currency/virtual-currency';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/:vc', (req, res) => {
  res.json({
    code: 200,
    result: vc.search(req.params.vc, req.query)
  });
});

router.post('/:vc', (req, res) => {
  res.json({
    code: 200,
    result: vc.add(req.params.vc, req.body)
  });
});

router.delete('/:vc', (req, res) => {
  res.json({
    code: 200,
    result: vc.remove(req.params.vc, req.query)
  });
});

export default router;
