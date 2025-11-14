# 🍽️ Restaurant Management System

> A comprehensive, production-ready restaurant management solution built with modern web technologies. Streamline operations, manage orders, track revenue, and optimize your restaurant's workflow with real-time updates and role-based access control.

[![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?logo=node.js)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19.1-47A248?logo=mongodb)](https://www.mongodb.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)

---

## ✨ Features

### 🎯 Core Functionality
- **Multi-Role System**: Admin, Manager, Waiter, Cashier, and Kitchen staff with granular permissions
- **Real-Time Order Management**: Live order tracking with Socket.io for instant updates
- **Table Management**: Smart table assignment, merging, and status tracking
- **Menu Management**: Dynamic menu with categories, pricing, availability, and image uploads
- **Revenue Analytics**: Comprehensive dashboards with daily, monthly, and yearly reports
- **Expense Tracking**: Complete expense management with categorization and approval workflows
- **Parcel Orders**: Support for takeaway and delivery orders with separate billing
- **Branch Management**: Multi-branch support with branch-specific data isolation

### 🔒 Security & Performance
- **Enterprise-Grade Security**: Helmet.js security headers, rate limiting, input sanitization
- **JWT Authentication**: Secure token-based auth with httpOnly cookies
- **NoSQL Injection Protection**: Custom sanitization middleware
- **Optimized Database Queries**: N+1 query fixes, comprehensive indexing
- **Request Rate Limiting**: Protection against brute force and DDoS attacks
- **Error Handling**: Production-ready error handling with structured logging
- **File Upload Validation**: Secure image uploads with type and size validation

### 📊 Analytics & Reporting
- **Revenue Dashboards**: Interactive charts and graphs for revenue analysis
- **Order Statistics**: Real-time order status tracking and analytics
- **Top Items Reports**: Best-selling items and performance metrics
- **Profit Trends**: Visual profit trend analysis over time
- **Custom Date Ranges**: Flexible reporting with date range filters

### 🎨 User Experience
- **Modern UI**: Built with Tailwind CSS and Framer Motion for smooth animations
- **Responsive Design**: Fully responsive across all devices
- **Real-Time Updates**: Live order status updates without page refresh
- **Intuitive Navigation**: Role-based dashboards tailored to each user type
- **Toast Notifications**: User-friendly feedback for all actions

---

## 🛠️ Tech Stack

### Frontend
- **React 19.1.1** - Modern UI library
- **Vite 7.1.7** - Lightning-fast build tool
- **Tailwind CSS 4.1.14** - Utility-first CSS framework
- **React Router 7.9.4** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB & Mongoose 8.19.1** - Database and ODM
- **Socket.io 4.8.1** - Real-time server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Winston** - Structured logging
- **Cloudinary** - Image storage
- **Nodemailer** - Email service

### Security & Production
- **Helmet.js** - Security headers
- **Express Rate Limit** - Rate limiting
- **Custom Sanitization** - Input validation
- **Environment Validation** - Config validation
- **Graceful Shutdown** - Production-ready

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Cloudinary account (for image uploads)
- Email service credentials (for notifications)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/restaurant-management-system.git
   cd restaurant-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install server dependencies
   cd server && npm install
   
   # Install client dependencies
   cd ../client && npm install
   ```

3. **Configure environment variables**
   
   Create `server/.env`:
   ```env
   NODE_ENV=development
   PORT=3000
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters
   FRONTEND_URL=http://localhost:5173
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   SENDER_EMAIL=your_email@gmail.com
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   LOG_LEVEL=info
   ```
   
   Create `client/.env`:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start the development servers**
   ```bash
   # From root directory - starts both server and client
   npm start
   
   # Or start separately:
   # Terminal 1 - Server
   cd server && npm run dev
   
   # Terminal 2 - Client
   cd client && npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000
   - Health Check: http://localhost:3000/health

---

## 📁 Project Structure

```
restaurant-management-system/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Socket)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── layouts/        # Page layouts
│   │   ├── pages/          # Page components
│   │   ├── router/         # Route configuration
│   │   └── styles/         # Global styles
│   └── public/            # Static assets
│
├── server/                # Node.js backend application
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Custom middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── sockets/       # Socket.io handlers
│   │   └── utils/         # Utility functions
│   └── logs/              # Application logs
│
└── docs/                  # Documentation files
```

---

## 🔐 Security Features

This application implements enterprise-grade security measures:

- ✅ **Security Headers** (Helmet.js) - XSS protection, content type options, frame options
- ✅ **Rate Limiting** - Protection against brute force and DDoS attacks
- ✅ **Input Sanitization** - NoSQL injection prevention
- ✅ **JWT Security** - HttpOnly cookies, secure token storage
- ✅ **Password Hashing** - Bcrypt with salt rounds
- ✅ **CORS Configuration** - Environment-based origin whitelisting
- ✅ **File Upload Validation** - Type and size restrictions
- ✅ **Error Handling** - No stack traces in production
- ✅ **Environment Validation** - Required config validation on startup
- ✅ **Structured Logging** - Winston logger with log rotation

See [SECURITY_IMPROVEMENTS.md](./SECURITY_IMPROVEMENTS.md) for detailed security documentation.

---

## 🎭 User Roles & Permissions

### Admin
- Full system access
- User management
- Branch management
- Role and permission management
- Complete revenue and expense reports
- System configuration

### Manager
- Branch-level management
- Menu management
- Order oversight
- Table management
- Expense management
- Revenue reports

### Waiter
- Create and manage orders
- Table assignment
- Order status updates
- View assigned orders

### Cashier
- Process payments
- Generate bills
- Handle parcel orders
- Manage pending bills

### Kitchen Staff (Chef)
- View order queue
- Update order status
- Kitchen workflow management

---

## 📊 Key Features in Detail

### Real-Time Order Management
- Live order updates across all devices
- Kitchen queue with priority management
- Order status tracking (placed → in-kitchen → ready → served)
- Item-level status tracking for complex orders

### Revenue Analytics
- Interactive dashboards with charts
- Daily, monthly, and yearly reports
- Profit trend analysis
- Top-selling items tracking
- Revenue breakdown by category

### Table Management
- Visual table layout
- Table status tracking (available, occupied, reserved)
- Table merging for large parties
- Order history per table

### Menu Management
- Dynamic menu with categories
- Image uploads via Cloudinary
- Availability toggling
- Price management
- Cooking time estimation

---

## 🧪 Testing

Comprehensive testing guides are available:

- [Quick Test Guide](./QUICK_TEST.md) - 5-minute verification
- [Browser Testing Guide](./BROWSER_TESTING.md) - Browser DevTools testing
- [Full Testing Guide](./TESTING_GUIDE.md) - Comprehensive test suite

---

## 📈 Performance Optimizations

- **Database Indexing**: Optimized queries with strategic indexes
- **Query Optimization**: N+1 query fixes, batch operations
- **Pagination**: Efficient data loading with limits
- **Caching Ready**: Architecture supports Redis integration
- **Connection Pooling**: Optimized database connections

---

## 🚢 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set secure JWT secret (min 32 characters)
4. Configure production frontend URL
5. Set up SSL/HTTPS certificates
6. Configure email service
7. Set up Cloudinary for image storage

### Build for Production
```bash
# Build client
cd client && npm run build

# The build output will be in client/dist/
```

### Recommended Production Practices
- Use PM2 or similar process manager
- Set up reverse proxy (Nginx)
- Enable HTTPS
- Configure database backups
- Set up monitoring and alerting
- Use CDN for static assets
- Implement Redis caching
- Set up CI/CD pipeline

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the ISC License.

---

## 👨‍💻 Authors

- **Osman Bin Nasir**
- **Abdul Razzaq**

---

## 💼 For Business Inquiries

Looking for a custom restaurant management solution or need help implementing this system?

**I'm available for freelance projects!**

- 🎯 Custom feature development
- 🔧 System integration
- 🚀 Deployment and setup
- 📱 Mobile app development
- 🎨 UI/UX customization
- 📊 Analytics and reporting enhancements

**Contact me:**
- 📧 Email: arrazzaq7860@gmail.com
- 💼 LinkedIn: https://www.linkedin.com/in/abdulrazzaq27/
- 🌐 Portfolio: -
- 💬 Let's discuss your project requirements!

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Security best practices from OWASP
- Inspired by real-world restaurant operations
- Community feedback and contributions

---

## ⭐ Show Your Support

If you find this project helpful, please give it a ⭐ on GitHub!

---

**Built with ❤️ for the restaurant industry**

