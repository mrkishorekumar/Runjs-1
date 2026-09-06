import { useState, useCallback } from 'react';
import { analyzeComplexity } from '../utils/complexity/analyzer';
import { ComplexityRank, ComplexityResult } from '../utils/complexity/types';

export function useComplexityAnalyzer(getCode: () => string) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ComplexityResult | null>(null);
  const [analyzedCode, setAnalyzedCode] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const analyze = useCallback(() => {
    setIsAnalyzing(true);
    const sourceSnapshot = getCode();
    setAnalyzedCode(sourceSnapshot);

    // Defer analysis by a brief tick so UI immediately reflects the loading spinner
    setTimeout(() => {
      try {
        const analysisResult = analyzeComplexity(sourceSnapshot);
        setResult(analysisResult);
        setIsModalOpen(true);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Unexpected analysis failure';
        setResult({
          success: false,
          timeComplexity: 'O(?)',
          spaceComplexity: 'O(?)',
          timeRank: ComplexityRank.UNKNOWN,
          spaceRank: ComplexityRank.UNKNOWN,
          timeClassification: 'Error',
          spaceClassification: 'Error',
          explanation: `Analysis encountered an unexpected error: ${message}`,
          factors: [],
          isEstimate: false,
          notes: [
            'An unexpected error occurred during static code inspection.',
          ],
          suggestions: ['Verify that the code is valid JavaScript syntax.'],
          error: message,
        });
        setIsModalOpen(true);
      } finally {
        setIsAnalyzing(false);
      }
    }, 60);
  }, [getCode]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return {
    isAnalyzing,
    result,
    analyzedCode,
    isModalOpen,
    analyze,
    closeModal,
  };
}
