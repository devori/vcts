import { Router } from 'express';
import vc from '../vc/vc';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/accounts/:id', (req, res) => {
  vc.start(req.params.id);
  res.send(`Called /start/${req.params.id}`);
});

router.get('/stop', (req, res) => {
  vc.stop();
  res.send('Called /stop');
})

export default router;
