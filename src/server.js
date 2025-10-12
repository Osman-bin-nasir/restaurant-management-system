import express from 'express'
import connectDB from './config/db.js'

const app = express()
connectDB();

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000, () => {
  console.log("App is listening on port 3000");
})