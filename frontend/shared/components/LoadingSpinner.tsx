import { Box, CircularProgress, Typography, LinearProgress, keyframes } from '@mui/material'

interface LoadingSpinnerProps {
  message?: string
  variant?: 'circular' | 'linear' | 'pulse'
  size?: 'small' | 'medium' | 'large'
}

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`

export default function LoadingSpinner({
  message = 'Loading…',
  variant = 'circular',
  size = 'medium'
}: LoadingSpinnerProps): JSX.Element {
  const getSize = () => {
    switch (size) {
      case 'small': return 32
      case 'large': return 64
      default: return 48
    }
  }

  const renderSpinner = () => {
    switch (variant) {
      case 'linear':
        return (
          <Box sx={{ width: '100%', maxWidth: 400 }}>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Box>
        )
      case 'pulse':
        return (
          <Box
            sx={{
              width: getSize(),
              height: getSize(),
              borderRadius: '50%',
              bgcolor: 'primary.main',
              animation: `${pulse} 1.5s ease-in-out infinite`,
            }}
          />
        )
      default:
        return <CircularProgress size={getSize()} />
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        minHeight: 200,
      }}
    >
      {renderSpinner()}
      <Typography
        variant="body1"
        color="text.secondary"
        sx={{
          mt: 2,
          textAlign: 'center',
          animation: variant === 'pulse' ? `${pulse} 2s ease-in-out infinite` : 'none',
        }}
      >
        {message}
      </Typography>
    </Box>
  )
}
