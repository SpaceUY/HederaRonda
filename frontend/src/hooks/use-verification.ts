'use client';

import { ISuccessResult } from '@worldcoin/idkit';
import React, { useState, useCallback, useEffect } from 'react';
import { useAccount } from 'wagmi';

interface VerificationState {
  worldIdProof: ISuccessResult | null;
  walletAddress: string | null;
  isWorldIdVerified: boolean;
  isWalletConnected: boolean;
  isReadyToJoin: boolean;
  sessionData: {
    worldIdProof?: ISuccessResult;
    verificationTimestamp?: Date;
    sessionId?: string;
  } | null;
}

export function useVerification() {
  const { address, isConnected } = useAccount();
  
  // Initialize with consistent server/client state
  const [verificationState, setVerificationState] = useState<VerificationState>({
    worldIdProof: null,
    walletAddress: null, // Always start with null to prevent hydration mismatch
    isWorldIdVerified: false,
    isWalletConnected: false, // Always start with false to prevent hydration mismatch
    isReadyToJoin: false,
    sessionData: null,
  });

  // Load session data from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSession = localStorage.getItem('ronda-worldid-session');
        if (savedSession) {
          const sessionData = JSON.parse(savedSession);
          console.log('🔄 Loaded World ID session from storage:', sessionData);
          
          setVerificationState(prev => ({
            ...prev,
            worldIdProof: sessionData.worldIdProof || null,
            isWorldIdVerified: !!sessionData.worldIdProof,
            sessionData: sessionData,
            isReadyToJoin: !!sessionData.worldIdProof && prev.isWalletConnected,
          }));
        }
      } catch (error) {
        console.error('❌ Error loading World ID session:', error);
      }
    }
  }, []);

  const handleWorldIdSuccess = useCallback((proof: ISuccessResult) => {
    console.log('✅ World ID verification successful!');
    console.log('📋 World ID Proof Details:', {
      merkle_root: proof.merkle_root,
      nullifier_hash: proof.nullifier_hash,
      proof: proof.proof,
      verification_level: proof.verification_level,
      timestamp: new Date().toISOString(),
    });

    const sessionData = {
      worldIdProof: proof,
      verificationTimestamp: new Date(),
      sessionId: `worldid_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    // Store session data in localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('ronda-worldid-session', JSON.stringify(sessionData));
        console.log('💾 World ID session saved to storage');
      } catch (error) {
        console.error('❌ Error saving World ID session:', error);
      }
    }

    setVerificationState(prev => {
      const newState = {
        ...prev,
        worldIdProof: proof,
        isWorldIdVerified: true,
        sessionData: sessionData,
        isReadyToJoin: true && prev.isWalletConnected,
      };
      
      console.log('🔄 Updated verification state:', {
        isWorldIdVerified: newState.isWorldIdVerified,
        isWalletConnected: newState.isWalletConnected,
        isReadyToJoin: newState.isReadyToJoin,
        sessionId: sessionData.sessionId,
      });
      
      return newState;
    });
  }, []);

  const handleWalletConnect = useCallback((walletAddress: string) => {
    console.log('🔗 Wallet connected:', walletAddress);
    
    setVerificationState(prev => {
      const newState = {
        ...prev,
        walletAddress,
        isWalletConnected: true,
        isReadyToJoin: prev.isWorldIdVerified && true,
      };
      
      console.log('🔄 Updated verification state after wallet connect:', {
        walletAddress: newState.walletAddress,
        isWorldIdVerified: newState.isWorldIdVerified,
        isWalletConnected: newState.isWalletConnected,
        isReadyToJoin: newState.isReadyToJoin,
      });
      
      return newState;
    });
  }, []);

  const handleWalletDisconnect = useCallback(() => {
    console.log('🔌 Wallet disconnected');
    
    setVerificationState(prev => ({
      ...prev,
      walletAddress: null,
      isWalletConnected: false,
      isReadyToJoin: false,
    }));
  }, []);

  // Update wallet state when wagmi state changes (only on client)
  React.useEffect(() => {
    if (isConnected && address) {
      handleWalletConnect(address);
    } else if (!isConnected) {
      handleWalletDisconnect();
    }
  }, [isConnected, address, handleWalletConnect, handleWalletDisconnect]);

  const resetVerification = useCallback(() => {
    console.log('🔄 Resetting verification state');
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('ronda-worldid-session');
        console.log('🗑️ World ID session cleared from storage');
      } catch (error) {
        console.error('❌ Error clearing World ID session:', error);
      }
    }

    setVerificationState({
      worldIdProof: null,
      walletAddress: null,
      isWorldIdVerified: false,
      isWalletConnected: false,
      isReadyToJoin: false,
      sessionData: null,
    });
  }, []);

  const getSessionInfo = useCallback(() => {
    return {
      hasActiveSession: !!verificationState.sessionData,
      sessionId: verificationState.sessionData?.sessionId,
      verificationTimestamp: verificationState.sessionData?.verificationTimestamp,
      proof: verificationState.worldIdProof,
    };
  }, [verificationState]);

  return {
    verificationState,
    handleWorldIdSuccess,
    handleWalletConnect,
    handleWalletDisconnect,
    resetVerification,
    getSessionInfo,
  };
}