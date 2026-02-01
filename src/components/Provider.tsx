import { TamaguiProvider, type TamaguiProviderProps } from 'tamagui'
import { ToastProvider, ToastViewport } from '@tamagui/toast'
import { CocoProvider } from 'coco-cashu-react'
import { CurrentToast } from './CurrentToast'
import { config } from '../tamagui.config'
import { ThemeProvider, useAppTheme } from '../context/ThemeContext'

export function Provider({
  children,
  cocoManager,
  ...rest
}: any) {
  return (
    <ThemeProvider>
      <InnerProvider cocoManager={cocoManager} {...rest}>{children}</InnerProvider>
    </ThemeProvider>
  )
}

function InnerProvider({ children, cocoManager, ...rest }: any) {
  const { resolvedTheme } = useAppTheme()

  const content = (
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

  if (cocoManager) {
    return (
      <CocoProvider manager={cocoManager}>
        {content}
      </CocoProvider>
    )
  }

  return content
}
