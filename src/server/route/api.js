import { Router } from 'express';
import webdriver from '../webdriver/webdriver';

let router = Router();
router.use((req, res, next) => {
  next();
});

router.get('/browser', (req, res) => {
  console.log('Called:', '/ for get');
  let browser = webdriver.open('chrome');
  res.send('Hello Browser');
});

router.delete('/browser', (req, res) => {
  console.log('Called', '/ for delete');
  webdriver.close('chrome');
})

export default router;
