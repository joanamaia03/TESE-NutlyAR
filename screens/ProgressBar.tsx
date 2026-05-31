import React from 'react';
import { StyleSheet, View, Text, Platform, ScrollView, Dimensions } from 'react-native';

interface ProgressBreadcrumbProps {
  currentStep: number; // Número do passo atual (de 1 a 6)
}

export default function ProgressBreadcrumb({ currentStep }: ProgressBreadcrumbProps) {
  const steps = [1, 2, 3, 4];
  const scrollRef = React.useRef<ScrollView | null>(null);

  const CIRCLE_SIZE = 42; // usar o tamanho máximo (círculo ativo maior) para cálculos de scroll
  const MARGIN_HORIZONTAL = 6;
  const ELEMENT_WIDTH = CIRCLE_SIZE + MARGIN_HORIZONTAL * 2;

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = screenWidth * 0.92; // keep same % as styles
  const totalWidth = steps.length * ELEMENT_WIDTH;

  React.useEffect(() => {
    const index = steps.indexOf(currentStep);
    if (index < 0) return;

    const offset = index * ELEMENT_WIDTH - (containerWidth / 2 - CIRCLE_SIZE / 2);
    const maxOffset = Math.max(0, totalWidth - containerWidth);
    const x = Math.max(0, Math.min(offset, maxOffset));

    if (scrollRef.current && typeof (scrollRef.current as any).scrollTo === 'function') {
      (scrollRef.current as any).scrollTo({ x, animated: true });
    }
  }, [currentStep]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {steps.map((step, index) => {
          const isActive = currentStep === step;

          return (
            <React.Fragment key={step}>
              {/* Círculo do Passo */}
              <View style={[styles.circle, isActive ? styles.activeCircle : styles.inactiveCircle]}>
                <Text style={[styles.stepText, isActive && styles.activeStepText]}>{step}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 0,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    // Pequena sombra para dar profundidade idêntica ao design
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeCircle: {
    backgroundColor: '#709985', 
    width: 42,
    height: 42,
    borderRadius: 21,
    transform: [{ scale: 1 }],
  },
  inactiveCircle: {
    backgroundColor: '#f8decb', 
  },
  stepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF', 
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
  },
  activeStepText: {
    fontSize: 16,
  },
});