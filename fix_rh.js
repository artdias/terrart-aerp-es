const fs = require('fs');
let code = fs.readFileSync('src/app/(dashboard)/rh/page.tsx', 'utf8');
code = code.replace(/import \{ Users, UserPlus, UserMinus, FileSignature \} from \"lucide-react\";/, 'import { Users, UserPlus, UserMinus, FileSignature, Link as LinkIcon } from "lucide-react";');
code = code.replace(/<\/div>\s*<\/div>\s*\);\s*\}\s*$/,         {/* Card Formulário Online */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: '#9b59b6' }}>
            <LinkIcon size={32} />
          </div>
          <h2 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '8px' }}>Formulário de Candidato</h2>
          <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '24px', lineHeight: '1.5' }}>
            Acesse e copie o link público para enviar a ficha online aos candidatos via WhatsApp ou E-mail.
          </p>
          <Link href="/cadastro-candidato" target="_blank" style={{ background: '#9b59b6', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, width: '100%' }}>
            Abrir Link Público
          </Link>
        </div>

      </div>
    </div>
  );
});
fs.writeFileSync('src/app/(dashboard)/rh/page.tsx', code);
