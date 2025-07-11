import type { TestResponse } from '../types/api';

export const exportToJSON = (results: TestResponse, filename: string = 'test-results') => {
  const dataStr = JSON.stringify(results, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `${filename}-${new Date().toISOString().slice(0, 10)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
};

export const exportToCSV = (results: TestResponse, filename: string = 'test-results') => {
  const headers = ['Test Case #', 'Input', 'Expected', 'Actual Output', 'Score', 'Reasoning', 'Pass/Fail'];
  
  const rows = results.test_results.map((result, index) => [
    index + 1,
    `"${result.test_case.input.replace(/"/g, '""')}"`,
    `"${result.test_case.expected.replace(/"/g, '""')}"`,
    `"${result.actual_output.replace(/"/g, '""')}"`,
    (result.score * 100).toFixed(1) + '%',
    `"${(result.reasoning || '').replace(/"/g, '""')}"`,
    result.score >= 0.8 ? 'Pass' : 'Fail'
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToMarkdown = (results: TestResponse, filename: string = 'test-results') => {
  let markdown = `# Test Results Report\n\n`;
  markdown += `**Date:** ${new Date().toLocaleDateString()}\n`;
  markdown += `**Overall Score:** ${(results.overall_score * 100).toFixed(1)}%\n`;
  markdown += `**Passed:** ${results.passed_cases}/${results.total_cases}\n`;
  markdown += `**Execution Time:** ${results.execution_time.toFixed(2)}s\n\n`;
  
  markdown += `## Test Cases\n\n`;
  
  results.test_results.forEach((result, index) => {
    const status = result.score >= 0.8 ? '✅' : '❌';
    markdown += `### Test Case ${index + 1} ${status}\n\n`;
    markdown += `**Score:** ${(result.score * 100).toFixed(1)}%\n\n`;
    markdown += `**Input:**\n\`\`\`\n${result.test_case.input}\n\`\`\`\n\n`;
    markdown += `**Expected:**\n\`\`\`\n${result.test_case.expected}\n\`\`\`\n\n`;
    markdown += `**Actual Output:**\n\`\`\`\n${result.actual_output}\n\`\`\`\n\n`;
    if (result.reasoning) {
      markdown += `**Reasoning:** ${result.reasoning}\n\n`;
    }
    markdown += `---\n\n`;
  });
  
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().slice(0, 10)}.md`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};