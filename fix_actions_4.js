const fs = require('fs');
let code = fs.readFileSync('src/actions/employeeActions.ts', 'utf8');
code = code.replace(/const photoUrl = formData.get\(\"photoUrl\"\) as string;/g, 'const photoUrl = formData.get("photoUrl") as string;\n      const signatureUrl = formData.get("signatureUrl") as string;');
code = code.replace(/photoUrl,/g, 'photoUrl,\n          signatureUrl,');
fs.writeFileSync('src/actions/employeeActions.ts', code);
