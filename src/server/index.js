import express from 'express';

let app = express();

app.get('/', (req, res) => {
  res.send('Hello world!');
});

app.listen(3000, () => {
  console.log('Start Server on port 3000');
})
