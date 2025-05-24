import React, { useState } from "react";
import axios from "axios";
import { 
  TextField, 
  Button, 
  Typography, 
  Grid, 
  Card, 
  CardContent,
  CardActions,
  CircularProgress,
  Container,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from "@mui/material";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [company, setCompany] = useState("");
  const [filings, setFilings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedForm, setSelectedForm] = useState("all");

  const availableForms = [
    { value: 'all', label: 'All Forms' },
    { value: '10-K', label: 'Annual Report (10-K)' },
    { value: '10-Q', label: 'Quarterly Report (10-Q)' },
    { value: '8-K', label: 'Current Report (8-K)' },
    { value: '20-F', label: 'Foreign Annual Report (20-F)' },
    { value: 'DEF 14A', label: 'Proxy Statement' },
    { value: '10-K/A', label: 'Annual Report Amendment' },
    { value: '10-Q/A', label: 'Quarterly Report Amendment' }
  ];

  const getFormDescription = (formType) => {
    const formDescriptions = {
      '10-K': 'Annual Report',
      '10-Q': 'Quarterly Report',
      '8-K': 'Current Report',
      '6-K': 'Foreign Issues Report',
      '20-F': 'Foreign Annual Report',
      'S-1': 'Initial Registration',
      '424B': 'Prospectus',
      'DEF 14A': 'Proxy Statement',
      '10-K/A': 'Annual Report Amendment',
      '10-Q/A': 'Quarterly Report Amendment',
      '8-K/A': 'Current Report Amendment',
      'F-1': 'Foreign Registration Statement',
      'F-4': 'Foreign Merger Registration'
    };
    return formDescriptions[formType] || formType;
  };

  const handleFilingClick = (filing) => {
    const formattedAccession = filing.accessionNumber.replace(/-/g, '');
    const urls = [
      `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${formattedAccession}/${filing.accessionNumber}-index.html`,
      `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${formattedAccession}/${filing.accessionNumber}.htm`,
      `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${formattedAccession}/${filing.description}`,
      `https://www.sec.gov/Archives/edgar/data/${filing.cik}/${formattedAccession}/${filing.accessionNumber}.txt`
    ];
    window.open(urls[0], '_self');
  };

  const filterFilings = (filings) => {
    return filings.filter(filing => {
      const filingDate = new Date(filing.filingDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      const formMatch = selectedForm === 'all' || filing.form === selectedForm;

      if (start && end) {
        return filingDate >= start && filingDate <= end && formMatch;
      } else if (start) {
        return filingDate >= start && formMatch;
      } else if (end) {
        return filingDate <= end && formMatch;
      }
      return formMatch;
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    try {
      const resCIK = await axios.get(`${API_URL}/cik-lookup`, {
        params: { name: company }
      });

      const cik = resCIK.data.cik;
      const paddedCik = cik.padStart(10, '0');

      const resFiling = await axios.get(
        `https://data.sec.gov/submissions/CIK${paddedCik}.json`,
        {
          headers: {
            'User-Agent': 'Your Company Name (your.email@domain.com)'
          }
        }
      );

      const filingData = resFiling.data.filings.recent;
      const combinedFilings = filingData.form.map((form, index) => ({
        form,
        filingDate: filingData.filingDate[index],
        accessionNumber: filingData.accessionNumber[index],
        description: filingData.primaryDocument[index],
        cik: cik
      }));

      const filteredFilings = filterFilings(combinedFilings);
      setFilings(filteredFilings);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching company data");
      setFilings([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: filings.length === 0 ? 'center' : 'flex-start',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: filings.length > 0 ? 4 : 0
          }}
        >
          <Typography variant="h4" gutterBottom align="center">
            SEC Company Filings Search
          </Typography>
          
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{ mb: 4 }} 
            align="center"
          >
            Enter company name or ticker symbol and optional date range
          </Typography>

          <Grid 
            container 
            spacing={2} 
            alignItems="center" 
            justifyContent="center"
            sx={{ maxWidth: 900 }}
          >
            <Grid item xs={12} sm={3}>
              <TextField
                label="Enter Company Name or Ticker"
                variant="outlined"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                fullWidth
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel id="form-filter-label">Form Type</InputLabel>
                <Select
                  labelId="form-filter-label"
                  value={selectedForm}
                  label="Form Type"
                  onChange={(e) => setSelectedForm(e.target.value)}
                >
                  {availableForms.map((form) => (
                    <MenuItem key={form.value} value={form.value}>
                      {form.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                fullWidth
                disabled={loading || !company.trim()}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Search"}
              </Button>
            </Grid>
          </Grid>

          {error && (
            <Typography color="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Typography>
          )}
        </Box>

        {filings.length > 0 && (
          <Grid container spacing={2}>
            {filings.map((filing, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  '&:hover': { boxShadow: 6 }
                }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" color="primary" gutterBottom>
                      {getFormDescription(filing.form)}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Form {filing.form}
                    </Typography>
                    <Typography color="textSecondary" gutterBottom>
                      Filed: {new Date(filing.filingDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {filing.description.split('.')[0]}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button 
                      variant="contained" 
                      size="small" 
                      color="primary"
                      startIcon={<OpenInNewIcon />}
                      onClick={() => handleFilingClick(filing)}
                      sx={{ ml: 1, mb: 1 }}
                    >
                      View Filing
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}

export default App;