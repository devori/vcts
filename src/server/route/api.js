import { Router } from 'express';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/', (req, res) => {
  console.log('Called:', '/');
  res.send('Hello API');
});

export default router;
