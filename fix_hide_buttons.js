const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/funcionarios/novo/NovoFuncionarioForm.tsx', 'utf8');

code = code.replace(/<button type=\"button\" onClick=\{handleAddCargo\}.*?Adicionar\s*<\/button>/s, '{!isPublic && (\n                    $& \n                  )}');
code = code.replace(/<button type=\"button\" onClick=\{\(\) => handleDeleteCargo.*?<\/button>/gs, '{!isPublic && (\n                        $& \n                      )}');

code = code.replace(/<button type=\"button\" onClick=\{handleAddJornada\}.*?Adicionar\s*<\/button>/s, '{!isPublic && (\n                    $& \n                  )}');
code = code.replace(/<button type=\"button\" onClick=\{\(\) => handleDeleteJornada.*?<\/button>/gs, '{!isPublic && (\n                        $& \n                      )}');

fs.writeFileSync('src/app/(dashboard)/funcionarios/novo/NovoFuncionarioForm.tsx', code);
