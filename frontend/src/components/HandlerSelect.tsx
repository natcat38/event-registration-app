import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import type { Handler } from '../api/client';

interface Props {
  handlers: Handler[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled: boolean;
}

export default function HandlerSelect({ handlers, value, onChange, error, disabled }: Props) {
  return (
    <FormControl fullWidth error={Boolean(error)} required disabled={disabled}>
      <InputLabel id="handler-select-label">Handler</InputLabel>
      <Select
        id="field-handlerUuid"
        labelId="handler-select-label"
        label="Handler"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputProps={{ 'aria-describedby': error ? 'handler-select-helper-text' : undefined }}
      >
        {handlers.map((h) => (
          <MenuItem key={h.uuid} value={h.uuid}>
            {h.name}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText id="handler-select-helper-text">{error}</FormHelperText>}
    </FormControl>
  );
}
