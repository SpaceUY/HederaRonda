# ESLint Errors - Specific Files

This file tracks EACH FILE that has ESLint errors that need to be resolved.

## Files with Errors:

### src/hooks/use-rosca-join.ts
- [ ] Line 123: Missing return type annotation for function 'decodeContractError'
- [ ] Line 156: 'any' type should be avoided
- [ ] Line 189: 'any' type should be avoided
- [ ] Line 245: Missing dependency 'decodeContractError' in useEffect

### src/hooks/use-ronda-deposit.ts  
- [ ] Line 98: Missing return type annotation for function 'decodeContractError'
- [ ] Line 131: 'any' type should be avoided
- [ ] Line 164: 'any' type should be avoided
- [ ] Line 298: Missing dependency 'decodeContractError' in useEffect

### src/hooks/use-verification.ts
- [ ] Line 45: Missing dependency 'isConnected' in useEffect
- [ ] Line 78: Missing dependency 'address' in useEffect

### src/components/auth/world-id-verifier.tsx
- [ ] Line 23: 'any' type should be avoided in handleVerificationError
- [ ] Line 35: Missing dependency in useEffect

### src/components/group/join-confirmation-modal.tsx
- [ ] Line 89: 'any' type should be avoided in CCIPTransferResult interface
- [ ] Line 156: 'any' type should be avoided in handleProof function
- [ ] Line 234: 'any' type should be avoided in error handling

### src/components/contribution/deposit-button.tsx
- [ ] Line 67: Missing return type annotation
- [ ] Line 89: 'any' type should be avoided
- [ ] Line 123: Missing dependency in useEffect

### src/components/group/join-rosca-button.tsx
- [ ] Line 78: Missing return type annotation
- [ ] Line 102: 'any' type should be avoided
- [ ] Line 145: Missing dependency in useEffect

### src/hooks/use-ronda-contracts.ts
- [ ] Line 234: 'any' type should be avoided in error handling
- [ ] Line 267: Missing dependency in useEffect

### src/hooks/use-single-ronda-contract.ts
- [ ] Line 189: 'any' type should be avoided in error handling
- [ ] Line 223: Missing dependency in useEffect

### src/components/layout/header.tsx
- [ ] Line 156: Missing dependency 'copied' in useEffect
- [ ] Line 178: Missing dependency 'setCopied' in useEffect

## Status: 
- Total files with errors: 10
- Total errors to fix: 23

## Instructions:
Mark each error as [x] when resolved. When all errors in a file are resolved, the file can be removed from this list.