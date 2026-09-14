const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/funcionarios/novo/NovoFuncionarioForm.tsx', 'utf8');
code = code.replace(/placeholder=\"Nome e sobrenome\"/g, 'placeholder="Nome"');
fs.writeFileSync('src/app/(dashboard)/funcionarios/novo/NovoFuncionarioForm.tsx', code);
