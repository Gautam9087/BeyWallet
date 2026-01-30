import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { CurrentToast } from './CurrentToast'
import { config } from '../tamagui.config'
import { ThemeProvider, useAppTheme } from '../context/ThemeContext'

export function Provider({
  children,
  ...rest
}: Omit<TamaguiProviderProps, 'config' | 'defaultTheme'>) {
  return (
    <ThemeProvider>
      <InnerProvider {...rest}>{children}</InnerProvider>
    </ThemeProvider>
  )
}

function InnerProvider({ children, ...rest }: any) {
  const { resolvedTheme } = useAppTheme()

  return (
    <TamaguiProvider
      config={config}
      defaultTheme={resolvedTheme}
      {...rest}
    >
      <ToastProvider
        swipeDirection="horizontal"
        duration={6000}
        native={[]}
      >
        {children}
        <CurrentToast />
        <ToastViewport top="$8" left={0} right={0} />
      </ToastProvider>
    </TamaguiProvider>
  )
}
