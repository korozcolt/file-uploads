import app from './app';

const port = process.env.PORT || 5500;

app.listen(Number(port), () => {
  console.log(`Server listening on port ${port}`);
});
