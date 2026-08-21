'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DataGrid, GridColDef, GridPaginationModel, GridRowParams, GridEventListener, GridValidRowModel } from '@mui/x-data-grid';
import type { SxProps, Theme } from '@mui/material/styles';

interface DataTableProps<T extends GridValidRowModel & { id: string | number }> {
  rows: T[];
  columns: GridColDef[];
  rowCount: number;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (params: GridRowParams<T>) => void;
  sx?: SxProps<Theme>;
}

export default function DataTable<T extends GridValidRowModel & { id: string | number }>({
  rows,
  columns,
  rowCount,
  paginationModel,
  onPaginationModelChange,
  loading = false,
  emptyMessage = 'No records found.',
  onRowClick,
  sx,
}: DataTableProps<T>) {
  const handleRowClick: GridEventListener<'rowClick'> = (params) => {
    onRowClick?.(params as GridRowParams<T>);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        rowCount={rowCount}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        loading={loading}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        autoHeight
        onRowClick={onRowClick ? handleRowClick : undefined}
        sx={sx}
        slots={{
          noRowsOverlay: () => (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Typography color="text.secondary">{emptyMessage}</Typography>
            </Box>
          ),
        }}
      />
    </Box>
  );
}