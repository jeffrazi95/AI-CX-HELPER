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
    <Container maxWidth="md" sx={{ height: '90vh', display: 'flex', flexDirection: 'column', padding: '1rem' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
        <Button variant="outlined" onClick={() => navigate('/')} sx={{ mr: 2, color: 'white', borderColor: 'white' }}>
          Back
        </Button>
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          Assist Me
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
                  padding: '1rem 1.5rem',
                  maxWidth: '75%',
                  backgroundColor: msg.type === 'user' ? theme.palette.primary.main : '#424242',
                  color: 'white',
                  borderRadius: '20px',
                  borderBottomLeftRadius: msg.type === 'user' ? '20px' : '5px',
                  borderBottomRightRadius: msg.type === 'user' ? '5px' : '20px',
                  fontSize: '1rem',
                  boxShadow: '0px 2px 5px rgba(0,0,0,0.1)'
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

          {filePreviews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              {filePreviews.map((preview, index) => (
                <img key={index} src={preview} alt={`Preview ${index}`} style={{ maxWidth: '100px', maxHeight: '100px' }} />
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
            <TextField
              fullWidth
              multiline
              variant="outlined"
              placeholder="Type your message..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              sx={{ 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: '20px',
                  backgroundColor: '#333',
                  padding: '10px 15px',
                  color: 'white'
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555'
                }
              }}
              InputProps={{ style: { fontSize: '1rem' } }}
              disabled={isLoading}
            />
            <IconButton component="label" color="primary" disabled={isLoading}>
              <UploadFileIcon />
              <VisuallyHiddenInput type="file" multiple onChange={handleFileChange} />
            </IconButton>
            <IconButton color="primary" onClick={handleSendPrompt} disabled={isLoading || (!prompt && selectedFiles.length === 0)}>
              {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
            </IconButton>
          </Box>
        </>
      )}
    </Container>
  );
}

export default AICXHelperInterface;
