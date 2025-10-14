import React, { useState } from 'react';
import { Button, Typography, Box, Paper, TextField } from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

function GuidelineManager() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [guidelineText, setGuidelineText] = useState('');

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file.');
      setSelectedFile(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      alert(`Uploading ${selectedFile.name} for guideline ingestion.`);
      // In a real app, this would send the PDF to the backend for processing
      setSelectedFile(null);
    } else if (guidelineText) {
      alert('Ingesting text guidelines.');
      // In a real app, this would send the text to the backend for processing
      setGuidelineText('');
    } else {
      alert('No PDF file or text selected.');
    }
  };

  return (
    <Paper elevation={2} sx={{ padding: '1.5rem', marginTop: '1rem', backgroundColor: '#2a2a2a' }}> {/* Slightly lighter background */}
      <Typography variant="h6" component="h2" gutterBottom color="text.primary"> {/* Ensure title is visible */}
        Guideline Management
      </Typography>
      <Typography variant="body2" color="text.primary" sx={{ marginBottom: '1rem' }}> {/* Ensure text is visible */}
        Upload your CX guidelines in PDF format or input text directly for the AI to reference.
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        <Button
          component="label"
          role={undefined}
          variant="contained"
          size="small"
          tabIndex={-1}
          startIcon={<CloudUploadIcon />}
          color="secondary" // Changed color for visibility
        >
          Select PDF Guideline
          <VisuallyHiddenInput type="file" accept=".pdf" onChange={handleFileChange} />
        </Button>
        {selectedFile && (
          <Typography variant="body2" color="text.primary">
            Selected: {selectedFile.name}
          </Typography>
        )}
        <Typography variant="body2" align="center" color="text.primary">- OR -</Typography> {/* Ensure text is visible */}
        <TextField
          fullWidth
          multiline
          rows={4}
          variant="outlined"
          placeholder="Paste your guidelines here..."
          value={guidelineText}
          onChange={(e) => setGuidelineText(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#444', color: '#fff' } }}
          InputProps={{ style: { fontSize: '0.875rem' } }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleUpload}
          disabled={!selectedFile && !guidelineText}
          size="small"
        >
          Ingest Guideline
        </Button>
      </Box>
    </Paper>
  );
}

export default GuidelineManager;