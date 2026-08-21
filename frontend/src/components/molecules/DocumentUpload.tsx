'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import IconButton from '@mui/material/IconButton';

interface UploadedDoc {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export default function DocumentUpload() {
  const [docs, setDocs] = useState<UploadedDoc[]>([
    { id: '1', name: 'BOQ_Template_v1.xlsx', size: '245 KB', uploadedAt: '2026-01-20' },
    { id: '2', name: 'Site_Drawing_A1.pdf', size: '1.2 MB', uploadedAt: '2026-02-01' },
  ]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const newDoc: UploadedDoc = {
      id: Date.now().toString(),
      name: file.name,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      uploadedAt: new Date().toISOString().split('T')[0],
    };
    setDocs((prev) => [...prev, newDoc]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Documents</Typography>
        <Button variant="outlined" size="small" component="label">
          Upload Document
          <input type="file" hidden onChange={handleFileChange} />
        </Button>
      </Box>

      <List dense>
        {docs.map((doc) => (
          <ListItem
            key={doc.id}
            secondaryAction={
              <IconButton edge="end" onClick={() => console.log('Download:', doc.name)}>
                <DownloadIcon />
              </IconButton>
            }
          >
            <ListItemIcon>
              <InsertDriveFileIcon />
            </ListItemIcon>
            <ListItemText primary={doc.name} secondary={`${doc.size} · ${doc.uploadedAt}`} />
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
