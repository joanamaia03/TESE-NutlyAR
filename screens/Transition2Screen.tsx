import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNutlySession } from '../src/NutlySessionContext';

export default function Transition2Screen({ route, navigation }: any) {
	const groupNumber = route?.params?.groupNumber ?? 1;
	const nextGroup = groupNumber + 1;

	const { nextGroup: advanceGroup } = useNutlySession();

	const handleSeguinte = () => {
		// Update the shared session group first so context is in sync,
		// then navigate to the ImageQuizzScreen for the next group.
		advanceGroup();

		navigation.reset({
			index: 0,
			routes: [
				{
					name: 'ImageQuizzScreen',
					params: { perguntaProxima: 1, groupNumber: nextGroup },
				},
			],
		});
	};

	return (
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<Text style={styles.title}>Fim do Grupo {groupNumber}</Text>

				<View style={styles.bubbleWrap}>
					<View style={styles.bubble}>
						<Text style={styles.message}>
							Parabéns por ter concluído o {groupNumber}º grupo. Pode avançar para o grupo {nextGroup}
						</Text>
					</View>
					<View style={styles.bubbleTailOuter} />
					<View style={styles.bubbleTailInner} />
				</View>

				<Image source={require('../assets/Owl.png')} style={styles.owl} resizeMode="contain" />

				<TouchableOpacity style={styles.nextButton} onPress={handleSeguinte} activeOpacity={0.85}>
					<Text style={styles.nextButtonText}>Seguinte</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFF8F1',
	},
	content: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: 28,
		paddingTop: Platform.OS === 'android' ? 28 : 14,
		paddingBottom: 34,
	},
	title: {
		marginTop: 120,
		fontSize: 28,
		fontWeight: '800',
		color: '#709985',
		textAlign: 'center',
	},
	bubbleWrap: {
		width: '100%',
		alignItems: 'center',
		marginTop: 18,
	},
	bubble: {
		width: '100%',
		minHeight: 158,
		backgroundColor: '#FFF',
		borderWidth: 1.5,
		borderColor: '#FFCDA6',
		borderRadius: 22,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 28,
		paddingVertical: 26,
	},
	message: {
		fontSize: 20,
		lineHeight: 27,
		color: '#4b4b4b',
		textAlign: 'center',
	},
	bubbleTailOuter: {
		width: 0,
		height: 0,
		borderLeftWidth: 22,
		borderRightWidth: 22,
		borderTopWidth: 30,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#FFCDA6',
		marginTop: -1,
		zIndex: 1,
	},
	bubbleTailInner: {
		width: 0,
		height: 0,
		borderLeftWidth: 20,
		borderRightWidth: 20,
		borderTopWidth: 28,
		borderLeftColor: 'transparent',
		borderRightColor: 'transparent',
		borderTopColor: '#FFFFFF',
		marginTop: -31,
		zIndex: 2,
	},
	owl: {
		width: 210,
		height: 210,
		marginTop: -100,
	},
	nextButton: {
		width: 200,
		backgroundColor: '#81B29A',
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 5,
		elevation: 4,
	},
	nextButtonText: {
		color: '#FFF',
		fontSize: 26,
		fontWeight: '800',
	},
});
