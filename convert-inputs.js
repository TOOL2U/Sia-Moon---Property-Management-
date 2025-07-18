const fs = require('fs');

const filePath = '/Users/shaunducker/Desktop/Villa Management Bolt/src/app/onboard/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Pattern to match Input components with label prop
const inputPattern = /(\s*)<Input\s+label="([^"]+)"\s+name="([^"]+)"([^>]*?)(?:error=\{[^}]*\})?([^>]*?)>/g;

content = content.replace(inputPattern, (match, indent, label, name, beforeError, afterError) => {
  // Remove error prop if present
  const allProps = (beforeError + afterError).replace(/\s*error=\{[^}]*\}\s*/g, '');
  
  return `${indent}<div className="space-y-2">
${indent}  <Label htmlFor="${name}">${label}</Label>
${indent}  <Input
${indent}    id="${name}"
${indent}    name="${name}"${allProps}>
${indent}  {validationErrors.${name} && (
${indent}    <p className="text-sm text-red-500">{validationErrors.${name}}</p>
${indent}  )}
${indent}</div>`;
});

fs.writeFileSync(filePath, content);
console.log('All Input components have been converted!');
