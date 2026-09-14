const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/funcionarios/page.tsx', 'utf8');
code = code.replace(/import Link from \"next\/link\";/, 'import Link from "next/link";\nimport CopyLinkButton from "@/components/CopyLinkButton";');
code = code.replace(/<Link href="\/cadastro-candidato" target="_blank" className=\{styles\.actionBtn\} style=\{\{ background: '#9b59b6'.*?>\s*<ExternalLink size=\{20\} \/>\s*<span>Link p\/ Candidato<\/span>\s*<\/Link>/s, <CopyLinkButton url="/cadastro-candidato" label="Copiar Link" style={{ background: '#9b59b6', color: 'white', textDecoration: 'none', padding: '10px 16px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }} />);
fs.writeFileSync('src/app/(dashboard)/funcionarios/page.tsx', code);
