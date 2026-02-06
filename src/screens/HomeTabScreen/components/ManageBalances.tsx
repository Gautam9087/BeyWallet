import React from 'react'
import { View, Text, YStack, XStack, H4, H6, Image, styled } from 'tamagui'
import { ChevronRight } from '@tamagui/lucide-icons'

interface BalanceItem {
    id: string
    title: string
    value?: string
    imageSource: any
    onPress?: () => void
    isComingSoon?: boolean
}

const RowContainer = styled(XStack, {
    items: 'center',
    justify: 'space-between',
    gap: '$2',
    pressStyle: { opacity: 0.7 },
})

interface BalanceRowProps {
    item: BalanceItem
}

const BalanceRow = ({ item }: BalanceRowProps) => {
    const { title, value, imageSource, onPress, isComingSoon } = item

    return (
        <RowContainer
            onPress={onPress}
            opacity={isComingSoon ? 0.5 : 1}
            disabled={isComingSoon || !onPress}
        >
            <XStack items="center" gap="$2">
                <Image
                    source={imageSource}
                    alt={title}
                    rounded="$2"
                    width={45}
                    height={45}
                />
                <H4 color="$accent4">{title}</H4>
                {!isComingSoon && (
                    <ChevronRight size={20} strokeWidth={3} color="$accent9" />
                )}
            </XStack>

            <YStack>
                <H4>
                    {isComingSoon ? 'Coming soon...' : value}
                </H4>
            </YStack>
        </RowContainer>
    )
}

const ManageBalances = () => {
    const balanceData: BalanceItem[] = [
        {
            id: 'ecash',
            title: 'E-Cash',
            value: '₿78500',
            imageSource: require("../../../assets/images/Cashu.jpg"),
            onPress: () => console.log('E-Cash pressed'),
        },
        {
            id: 'mints',
            title: 'Mints',
            value: '₿1364',
            imageSource: require("../../../assets/images/Mint.png"),
            onPress: () => console.log('Mints pressed'),
        },
        {
            id: 'bitcoin',
            title: 'Bitcoin LN',
            imageSource: require("../../../assets/images/Bitcoin.png"),
            isComingSoon: true,
        },
    ]

    return (
        <YStack width="100%" gap="$4" px="$1" >
            <XStack>
                <H6 color="$gray10" borderBottomWidth={1} borderBottomColor="$gray10" borderStyle='dashed'>Manage Balances</H6>
            </XStack>
            <YStack gap="$3">
                {balanceData.map((item) => (
                    <BalanceRow key={item.id} item={item} />
                ))}
            </YStack>
        </YStack>
    )
}

export default ManageBalances