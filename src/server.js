import express from 'express';
import connectDB from './config/db.js';
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';

const app = express();
connectDB();

// const allowedOrigins = ['http://localhost:5173']

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.use(cors({origin: allowedOrigins, credentials: true}))

app.get('/', (req, res) => {
    res.send("App is working")
})

app.use('/api/auth', authRouter);
app.use('/api/user', userRouter)

app.listen(3000, () => {
    console.log("App is listening")
})