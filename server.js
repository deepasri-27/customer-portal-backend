const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const sapService = require('./services/login');
const profileService = require('./services/profile');
const inquiryRouter = require('./services/inquiry'); 
// const salesRoutes = require('./services/sales');
 const deliveryRoutes = require('./services/delivery');
// const agingRoutes = require('./services/aging');
// const cdmemoRoutes = require('./services/cdmemo');
// const overallSales = require('./services/overallSales');
// const invoiceRoute = require('./services/invoice');
// const invoiceDataRoutes = require('./services/invoicedata');


const app = express();
const cors = require('cors');
app.use(cors());

app.use(bodyParser.json());

app.post('/api/customer-login', async (req, res) => {
  const username = req.body.username?.trim();
  const password = req.body.password?.trim();
  console.log("hit");
  if (!username || !password) {
    return res.status(400).json({ status: false, message: 'Username and password are required' });
  }

  const result = await sapService.login(username, password);
  console.log(result);

  res.json(result);
});


app.use('/api',profileService);
app.use('/api', inquiryRouter);
// app.use('/api', salesRoutes);
 app.use('/api', deliveryRoutes);
// app.use('/api', agingRoutes);
// app.use('/api', cdmemoRoutes);
// app.use('/api', overallSales);
// app.use('/api', invoiceRoute);
// app.use('/api', invoiceDataRoutes);

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});