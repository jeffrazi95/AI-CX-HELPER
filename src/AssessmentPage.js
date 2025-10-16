
import React, { useState, useEffect } from 'react';
import { Container, Typography, Button, Box, TextField, CircularProgress, Alert, Paper, Select, MenuItem, FormControl, InputLabel, Modal } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function AssessmentPage({ agentId }) {
  const navigate = useNavigate();
  const [scenarios, setScenarios] = useState([]);
  const [agentReplies, setAgentReplies] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assessmentResults, setAssessmentResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

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
      console.log("AssessmentPage loaded for agent:", agentId, "for week:", selectedWeek);
      const fetchScenarios = async () => {
        try {
          const response = await fetch('/api/get_assessment_scenarios');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          setScenarios(data);
          // Initialize agent replies state
          const initialReplies = {};
          data.forEach(scenario => {
            initialReplies[scenario.id] = '';
          });
          setAgentReplies(initialReplies);
        } catch (err) {
          console.error("Error fetching scenarios:", err);
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchScenarios();
    }
  }, [agentId, selectedWeek]);

  const handleReplyChange = (scenarioId, value) => {
    setAgentReplies(prev => ({ ...prev, [scenarioId]: value }));
  };

  const handleSubmitAssessment = async () => {
    setIsSubmitting(true);
    setAssessmentResults([]); // Clear previous results
    setSubmitted(false);

    if (!selectedWeek) {
      alert("Please select a week for the assessment.");
      setIsSubmitting(false);
      return;
    }

    const results = [];
    for (const scenario of scenarios) {
      const reply = agentReplies[scenario.id];
      if (!reply) {
        alert(`Please provide a reply for Scenario ${scenario.id}.`);
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await fetch('/api/submit_assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            agent_id: agentId,
            scenario_id: scenario.id,
            agent_reply: reply,
            week: selectedWeek, // Include selected week
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        results.push({ scenarioId: scenario.id, ...data.result });
      } catch (err) {
        console.error(`Error submitting assessment for Scenario ${scenario.id}:`, err);
        setError(err.message);
        setIsSubmitting(false);
        return;
      }
    }
    setAssessmentResults(results);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ padding: '2rem', textAlign: 'center' }}>
        <CircularProgress />
        <Typography>Loading scenarios...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ padding: '2rem' }}>
        <Alert severity="error">Error loading assessment scenarios: {error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ padding: '2rem' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Assessment for {agentId ? agentId.charAt(0).toUpperCase() + agentId.slice(1) : 'Agent'}
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/')} sx={{ color: 'white', borderColor: 'white' }}>
          Back
        </Button>
      </Box>

      <FormControl sx={{ m: 1, minWidth: 120 }} size="small">
        <InputLabel id="week-select-label">Week</InputLabel>
        <Select
          labelId="week-select-label"
          id="week-select"
          value={selectedWeek}
          label="Week"
          onChange={(e) => setSelectedWeek(e.target.value)}
        >
          {availableWeeks.map((week) => (
            <MenuItem key={week} value={week}>
              {week}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {!submitted ? (
        <>
          {scenarios.map((scenario) => (
            <Box key={scenario.id} sx={{ marginBottom: '2rem' }}>
              <Typography variant="h6" gutterBottom>
                Scenario {scenario.id}: {scenario.title}
              </Typography>
              <Typography variant="body1" sx={{ marginBottom: '0.5rem' }}>
                Client Message: {scenario.client_message}
              </Typography>
              {scenario.image_path && (
                <Box sx={{ marginBottom: '1rem' }}>
                  <img 
                    src={process.env.PUBLIC_URL + scenario.image_path} 
                    alt={`Scenario ${scenario.id}`} 
                    style={{ maxWidth: '100px', height: 'auto', cursor: 'pointer' }} 
                    onClick={() => handleImageClick(process.env.PUBLIC_URL + scenario.image_path)} 
                  />
                </Box>
              )}
              <TextField
                fullWidth
                multiline
                rows={5}
                variant="outlined"
                placeholder="Your reply to this scenario..."
                value={agentReplies[scenario.id]}
                onChange={(e) => handleReplyChange(scenario.id, e.target.value)}
                sx={{ marginBottom: '1rem' }}
              />
            </Box>
          ))}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="contained" color="primary" onClick={handleSubmitAssessment} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Assessment'}
            </Button>
          </Box>
        </>
      ) : (
        <Box sx={{ marginTop: '2rem' }}>
          <Typography variant="h5" gutterBottom>Assessment Results for {selectedWeek}</Typography>
          {assessmentResults.map((result, index) => (
            <Paper key={index} elevation={2} sx={{ padding: '1.5rem', marginBottom: '1rem' }}>
              <Typography variant="h6">Scenario {result.scenario_id}</Typography>
              <Typography variant="body1" component="div">
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Your Reply:</Typography> {result.agent_reply}
              </Typography>
              <Typography variant="body1" component="div">
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Score:</Typography> {result.score}/100
              </Typography>
              <Typography variant="body1" component="div">
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Good Points:</Typography>
                {result.feedback.good_points.map((point, i) => (
                  <div key={i}>{point}</div>
                ))}
              </Typography>
              <Typography variant="body1" component="div">
                <Typography component="span" sx={{ fontWeight: 'bold' }}>Needs Improvement:</Typography>
                {result.feedback.needs_improvement.map((point, i) => (
                  <div key={i}>{point}</div>
                ))}
              </Typography>
            </Paper>
          ))}
          <Button variant="contained" onClick={() => setSubmitted(false)}>Retake Assessment</Button>
        </Box>
      )}

      <Modal
        open={!!selectedImage}
        onClose={handleCloseModal}
        aria-labelledby="image-modal-title"
        aria-describedby="image-modal-description"
      >
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4 
        }}>
          <img src={selectedImage} alt="Full size" style={{ maxWidth: '90vw', maxHeight: '90vh' }} />
        </Box>
      </Modal>

    </Container>
  );
}

export default AssessmentPage;
