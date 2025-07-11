interface DiffViewProps {
  expected: string;
  actual: string;
}

const DiffView = ({ expected, actual }: DiffViewProps) => {
  
  // Check if outputs are exactly the same
  if (expected === actual) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">✓ Outputs are identical</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h6 className="text-xs font-semibold text-gray-600 mb-2">Expected</h6>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap font-mono">
              {expected}
            </p>
          </div>
        </div>
        
        <div>
          <h6 className="text-xs font-semibold text-gray-600 mb-2">Actual</h6>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap font-mono">
              {actual}
            </p>
          </div>
        </div>
      </div>
      
      {/* Character-level diff for short outputs */}
      {expected.length < 200 && actual.length < 200 && (
        <div>
          <h6 className="text-xs font-semibold text-gray-600 mb-2">Character Differences</h6>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-x-auto">
            <div className="flex flex-wrap gap-1 font-mono text-xs">
              {Array.from({ length: Math.max(expected.length, actual.length) }).map((_, i) => {
                const expChar = expected[i] || '';
                const actChar = actual[i] || '';
                const match = expChar === actChar;
                
                return (
                  <div
                    key={i}
                    className={`px-1 py-0.5 rounded ${
                      match
                        ? 'bg-gray-200'
                        : expChar && !actChar
                        ? 'bg-red-200'
                        : !expChar && actChar
                        ? 'bg-green-200'
                        : 'bg-yellow-200'
                    }`}
                    title={`Expected: "${expChar}" | Actual: "${actChar}"`}
                  >
                    {actChar || '∅'}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiffView;