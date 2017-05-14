import { Router } from 'express';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/accounts/:id', (req, res) => {
  res.send(`Called /start/${req.params.id}`);
});

router.get('/stop', (req, res) => {
  res.send('Called /stop');
})

export default router;
