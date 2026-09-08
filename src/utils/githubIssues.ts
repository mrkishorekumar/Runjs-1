import { Problem } from '../problem-engine/types';
import { ComplexityResult } from './complexity/types';

export function getGithubIssueUrl(problem: Problem): string {
  const repoUrl = 'https://github.com/rigial/Runjs';
  const issueTitle = encodeURIComponent(
    `[Problem Issue]: #${problem.id} - ${problem.title}`
  );
  const issueBody = encodeURIComponent(
    `### Problem Information
- **Problem ID:** #${problem.id}
- **Problem Title:** ${problem.title}
- **Slug:** ${problem.slug}
- **Difficulty:** ${problem.difficulty}
- **Topics:** ${problem.topics.join(', ')}

### Issue Description
<!-- Please describe the issue with this problem (e.g. incorrect test case, description typo, starter code error, etc.) -->

### Expected Behavior
<!-- What should have happened instead? -->

### Additional Context
<!-- Add any other context or screenshots about the issue here. -->
`
  );

  return `${repoUrl}/issues/new?title=${issueTitle}&body=${issueBody}&labels=problem-issue`;
}

export function getComplexityIssueUrl(
  result: ComplexityResult | null,
  codeSnippet?: string
): string {
  const repoUrl = 'https://github.com/rigial/Runjs';
  const issueTitle = encodeURIComponent(
    '[Complexity Analyzer]: Incorrect complexity analysis'
  );

  const formattedCode =
    codeSnippet && codeSnippet.trim()
      ? codeSnippet.length > 2000
        ? `${codeSnippet.slice(0, 2000)}\n\n// ... (truncated due to URL length limit)`
        : codeSnippet
      : '// (No code snippet provided)';

  const timeStr = result?.timeComplexity
    ? `${result.timeComplexity} (${result.timeClassification})`
    : 'N/A';
  const spaceStr = result?.spaceComplexity
    ? `${result.spaceComplexity} (${result.spaceClassification})`
    : 'N/A';

  const issueBody = encodeURIComponent(
    `### Complexity Analyzer Issue

#### Analyzed Result (from RunJS)
- **Time Complexity:** ${timeStr}
- **Space Complexity:** ${spaceStr}

#### Expected Complexity
- **Expected Time Complexity:** 
- **Expected Space Complexity:** 

#### Code Snippet
\`\`\`javascript
${formattedCode}
\`\`\`

#### Details / Why is this incorrect?
<!-- Please describe why you believe the analyzed complexity is wrong, or any nuances about this code -->
`
  );

  return `${repoUrl}/issues/new?title=${issueTitle}&body=${issueBody}&labels=complexity-analyzer,bug`;
}
