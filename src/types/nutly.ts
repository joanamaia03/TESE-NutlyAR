// src/types/nutly.ts
export type Answer = {
  questionId: string;           // ex: "g1_q1_calorias", "g1_q2_confianca"
  groupNumber: number;          // 1, 2, 3 ou 4
  targetIndex?: number;         // índice do alvo AR (0-11)
  selectedImage?: string;       // nome da imagem escolhida
  fase?: number;                // 1 ou 2
  isCorrect?: boolean;
  confidence?: number;          // 1 a 5
  reasons?: string[];           // motivos
  factors?: any[];              // fatores de decisão
  imagineResponse?: {
    opcaoSelecionada: string;
    porqueTexto: string;
  };
  answeredAt: Date;
};

export type GroupData = {
  groupNumber: number;
  startedAt: Date;
  completedAt?: Date;
  answers: Answer[];
  score?: number;
  totalQuestions?: number;
};

export type NutlySession = {
  id: string;                   // ID do documento no Firestore
  userId: string;
  sessionId: string;
  startedAt: Date;
  completedAt?: Date;
  groups: Record<string, GroupData>; // "1", "2", "3", "4"
  status: 'in_progress' | 'completed';
};