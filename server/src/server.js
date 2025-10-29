import express from 'express';
import connectDB from './config/db.js';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import cors from 'cors';

// All Routes
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';
import menuRouter from './routes/menuRoutes.js'
import errorHandler from './middleware/errorHandler.js';
import roleRoutes from "./routes/roleRoutes.js";
import permissionRoutes from "./routes/permissionRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import kitchenRoutes from "./routes/kitchenRoutes.js";
import cashierRoutes from "./routes/cashierRoutes.js";
import revenueRoutes from "./routes/revenueRoutes.js"
import expenseRoutes from "./routes/expenseRoutes.js";
import parcelOrderRoutes from "./routes/ParcelOrderRoutes.js";

// Import all models to ensure they are registered with Mongoose
import './models/Branch.js';
import './models/Expense.js';
import './models/Inventory.js';
import './models/MenuItem.js';
import './models/Order.js';
import './models/Permissions.js';
import './models/Report.js';
import './models/Role.js';
import './models/Table.js';
import './models/User.js';


const app = express();
connectDB();

const allowedOrigins = ['http://localhost:5173']

app.use(helmet());
app.use(mongoSanitize());
app.use(xss());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({origin: allowedOrigins, credentials: true}))

// Error Handler


app.get('/', (req, res) => {
    res.send("App is working")
})

app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/tables', tableRoutes);
app.use('/api/menu',menuRouter);
app.use('/api/orders',orderRoutes);
app.use('/api/parcel', parcelOrderRoutes);
app.use('/api/kitchen', kitchenRoutes);
app.use('/api/cashier', cashierRoutes);
app.use('/api/revenue', revenueRoutes);
app.use("/api/roles", roleRoutes);
app.use("/api/expenses", expenseRoutes);

app.use("/api/permissions", permissionRoutes);

app.use(errorHandler);

app.listen(process.env.PORT || 3000, () => {
    console.log("App is listening on port: 3000")
})