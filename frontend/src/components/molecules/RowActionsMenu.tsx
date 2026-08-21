'use client';

import { useId, useState, type MouseEvent, type ReactNode } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export type RowActionItem = {
  key: string;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  /** Destructive actions (e.g. Delete) render in error color */
  destructive?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
};

type RowActionsMenuProps = {
  actions: RowActionItem[];
  /** Accessible label for the trigger */
  label?: string;
  size?: 'small' | 'medium';
};

/**
 * Enterprise row actions: single ⋮ trigger with a compact menu.
 * Only non-empty action lists render a trigger.
 */
export default function RowActionsMenu({
  actions,
  label = 'Row actions',
  size = 'small',
}: RowActionsMenuProps) {
  const menuId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const visible = actions.filter(Boolean);

  if (visible.length === 0) return null;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event?: MouseEvent | object) => {
    if (event && 'stopPropagation' in event && typeof event.stopPropagation === 'function') {
      event.stopPropagation();
    }
    setAnchorEl(null);
  };

  return (
    <>
      <Tooltip title={label}>
        <IconButton
          size={size}
          aria-label={label}
          aria-controls={open ? menuId : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleOpen}
          sx={{
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
          }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Menu
        id={menuId}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              minWidth: 168,
              borderRadius: 1.5,
              mt: 0.5,
              py: 0.5,
            },
          },
        }}
      >
        {visible.map((action) => [
          action.dividerBefore ? <Divider key={`${action.key}-div`} sx={{ my: 0.5 }} /> : null,
          <MenuItem
            key={action.key}
            disabled={action.disabled}
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
              action.onClick();
            }}
            sx={{
              py: 1,
              px: 1.5,
              gap: 0.5,
              ...(action.destructive
                ? {
                    color: 'error.main',
                    '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' },
                    '& .MuiListItemIcon-root': { color: 'inherit' },
                  }
                : {}),
            }}
          >
            {action.icon ? (
              <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>{action.icon}</ListItemIcon>
            ) : null}
            <ListItemText
              primary={action.label}
              slotProps={{ primary: { variant: 'body2', sx: { fontWeight: 500 } } }}
            />
          </MenuItem>,
        ])}
      </Menu>
    </>
  );
}
