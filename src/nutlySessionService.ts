// src/services/nutlySessionService.ts
import { db, auth } from './firebase';
import { doc, setDoc, updateDoc, Timestamp, arrayUnion } from 'firebase/firestore';
import { NutlySession, Answer, GroupData } from './types/nutly';

const COLLECTION = 'nutly_sessions';

export const nutlySessionService = {

  // Criar uma nova sessão (chamar no início do primeiro grupo)
  async createSession(): Promise<string> {
    const user = auth.currentUser;
    if (!user) throw new Error("Utilizador não autenticado");

    const sessionId = `sess_${Date.now()}`;
    const docId = `${user.uid}_${sessionId}`;

    const sessionData: Omit<NutlySession, 'id'> = {
      userId: user.uid,
      sessionId,
      startedAt: new Date(),
      groups: {},
      status: 'in_progress'
    };

    await setDoc(doc(db, COLLECTION, docId), {
      ...sessionData,
      startedAt: Timestamp.fromDate(sessionData.startedAt)
    });

    return docId; // Guarda este ID na app (Context ou AsyncStorage)
  },

  // Guardar uma resposta num grupo específico
  async saveAnswer(sessionDocId: string, groupNumber: number, answer: Omit<Answer, 'answeredAt'>) {
    const fullAnswer: Answer = {
      ...answer,
      answeredAt: new Date()
    };

    const groupKey = groupNumber.toString();

    const sessionRef = doc(db, COLLECTION, sessionDocId);

    console.log('A guardar imagem na base de dados:', {
      sessionDocId,
      groupNumber,
      questionId: answer.questionId,
      selectedImage: answer.selectedImage,
      targetIndex: answer.targetIndex,
      fase: answer.fase,
    });

    await updateDoc(sessionRef, {
      [`groups.${groupKey}.answers`]: arrayUnion(fullAnswer),
      [`groups.${groupKey}.groupNumber`]: groupNumber,
      [`groups.${groupKey}.startedAt`]: Timestamp.fromDate(new Date())
    });

    console.log('Imagem guardada com sucesso na base de dados:', {
      sessionDocId,
      groupNumber,
      questionId: answer.questionId,
      selectedImage: answer.selectedImage,
    });
  },

  // Marcar um grupo como concluído
  async completeGroup(sessionDocId: string, groupNumber: number, score: number) {
    const groupKey = groupNumber.toString();
    const sessionRef = doc(db, COLLECTION, sessionDocId);

    await updateDoc(sessionRef, {
      [`groups.${groupKey}.completedAt`]: Timestamp.fromDate(new Date()),
      [`groups.${groupKey}.score`]: score,
    });
  }
};