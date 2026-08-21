'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { parseBoqSpreadsheet } from '@/lib/boq/spreadsheet';
import type { BOQItemWrite } from '@/types/boq';

type UploadStatus = 'idle' | 'parsing' | 'done' | 'error';

interface BOQUploaderProps {
  disabled?: boolean;
  onParsed: (items: BOQItemWrite[]) => Promise<void> | void;
}

export default function BOQUploader({ disabled, onParsed }: BOQUploaderProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [fileName, setFileName] = useState('');
  const [message, setMessage] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFileName(file.name);
    setStatus('parsing');
    setMessage('');

    try {
      const buffer = await file.arrayBuffer();
      const items = parseBoqSpreadsheet(buffer);
      if (items.length === 0) {
        setStatus('error');
        setMessage('No BOQ rows found. Use the spreadsheet headers (PC1, NO., ITEM, … TotalDDP PKR).');
        return;
      }
      await onParsed(items);
      setStatus('done');
      setMessage(`Imported ${items.length} line item${items.length === 1 ? '' : 's'} from ${file.name}.`);
    } catch (err) {
      setStatus('error');
      setMessage(
        (err as { data?: { detail?: string } })?.data?.detail ||
          (err as Error)?.message ||
          'Failed to parse or upload BOQ spreadsheet.'
      );
    }
  };

  return (
    <Box
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
      }}
    >
      {status === 'idle' && (
        <>
          <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 1 }}>
            Import BOQ spreadsheet (.xlsx)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Columns: PC1 → FOB → duties/taxes → DDPUnit / TotalDDP (USD & PKR)
          </Typography>
          <Button variant="outlined" component="label" disabled={disabled}>
            Choose Excel file
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              disabled={disabled}
              onChange={handleFileChange}
            />
          </Button>
        </>
      )}
      {status === 'parsing' && (
        <Box>
          <Typography sx={{ mb: 1 }}>Parsing {fileName}…</Typography>
          <LinearProgress />
        </Box>
      )}
      {status === 'done' && (
        <Box>
          <Alert severity="success" sx={{ mb: 2, textAlign: 'left' }}>
            {message}
          </Alert>
          <Button variant="outlined" component="label" disabled={disabled}>
            Replace with another file
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              disabled={disabled}
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      )}
      {status === 'error' && (
        <Box>
          <Alert severity="error" sx={{ mb: 2, textAlign: 'left' }}>
            {message}
          </Alert>
          <Button variant="outlined" component="label" disabled={disabled}>
            Try again
            <input
              type="file"
              hidden
              accept=".xlsx,.xls"
              disabled={disabled}
              onChange={handleFileChange}
            />
          </Button>
        </Box>
      )}
    </Box>
  );
}
