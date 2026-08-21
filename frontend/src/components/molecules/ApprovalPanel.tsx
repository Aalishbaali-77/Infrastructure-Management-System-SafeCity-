'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import StatusChip from '@/components/molecules/StatusChip';
import type { WorkflowState } from '@/types/workflow';

const stateLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  HOD_REVIEW: 'Pending HOD Review',
  DIR_REVIEW: 'Pending Director Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

interface ApprovalPanelProps {
  currentState: WorkflowState;
  onApprove?: (comment: string) => void;
  onReject?: (comment: string) => void;
  canAct?: boolean;
}

export default function ApprovalPanel({
  currentState,
  onApprove,
  onReject,
  canAct = true,
}: ApprovalPanelProps) {
  const [comment, setComment] = useState('');
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const isFinal = currentState === 'APPROVED' || currentState === 'REJECTED';

  const handleApprove = () => {
    onApprove?.(comment);
    setApproveOpen(false);
    setComment('');
  };

  const handleReject = () => {
    if (!comment.trim()) return;
    onReject?.(comment);
    setRejectOpen(false);
    setComment('');
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Approval Status</Typography>
        <StatusChip status={currentState} />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current stage: {stateLabels[currentState] ?? currentState}
      </Typography>

      {!isFinal && canAct && (
        <>
          <TextField
            label="Comment"
            multiline
            rows={2}
            fullWidth
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Add a comment (required for rejection)"
            sx={{ mb: 2 }}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => setApproveOpen(true)}
            >
              Approve
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => setRejectOpen(true)}
            >
              Reject
            </Button>
          </Stack>
        </>
      )}

      {isFinal && (
        <Typography variant="body2" color="text.secondary">
          This workflow has reached a final state.
        </Typography>
      )}

      {/* Approve Confirmation Dialog */}
      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)}>
        <DialogTitle>Confirm Approval</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this item and advance it to the next stage?
          </Typography>
          {comment && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Comment: &quot;{comment}&quot;
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApproveOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove}>
            Confirm Approve
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)}>
        <DialogTitle>Confirm Rejection</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reject this item and return it for revision?
          </Typography>
          {!comment.trim() && (
            <Typography variant="body2" color="error" sx={{ mt: 1 }}>
              ⚠️ A comment is required for rejection.
            </Typography>
          )}
          {comment && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Reason: &quot;{comment}&quot;
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={!comment.trim()}
          >
            Confirm Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
