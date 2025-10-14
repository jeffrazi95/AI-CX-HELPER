import React, { useState, useEffect, useRef } from 'react';
import { Container, TextField, Button, Typography, Box, Paper, Grid, IconButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';
import SendIcon from '@mui/icons-material/Send';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import SettingsIcon from '@mui/icons-material/Settings';
import GuidelineManager from './GuidelineManager';

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
  const [prompt, setPrompt] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([
    { type: 'ai', content: `Hello ${agentId || 'CX'}, how can I help you today?` },
  ]);
  const [showGuidelineManager, setShowGuidelineManager] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [conversationHistory]);

  useEffect(() => {
    console.log("AICXHelperInterface loaded for agent:", agentId);
  }, [agentId]);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleSendPrompt = async () => {
    if (!prompt && !selectedFile) return;

    setIsLoading(true);
    const userMessage = { type: 'user', content: prompt || (selectedFile ? selectedFile.name : '') };
    setConversationHistory((prev) => [...prev, userMessage]);

    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('context', ""); // Context is still empty for now
    if (selectedFile) {
      formData.append('file', selectedFile);
    }

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
      setSelectedFile(null);
    }
  };

  const handleSelectReply = (replyContent) => {
    const userChoice = { type: 'user', content: `Selected reply: ${replyContent}` };
    setConversationHistory((prev) => [...prev, userChoice]);
    // In a real app, this choice would be sent to the backend for learning
  };

  return (
    <Container maxWidth="md" sx={{ height: '90vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Typography variant="h5" component="h1">
          Hello
        </Typography>
        <IconButton color="inherit" size="small" onClick={() => setShowGuidelineManager(!showGuidelineManager)}>
          <SettingsIcon />
        </IconButton>
      </Box>

      {showGuidelineManager && <GuidelineManager />}

      {!showGuidelineManager && (
        <>
          <Box ref={chatHistoryRef} sx={{ flexGrow: 1, overflowY: 'auto', padding: '0.8rem', border: '1px solid #444', borderRadius: '8px', marginBottom: '0.8rem', backgroundColor: '#222' }}>
            {conversationHistory.map((msg, index) => (
              <Box key={index} sx={{ display: 'flex', justifyContent: msg.type === 'user' ? 'flex-end' : 'flex-start', marginBottom: '0.4rem' }}>
                <Paper sx={{
                  padding: '0.4rem 0.8rem',
                  maxWidth: '75%',
                  backgroundColor: msg.type === 'user' ? '#1976d2' : '#333',
                  color: 'white',
                  borderRadius: '12px',
                  borderBottomLeftRadius: msg.type === 'user' ? '12px' : '4px',
                  borderBottomRightRadius: msg.type === 'user' ? '4px' : '12px',
                  fontSize: '0.875rem',
                }}>
                  {typeof msg.content === 'string' ? (
                    <Typography variant="body2">{msg.content}</Typography>
                  ) : (
                    msg.content
                  )}
                </Paper>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
            <TextField
              fullWidth
              multiline
              variant="outlined"
              placeholder="Enter your prompt or client message..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#333', padding: '8px 12px' } }}
              InputProps={{ style: { fontSize: '0.875rem' } }}
              disabled={isLoading}
            />
            <IconButton component="label" color="primary" size="small" disabled={isLoading} sx={{ color: '#f50057' }}>
              <UploadFileIcon fontSize="small" />
              <VisuallyHiddenInput type="file" onChange={handleFileChange} />
            </IconButton>
            <Button variant="contained" endIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />} onClick={handleSendPrompt} disabled={isLoading || (!prompt && !selectedFile)} size="small">
              Send
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

export default AICXHelperInterface;