'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import type { WorkflowHistory } from '@/types/workflow';

const stateLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  HOD_REVIEW: 'Pending HOD Review',
  DIR_REVIEW: 'Pending Director Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

interface WorkflowTimelineProps {
  history: WorkflowHistory;
}

export default function WorkflowTimeline({ history }: WorkflowTimelineProps) {
  const activeStep = history.steps.length - 1;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Approval Timeline
      </Typography>
      <Stepper activeStep={activeStep} orientation="vertical">
        {history.steps.map((step, index) => (
          <Step key={index} completed={index < activeStep || history.currentState === 'APPROVED'}>
            <StepLabel>
              <Typography variant="subtitle2">{stateLabels[step.state] ?? step.state}</Typography>
            </StepLabel>
            <StepContent>
              <Typography variant="body2" color="text.secondary">
                {step.actor} ({step.actorRole}) — {step.timestamp}
              </Typography>
              {step.comment && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  &ldquo;{step.comment}&rdquo;
                </Typography>
              )}
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </Box>
  );
}
