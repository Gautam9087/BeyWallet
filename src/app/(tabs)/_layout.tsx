import { Tabs } from 'expo-router'
import { Button, XStack, Text, useTheme, Image } from 'tamagui'
import {
  History,
  Settings,
  Home,
  Scan,
  Lock,
  HelpCircle,
  Filter,
  ChevronDown,
  Sprout,
  Globe
} from '@tamagui/lucide-icons'
import { useAppTheme } from '~/context/ThemeContext'
import { useAuthStore } from '~/store/authStore'
import HomeHeaderMintSelector from '~/components/HomeMintSelector'
import SettingsIcon from '~/components/icons/Settings'
import WalletIcon from '~/components/icons/Wallet'

export default function TabLayout() {
  const theme = useTheme()
  const { resolvedTheme } = useAppTheme()
  const { lock } = useAuthStore()

  const HeaderLeft = () => (
    <XStack pl="$4" items="center">
      <Image
        source={resolvedTheme === 'dark'
          ? require('../../assets/icons/Bey-dark-logo.png')
          : require('../../assets/icons/Bey-light-logo.png')}
        width={28}
        height={28}
        resizeMode="contain"
      />
    </XStack>
  )



  const DefaultHeaderTitle = ({ children }: { children: string }) => (
    <Text fontWeight="700" fontSize={18} color="$color">
      {children}
    </Text>
  )

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.color.val,
        tabBarInactiveTintColor: theme.color4.val,
        headerShadowVisible: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.background.val,
          borderTopColor: theme.borderColor.val,
          height: 85,
          paddingTop: 12,
          paddingBottom: 25,
        },
        headerStyle: {
          backgroundColor: theme.background.val,
          borderBottomColor: theme.borderColor.val,
        },
        headerTitle: ({ children }) => <DefaultHeaderTitle>{children as string}</DefaultHeaderTitle>,
        headerLeft: () => <HeaderLeft />,
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{

          title: 'Home',
          headerTitle: () => <HomeHeaderMintSelector />,
          tabBarIcon: ({ color }) => <WalletIcon size={28} color={color as any} />,
          headerRight: () => (
            <XStack pr="$4" gap="$2">
              <Button
                circular
                size="$3"
                chromeless
                icon={<Scan size={24} color="$color" />}
                onPress={() => console.log('Scan')}
              />
              <Button
                circular
                size="$3"
                chromeless
                icon={<Lock size={24} color="$color" />}
                onPress={lock}
              />
            </XStack>
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{

          title: 'History',
          tabBarIcon: ({ color }) => <History strokeWidth={2.5} color={color as any} />,
          headerRight: () => (
            <XStack pr="$4">
              <Button
                circular
                size="$3"
                chromeless
                icon={<Filter size={24} color="$color" />}
                onPress={() => console.log('Filter')}
              />
            </XStack>
          ),
        }}
      />


      <Tabs.Screen
        name="two"
        options={{
          title: 'Two',
          tabBarIcon: ({ color }) => <Globe color={color as any} />,
          headerRight: () => (
            <XStack pr="$4">
              <Button
                circular
                size="$3"
                chromeless
                icon={<HelpCircle size={24} color="$color" />}
                onPress={() => console.log('Help')}
              />
            </XStack>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarStyle: {
            display: 'none',
          },
          title: 'Settings',
          tabBarIcon: ({ color }) => <SettingsIcon color={color as any} />,
          headerRight: () => (
            <XStack pr="$4">
              <Button
                circular
                size="$3"
                chromeless
                icon={<HelpCircle size={24} color="$color" />}
                onPress={() => console.log('Help')}
              />
            </XStack>
          ),
        }}
      />
    </Tabs>
  )
}
