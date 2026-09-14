const fs = require('fs');
let code = fs.readFileSync('src/actions/employeeActions.ts', 'utf8');
code = code.replace(/const isPublic = formData.get\(\"isPublic\"\) === \"true\";/g, 'const isPublic = formData.get("isPublic") === "true";\n      const signatureUrl = formData.get("signatureUrl") as string;');
code = code.replace(/updateData\.photoUrl = photoUrl;\n    \}/g, 'updateData.photoUrl = photoUrl;\n    }\n    if (signatureUrl) updateData.signatureUrl = signatureUrl;');
fs.writeFileSync('src/actions/employeeActions.ts', code);
