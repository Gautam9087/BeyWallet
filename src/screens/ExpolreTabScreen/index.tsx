import { ScrollView, Text, View } from "tamagui";
import { MintDiscovery } from "../HomeTabScreen/components/MintDiscovery";

export default function ExploreTabScreen() {
    return (
        <ScrollView px="$4" height={"100%"} bg="$background">
            <MintDiscovery />
        </ScrollView>
    );
}