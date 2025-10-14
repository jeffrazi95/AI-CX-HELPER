
import React, { useState, useEffect } from 'react';
import { Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert, OutlinedInput, Button, Box, IconButton } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';

function AssessmentDashboardPage() {
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showGraphView, setShowGraphView] = useState(true); // State to toggle between graph and table
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWeeks = async () => {
      try {
        const response = await fetch('/api/get_assessment_weeks');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableWeeks(data);
        if (data.length > 0) {
          setSelectedWeek(data[0]); // Select the first week by default
        }
      } catch (err) {
        console.error("Error fetching available weeks:", err);
        setError(err.message);
      }
    };
    fetchWeeks();
  }, []);

  useEffect(() => {
    if (selectedWeek) {
      const fetchResults = async () => {
        setIsLoading(true);
        try {
          const response = await fetch(`/api/get_assessment_results?week=${selectedWeek}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setAssessmentResults(data);
        } catch (err) {
          console.error("Error fetching assessment results:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResults();
    }
  }, [selectedWeek]);

  // Prepare data for the graph
  const graphData = assessmentResults.map(result => ({
    name: result.agent_id,
    score: result.score,
  }));

  if (isLoading && !error) {
    return (
      <Container maxWidth="lg" sx={{ padding: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <Typography color="text.primary">Loading assessment data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ padding: '2rem' }}>
        <Alert severity="error">Error loading assessment data: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ padding: '2rem' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Typography variant="h4" component="h1" gutterBottom color="text.primary">
          Assessment Dashboard
        </Typography>
        <IconButton color="inherit" onClick={() => navigate('/')}> {/* Close button for dashboard */}
          <CloseIcon />
        </IconButton>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <FormControl sx={{ m: 1, minWidth: 120 }} size="small" variant="outlined">
          <InputLabel id="week-select-label" sx={{ color: '#fff' }}>Week</InputLabel>
          <Select
            labelId="week-select-label"
            id="week-select"
            value={selectedWeek}
            label="Week"
            onChange={(e) => setSelectedWeek(e.target.value)}
            input={<OutlinedInput sx={{ color: '#fff', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' }, '& .MuiSvgIcon-root': { color: '#fff' } }} />} /* Use OutlinedInput for styling */
          >
            {availableWeeks.map((week) => (
              <MenuItem key={week} value={week} sx={{ color: '#fff', backgroundColor: '#444' }}>
                {week}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" color="primary" onClick={() => setShowGraphView(!showGraphView)}>
          {showGraphView ? 'Show Detail Breakdown' : 'Show Graph Summary'}
        </Button>
      </Box>

      {showGraphView ? (
        <Paper sx={{ padding: '1rem', backgroundColor: '#333' }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={graphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#555" />
              <XAxis dataKey="name" stroke="#fff" />
              <YAxis stroke="#fff" />
              <Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#444', border: 'none' }} itemStyle={{ color: '#fff' }} labelStyle={{ color: '#fff' }} />
              <Legend />
              <Bar dataKey="score" fill="#f50057" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem' }}> {/* Adjusted for single button */}
            <Button variant="contained" color="primary" onClick={() => setShowGraphView(true)}> {/* Back to Graph Summary */}
              Back to Graph Summary
            </Button>
          </Box>
          <TableContainer component={Paper} sx={{ marginTop: '1rem', backgroundColor: '#333' }}>
            <Table sx={{ minWidth: 650 }} aria-label="assessment table">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: '#fff' }}>Agent</TableCell>
                  <TableCell align="right" sx={{ color: '#fff' }}>Scenario ID</TableCell>
                  <TableCell align="right" sx={{ color: '#fff' }}>Score</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Good Points</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Needs Improvement</TableCell>
                  <TableCell sx={{ color: '#fff' }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assessmentResults.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: '#ccc' }}>No assessment results for this week.</TableCell>
                  </TableRow>
                ) : (
                  assessmentResults.map((row) => (
                    <TableRow
                      key={row.id}
                      sx={{ '&:last-child td, &:&:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" sx={{ color: '#fff' }}>
                        {row.agent_id}
                      </TableCell>
                      <TableCell align="right" sx={{ color: '#fff' }}>{row.scenario_id}</TableCell>
                      <TableCell align="right" sx={{ color: '#fff' }}>{row.score}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{row.feedback_good_points}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{row.feedback_needs_improvement}</TableCell>
                      <TableCell sx={{ color: '#fff' }}>{new Date(row.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
}

export default AssessmentDashboardPage;
