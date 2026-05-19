declare module 'react-native-vector-icons/MaterialCommunityIcons';
declare module 'react-native-vector-icons/*';
declare module 'expo-navigation-bar' {
	export function setVisibilityAsync(value: string): Promise<void>;
	export function setBehaviorAsync(value: string): Promise<void>;
	export function setBackgroundColorAsync(color: string, animated?: boolean): Promise<void>;
}
