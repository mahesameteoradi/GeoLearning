export function smartParseTextToQuestions(text: string) {
  if (!text || !text.trim()) return [];

  const questions: any[] = [];
  
  // 1. Separate main text and bottom keys text
  let mainText = text;
  let bottomKeysText = '';
  
  const keyMarkers = [/kunci jawaban/i, /kunci/i, /jawaban:/i];
  const lines = text.split('\n');
  let keyStartIndex = -1;
  
  // Search from the bottom up (last 30% of lines) for a key marker
  const startSearch = Math.floor(lines.length * 0.7);
  for (let i = lines.length - 1; i >= startSearch; i--) {
    if (keyMarkers.some(m => m.test(lines[i]))) {
      keyStartIndex = i;
      break;
    }
  }
  
  if (keyStartIndex !== -1) {
    mainText = lines.slice(0, keyStartIndex).join('\n');
    bottomKeysText = lines.slice(keyStartIndex).join('\n');
  }

  // 2. Extract Questions
  // Regex matches: "1. " or "1) " at the start of a line or after spaces.
  const questionRegex = /(?:^|\n)\s*(\d+)[\.\)]\s+([\s\S]*?)(?=(?:(?:^|\n)\s*\d+[\.\)]\s+)|$)/g;
  
  let match;
  while ((match = questionRegex.exec(mainText)) !== null) {
    const qNumber = match[1];
    let qContent = match[2];
    
    // Extract Options (A., B., C., D., E.)
    const options: any[] = [];
    const optionRegex = /(?:^|\s|\n)([A-E])[\.\)]\s+([\s\S]*?)(?=(?:(?:^|\s|\n)[A-E][\.\)]\s+)|$)/gi;
    
    let optMatch;
    let questionText = qContent;
    let firstOptIndex = -1;
    
    while ((optMatch = optionRegex.exec(qContent)) !== null) {
      if (firstOptIndex === -1) {
        firstOptIndex = optMatch.index;
      }
      options.push({
        label: optMatch[1].toUpperCase(),
        value: optMatch[2].trim()
      });
    }
    
    if (firstOptIndex !== -1) {
      questionText = qContent.substring(0, firstOptIndex).trim();
    } else {
      questionText = qContent.trim();
    }
    
    // Only add if it looks like a valid question (has options)
    if (options.length >= 2 && questionText) {
      questions.push({
        text: questionText,
        options,
        correct_answer: options[0].label, // Default
        explanation: '',
        type: 'MULTIPLE_CHOICE',
        order: questions.length
      });
    }
  }
  
  // 3. Map Answer Keys from the bottom (or from the whole text if not cleanly separated)
  const keyMap = new Map<number, string>();
  const searchArea = bottomKeysText || text;
  
  // Matches "1. A", "1: A", "1= A", "1 A"
  const keyRegex = /(?:^|\b|\n)\s*(\d+)\s*[\.\=\-\:]?\s*([A-E])\b/gi;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(searchArea)) !== null) {
    const num = parseInt(keyMatch[1], 10);
    const ans = keyMatch[2].toUpperCase();
    // Only map if it matches a valid question number
    if (num > 0 && num <= questions.length) {
      keyMap.set(num, ans);
    }
  }
  
  // Apply keys
  questions.forEach((q, index) => {
    const qNum = index + 1;
    if (keyMap.has(qNum)) {
      q.correct_answer = keyMap.get(qNum)!;
    }
  });

  return questions;
}
