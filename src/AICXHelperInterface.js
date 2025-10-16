import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Typography, Box, Paper, Grid, IconButton, CircularProgress } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import GuidelineManager from './GuidelineManager';
import { useNavigate } from 'react-router-dom';

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

function AICXHelperInterface({ agentId }) {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([
    { type: 'ai', content: `Hello ${agentId || 'CX'}, how can I help you today?` },
  ]);
  const [showGuidelineManager, setShowGuidelineManager] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef(null);
  const theme = useTheme();

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    console.log("AICXHelperInterface loaded for agent:", agentId);
  }, [agentId]);

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedFiles.length > 5) {
      alert('You can only upload a maximum of 5 files.');
      return;
    }

    setSelectedFiles([...selectedFiles, ...files]);

    const newPreviews = files.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    }).filter(preview => preview !== null);

    setFilePreviews([...filePreviews, ...newPreviews]);
  };

  const handleSendPrompt = async () => {
    if (!prompt && selectedFiles.length === 0) return;

    setIsLoading(true);

    const messageContent = (
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Typography variant="body2">{prompt}</Typography>
        <Box>
          {filePreviews.map((preview, index) => (
            <img key={index} src={preview} alt={`Preview ${index}`} style={{ maxWidth: '100px', maxHeight: '100px', marginRight: '10px' }} />
          ))}
        </Box>
      </Box>
    );

    const userMessage = { type: 'user', content: messageContent };
    setConversationHistory((prev) => [...prev, userMessage]);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('context', ""); // Context is still empty for now
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('/api/generate_reply', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const aiResponseContent = (
        <Box>
          <Typography variant="body1" sx={{ marginBottom: '1rem' }}>Here are a few options based on your query and our guidelines:</Typography>
          <Paper elevation={1} sx={{ padding: '0.8rem', marginBottom: '0.5rem', backgroundColor: '#333' }}>
            <Typography variant="subtitle2" gutterBottom>AI Feedback:</Typography>
            <Typography variant="body2">Tone: {data.feedback.tone}</Typography>
            <Typography variant="body2">Solution Effectiveness: {data.feedback.solutionEffectiveness}</Typography>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>Suggestions:</Typography>
            <Box component="ul" sx={{ margin: 0, paddingLeft: '1.5rem' }}>
              {data.feedback.suggestions.map((s, i) => <li key={i}><Typography variant="body2">{s}</Typography></li>)}
            </Box>
          </Paper>
          <Typography variant="subtitle2" sx={{ mt: 1 }}>Choose a reply option:</Typography>
          <Grid container spacing={0.5} direction="column">
            {data.replies.map((reply, index) => (
              <Grid item key={index}>
                <Button variant="contained" color="primary" size="small" fullWidth onClick={() => handleSelectReply(reply)} sx={{ textTransform: 'none' }}>
                  {reply}
                </Button>
              </Grid>
            ))}
          </Grid>
        </Box>
      );

      const aiMessage = { type: 'ai', content: aiResponseContent };
      setConversationHistory((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error("Error sending prompt to backend:", error);
      setConversationHistory((prev) => [...prev, { type: 'ai', content: `Error: ${error.message}. Please ensure the backend server is running.` }]);
    } finally {
      setIsLoading(false);
      setPrompt('');
      setSelectedFiles([]);
      setFilePreviews([]);
    }
  };

  const handleSelectReply = (replyContent) => {
    const userChoice = { type: 'user', content: `Selected reply: ${replyContent}` };
    setConversationHistory((prev) => [...prev, userChoice]);
    // In a real app, this choice would be sent to the backend for learning
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', bgcolor: '#131314' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #444' }}>
        <Button variant="outlined" onClick={() => navigate('/')} sx={{ mr: 2, color: 'white', borderColor: 'white' }}>
          Back
        </Button>
        <Typography variant="h6" component="h1" sx={{ flexGrow: 1, color: 'white' }}>
          Assist Me
        </Typography>
        <IconButton color="inherit" size="small" onClick={() => setShowGuidelineManager(!showGuidelineManager)} sx={{ color: 'white' }}>
          <SettingsIcon />
        </IconButton>
      </Box>

      <Container maxWidth="md" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', py: 3 }}>
        {showGuidelineManager ? (
          <GuidelineManager />
        ) : (
          <>
            <Box ref={chatHistoryRef} sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
              {conversationHistory.map((msg, index) => (
                <Box key={index} sx={{ 
                  display: 'flex', 
                  justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', 
                  mb: 2 
                }}>
                  <Paper sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    bgcolor: msg.type === 'user' ? '#3367D6' : '#3C4043',
                    color: 'white',
                    borderRadius: '18px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {typeof msg.content === 'string' ? (
                      <Typography variant="body1">{msg.content}</Typography>
                    ) : (
                      msg.content
                    )}
                  </Paper>
                </Box>
              ))}
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #444' }}>
              {filePreviews.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                  {filePreviews.map((preview, index) => (
                    <img key={index} src={preview} alt={`Preview ${index}`} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                  ))}
                </Box>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#3C4043', borderRadius: '24px', p: 0.5 }}>
                <TextField
                  fullWidth
                  multiline
                  maxRows={5}
                  variant="standard"
                  placeholder="Enter a prompt here"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  sx={{
                    '& .MuiInputBase-root': {
                      color: 'white',
                      fontSize: '1rem',
                      p: '10px 20px',
                    },
                  }}
                  InputProps={{ disableUnderline: true }}
                  disabled={isLoading}
                />
                <IconButton component="label" disabled={isLoading} sx={{ color: '#9E9E9E' }}>
                  <UploadFileIcon />
                  <VisuallyHiddenInput type="file" multiple onChange={handleFileChange} />
                </IconButton>
                <IconButton onClick={handleSendPrompt} disabled={isLoading || (!prompt && selectedFiles.length === 0)} sx={{ color: '#8AB4F8' }}>
                  {isLoading ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                </IconButton>
              </Box>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
}

export default AICXHelperInterface;
