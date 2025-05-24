const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// CIK lookup endpoint
app.get('/cik-lookup', async (req, res) => {
  try {
    if (!req.query.name) {
      return res.status(400).json({ error: "Company name is required" });
    }    const response = await axios.get(
      'https://www.sec.gov/files/company_tickers.json',
      {
        headers: {
          'User-Agent': process.env.SEC_USER_AGENT || 'SEC Filings Search (open-source-project)'
        }
      }
    );

    const companies = Object.values(response.data);
    const searchTerm = req.query.name.toLowerCase();
    
    const company = companies.find(c => 
      c.title.toLowerCase().includes(searchTerm) || 
      c.ticker.toLowerCase() === searchTerm
    );

    if (company) {
      const cik = company.cik_str.toString();
      res.json({ 
        cik: cik, 
        companyName: company.title,
        ticker: company.ticker 
      });
    } else {
      res.status(404).json({ 
        error: "Company not found",
        message: "Please check the company name or ticker symbol and try again"
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: "Server error", 
      message: "An unexpected error occurred"
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});