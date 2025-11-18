// src/pages/FosterRequest.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Box,
  Typography
} from '@mui/material';

interface FosterRequestProps {
  open: boolean;
  onClose: () => void;
  listingId: string;
  petName: string;
  onSuccess: () => void;
}

const FosterRequest: React.FC<FosterRequestProps> = ({
  open,
  onClose,
  listingId,
  petName,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/foster/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId,
          message
        }),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        setMessage('');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to submit foster request');
      }
    } catch (err) {
      setError('Error submitting foster request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Request to Foster {petName}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Typography variant="body2" color="text.secondary" paragraph>
            Tell the lister why you'd be a great foster parent for {petName}.
          </Typography>

          <TextField
            autoFocus
            label="Your Message"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Share information about your experience with pets, your home environment, and why you want to foster this pet..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading || !message.trim()}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FosterRequest;