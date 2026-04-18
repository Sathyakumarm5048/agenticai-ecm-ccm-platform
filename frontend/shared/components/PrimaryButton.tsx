import { Button, ButtonProps } from '@mui/material'

export default function PrimaryButton(props: ButtonProps): JSX.Element {
  return <Button variant="contained" color="primary" {...props} />
}
