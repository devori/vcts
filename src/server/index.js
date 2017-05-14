import express from 'express';
import apiRouter from './route/api'

let app = express();

app.use('/api', apiRouter);

app.listen(3000, () => {
  console.log('Start Server on port 3000');
});
