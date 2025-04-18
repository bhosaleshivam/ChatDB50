export function containsExclusivePattern(text: string): boolean {
    const pattern1 = /\b(mongo|mongodb|nosql)\b/i;
    const pattern2 = /\b(sql|mysql)\b/i;
  
    const match1 = pattern1.test(text);
    const match2 = pattern2.test(text);
  
    return (match1 && !match2) || (!match1 && match2);
  }

export function stringContainsNoSQL(text: string): boolean {
  const pattern = /\b(mongo|mongodb|nosql)\b/i;
  return pattern.test(text);
}

export function stringContainsSQL(text: string): boolean {
  const pattern = /\b(sql|mysql)\b/i;
  return pattern.test(text);
}