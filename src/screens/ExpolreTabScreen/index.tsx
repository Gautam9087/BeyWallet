import { ScrollView, Text, View } from "tamagui";
import { MintDiscovery } from "../HomeTabScreen/components/MintDiscovery";
import { RefreshControl } from "react-native";
import React from "react";

export default function ExploreTabScreen() {
    const [refreshing, setRefreshing] = React.useState(false);
    const [refreshTrigger, setRefreshTrigger] = React.useState(0);

    const onRefresh = async () => {
        setRefreshing(true);
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <ScrollView
            px="$4"
            height={"100%"}
            bg="$background"
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
            }
        >
            <MintDiscovery
                refreshTrigger={refreshTrigger}
                onRefreshFinished={() => setRefreshing(false)}
            />
        </ScrollView>
    );
}