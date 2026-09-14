const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/funcionarios/[id]/page.tsx', 'utf8');
code = code.replace(/<\/div>\s*<\/div>\s*\{\/\* Card: Configuração de Escala \(Novo Motor\) \*\/\}/g,               {func.signatureUrl && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <strong style={{ color: '#666', fontSize: '0.85rem' }}>Assinatura Digital (Candidato):</strong>
                  <div style={{ marginTop: '8px', border: '1px solid #ddd', padding: '10px', borderRadius: '8px', background: '#fafafa', display: 'inline-block' }}>
                    <img src={func.signatureUrl} alt="Assinatura" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Configuração de Escala (Novo Motor) */});
fs.writeFileSync('src/app/(dashboard)/funcionarios/[id]/page.tsx', code);
