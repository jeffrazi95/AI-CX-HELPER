import React, { useState } from 'react';
import { Container, Typography, Button, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Link } from 'react-router-dom';

const agents = [
  { id: 'sakinah', name: 'Sakinah' },
  { id: 'dhamirah', name: 'Dhamirah' },
  { id: 'arfiah', name: 'Arfiah' },
  { id: 'syahir', name: 'Syahir' },
  { id: 'melody', name: 'Melody' },
];

function ModeSelectionPage() {
  const [selectedAgent, setSelectedAgent] = useState('');

  return (
    <Container maxWidth="sm" sx={{ height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to Hello
      </Typography>
      <FormControl fullWidth sx={{ maxWidth: '300px' }}>
        <InputLabel id="agent-select-label">Select Agent</InputLabel>
        <Select
          labelId="agent-select-label"
          id="agent-select"
          value={selectedAgent}
          label="Select Agent"
          onChange={(e) => setSelectedAgent(e.target.value)}
        >
          {agents.map((agent) => (
            <MenuItem key={agent.id} value={agent.id}>
              {agent.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Button variant="contained" color="primary" size="large" component={Link} to={`/assist?agent=${selectedAgent}`}
          disabled={!selectedAgent}>
          Assist Me
        </Button>
        <Button variant="contained" color="secondary" size="large" component={Link} to={`/assessment?agent=${selectedAgent}`}
          disabled={!selectedAgent}>
          Do Assessment
        </Button>
      </Box>
      <Button variant="contained" color="secondary" component={Link} to="/assessment/dashboard"> {/* Changed to contained secondary */}
        View Assessment Dashboard
      </Button>
    </Container>
  );
}

export default ModeSelectionPage;