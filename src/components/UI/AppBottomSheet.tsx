import React, { useCallback, useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { StyleSheet, BackHandler } from "react-native";
import {
    BottomSheetBackdrop,
    BottomSheetView,
    BottomSheetBackdropProps,
    BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useTheme } from "tamagui";
import * as Haptics from "expo-haptics";

interface AppBottomSheetProps {
    children: React.ReactNode;
    onClose?: () => void;
}

export interface AppBottomSheetRef {
    present: () => void;
    dismiss: () => void;
}

const AppBottomSheet = forwardRef<AppBottomSheetRef, AppBottomSheetProps>(
    ({ children, onClose }, ref) => {
        const bottomSheetRef = useRef<BottomSheetModal>(null);
        const theme = useTheme();
        const [isOpen, setIsOpen] = useState(false);

        // callbacks
        const handleSheetChanges = useCallback((index: number) => {
            setIsOpen(index >= 0);
            if (index === -1) {
                onClose?.();
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
        }, [onClose]);

        const renderBackdrop = useCallback(
            (props: BottomSheetBackdropProps) => (
                <BottomSheetBackdrop
                    {...props}
                    disappearsOnIndex={-1}
                    appearsOnIndex={0}
                    pressBehavior="close"
                    opacity={0.5}
                />
            ),
            []
        );

        useImperativeHandle(ref, () => ({
            present: () => {
                bottomSheetRef.current?.present();
            },
            dismiss: () => {
                bottomSheetRef.current?.dismiss();
            },
        }));

        // Handle Android back button
        useEffect(() => {
            if (!isOpen) return;

            const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
                bottomSheetRef.current?.dismiss();
                return true;
            });

            return () => backHandler.remove();
        }, [isOpen]);

        return (
            <BottomSheetModal
                ref={bottomSheetRef}
                enablePanDownToClose={true}
                enableDynamicSizing={true}
                backdropComponent={renderBackdrop}
                stackBehavior="push"
                handleIndicatorStyle={{
                    backgroundColor: theme.color8.val,
                    width: 36,
                    height: 4,
                }}
                backgroundStyle={{
                    backgroundColor: theme.color2.val,
                    borderRadius: 10,
                }}
                onChange={handleSheetChanges}
                animationConfigs={{
                    duration: 100,
                }}
                // Ensure high priority
                containerStyle={{ zIndex: 1000 }}
            >
                <BottomSheetView style={styles.contentContainer}>
                    {children}
                </BottomSheetView>
            </BottomSheetModal>
        );
    }
);

const styles = StyleSheet.create({
    contentContainer: {
        paddingBottom: 40,
    },
});

export default AppBottomSheet;
