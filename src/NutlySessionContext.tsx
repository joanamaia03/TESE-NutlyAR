// src/context/NutlySessionContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { nutlySessionService } from './nutlySessionService';
import { NutlySession } from './types/nutly';
import { auth } from './firebase';

type NutlySessionContextType = {
  sessionDocId: string | null;
  currentGroup: number;
  isLoading: boolean;
  
  startNewSession: () => Promise<void>;
  setCurrentGroup: (group: number) => void;
  saveAnswer: (groupNumber: number, answer: any) => Promise<void>;
  completeGroup: (groupNumber: number, score?: number) => Promise<void>;
  resetSession: () => void;
  nextGroup: () => void;         
};

const NutlySessionContext = createContext<NutlySessionContextType | undefined>(undefined);

export const NutlySessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessionDocId, setSessionDocId] = useState<string | null>(null);
  const [currentGroup, setCurrentGroupState] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Inicia uma nova sessão automaticamente quando o utilizador entra
  const startNewSession = async () => {
    if (sessionDocId) return; // Já tem sessão ativa

    setIsLoading(true);
    try {
      const newSessionId = await nutlySessionService.createSession();
      setSessionDocId(newSessionId);
      console.log('Nova sessão Nutly criada:', newSessionId);
    } catch (error) {
      console.error('Erro ao criar sessão:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentGroup = (group: number) => {
    setCurrentGroupState(group);
  };

  const saveAnswer = async (groupNumber: number, answer: any) => {
    if (!sessionDocId) {
      console.warn('Não existe sessão ativa. A criar uma...');
      await startNewSession();
      if (!sessionDocId) return;
    }

    try {
      await nutlySessionService.saveAnswer(sessionDocId, groupNumber, answer);
    } catch (error) {
      console.error('Erro ao guardar resposta:', error);
    }
  };

  const completeGroup = async (groupNumber: number, score?: number) => {
    if (!sessionDocId) return;

    try {
      await nutlySessionService.completeGroup(sessionDocId, groupNumber, score || 0);
      console.log(`Grupo ${groupNumber} concluído com score:`, score);
    } catch (error) {
      console.error('Erro ao completar grupo:', error);
    }
  };

  const resetSession = () => {
    setSessionDocId(null);
    setCurrentGroupState(1);
  };

  const nextGroup = () => {
    setCurrentGroupState(prev => {
      const next = prev + 1;
      if (next > 4) {
        console.log("Todos os 4 grupos completos!");
        return prev;
      }
      console.log(`Avançando para o Grupo ${next}`);
      return next;
    });
  };

  // Inicia sessão automaticamente quando o utilizador está logado
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && !sessionDocId) {
        startNewSession();
      }
    });

    return () => unsubscribe();
  }, [sessionDocId]);

  return (
    <NutlySessionContext.Provider
      value={{
        sessionDocId,
        currentGroup,
        isLoading,
        startNewSession,
        nextGroup,
        setCurrentGroup,
        saveAnswer,
        completeGroup,
        resetSession,
      }}
    >
      {children}
    </NutlySessionContext.Provider>
  );
};

// Hook personalizado para usar o context
export const useNutlySession = () => {
  const context = useContext(NutlySessionContext);
  if (context === undefined) {
    throw new Error('useNutlySession deve ser usado dentro de um NutlySessionProvider');
  }
  return context;
};