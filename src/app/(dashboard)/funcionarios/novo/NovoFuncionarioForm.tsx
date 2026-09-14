"use client";

import { createEmployee } from "@/actions/employeeActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, X, Paperclip } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface ClientOption {
  id: string;
  companyName: string;
}

interface CargoOption {
  id: string;
  name: string;
}

export default function NovoFuncionarioForm({ clientes, cargos }: { clientes: ClientOption[], cargos: CargoOption[] }) {
  const [cpf, setCpf] = useState("");
  const [rg, setRg] = useState("");
  const [cnh, setCnh] = useState("");
  const [certificates, setCertificates] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const certInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto(null);
    setPhotoPreview(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const handleCNHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCnh(raw.substring(0, 11));
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 3) {
      formatted = raw.replace(/^(\d{3})(\d)/, "$1.$2");
    }
    if (raw.length > 6) {
      formatted = formatted.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (raw.length > 9) {
      formatted = formatted.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    }
    setCpf(formatted.substring(0, 14));
  };

  const handleRGChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (raw.length > 5) {
      formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (raw.length > 8) {
      formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{1})/, "$1.$2.$3-$4");
    }
    setRg(formatted.substring(0, 12));
  };

  const handleCertificatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCertificates(prev => [...prev, ...newFiles]);
      // Reset input value so same files can be selected again if removed
      e.target.value = "";
    }
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
      // Reset input value
      e.target.value = "";
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Enviar os arquivos via onSubmit no Client Component para ter certeza de que o FormData contém apenas as seleções corretas (sem itens excluídos)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      // Removemos os inputs nativos pois seus FileLists são imutáveis e podem conter itens deletados
      formData.delete("certificados-nativos");
      formData.delete("documentos-nativos");
      formData.delete("photo-nativa");

      const toBase64 = (f: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(f);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });

      if (photo) {
        const base64 = await toBase64(photo);
        formData.append("photoData", JSON.stringify({ name: photo.name, data: base64 }));
      }

      for (const file of certificates) {
        const base64 = await toBase64(file);
        formData.append("certificatesData", JSON.stringify({ name: file.name, data: base64 }));
      }

      for (const file of documents) {
        const base64 = await toBase64(file);
        formData.append("documentsData", JSON.stringify({ name: file.name, data: base64 }));
      }

      // Chama a Server Action diretamente
      const result = await createEmployee(formData);
      
      if (result?.error) {
        alert(result.error);
        setLoading(false);
        return;
      }
      
      // Volta para a lista se sucesso
      router.push("/funcionarios");
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      alert("Ocorreu um erro ao salvar o funcionário. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .print-flex { display: flex !important; }
          body { background: white; margin: 0; padding: 0; color: black; }
          .${styles.card} { box-shadow: none !important; border: none !important; padding: 0 !important; }
          input, select { border: none !important; border-bottom: 1px solid #000 !important; border-radius: 0 !important; background: transparent !important; padding: 4px 0 !important; color: black !important; }
          input::placeholder { color: transparent !important; }
        }
        .print-only { display: none; }
        .print-flex { display: none; }
      `}</style>

      <div className={styles.header}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <Link href="/funcionarios" className={styles.backButton}>
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          <button 
            type="button" 
            onClick={() => window.print()}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, color: "#334155" }}
          >
            Imprimir Ficha (Entrevista)
          </button>
        </div>
        <h1 className={styles.title}>Ficha Cadastral do Colaborador</h1>
        <p className={styles.subtitle}>Adicione os dados completos ou imprima para preenchimento manual.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <h3 className={styles.sectionTitle}>Dados Pessoais</h3>
          
          {/* FOTO DE PERFIL */}
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div 
              style={{ 
                width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f1f5f9', 
                border: '2px dashed #cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center',
                overflow: 'hidden', cursor: 'pointer', position: 'relative'
              }}
              onClick={() => photoInputRef.current?.click()}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', padding: '10px' }}>Adicionar Foto</span>
              )}
            </div>
            {photoPreview && (
              <button 
                type="button" 
                onClick={removePhoto} 
                style={{ marginTop: '8px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                Remover foto
              </button>
            )}
            <input 
              type="file" 
              ref={photoInputRef} 
              name="photo-nativa" 
              style={{ display: 'none' }} 
              accept="image/*" 
              onChange={handlePhotoChange} 
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Nome <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="text" id="firstName" name="firstName" required placeholder="Primeiro nome" />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Sobrenome</label>
              <input type="text" id="lastName" name="lastName" placeholder="Sobrenome" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="cpf">CPF <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="cpf" 
                name="cpf" 
                required 
                placeholder="000.000.000-00" 
                value={cpf}
                onChange={handleCPFChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="rg">RG</label>
              <input 
                type="text" 
                id="rg" 
                name="rg" 
                placeholder="00.000.000-0" 
                value={rg}
                onChange={handleRGChange}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="cnh">Carteira de Motorista (CNH)</label>
              <input 
                type="text" 
                id="cnh" 
                name="cnh" 
                placeholder="Apenas números" 
                value={cnh}
                onChange={handleCNHChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="cnhExpiration">Validade da CNH</label>
              <input type="date" id="cnhExpiration" name="cnhExpiration" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="birthDate">Data de Nascimento</label>
              <input type="date" id="birthDate" name="birthDate" />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="gender">Sexo</label>
              <select id="gender" name="gender" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="educationLevel">Escolaridade</label>
            <select id="educationLevel" name="educationLevel" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
              <option value="">Selecione</option>
              <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
              <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
              <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
              <option value="Ensino Médio Completo">Ensino Médio Completo</option>
              <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
              <option value="Ensino Superior Completo">Ensino Superior Completo</option>
            </select>
          </div>

          <h3 className={styles.sectionTitle}>Dados de Contrato & Sistema</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail (Login do Funcionario) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="email" id="email" name="email" required placeholder="joao@email.com" />
            </div>

            <div className={styles.inputGroup}>
              <label>Cargo / Função <span className="no-print" style={{ color: '#e74c3c' }}>*</span></label>
              <div className="no-print" style={{ padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', maxHeight: '150px', overflowY: 'auto' }}>
                {cargos.length === 0 && <span style={{ color: '#666', fontSize: '0.9rem' }}>Nenhum cargo cadastrado.</span>}
                {cargos.map(cargo => (
                  <label key={cargo.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer', fontSize: '0.95rem' }}>
                    <input 
                      type="checkbox" 
                      name="roleTitle" 
                      value={cargo.name} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    {cargo.name}
                  </label>
                ))}
              </div>
              <div className="print-only" style={{ borderBottom: '1px solid #000', marginTop: '1rem', height: '20px' }}></div>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="salary">Salário Base / Pretensão (R$)</label>
              <input type="number" step="0.01" id="salary" name="salary" placeholder="0.00" />
            </div>
            
            {/* Campo Jornada - apenas para impressão */}
            <div className="print-only" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>Jornada de Trabalho Pretendida</label>
              <div style={{ borderBottom: '1px solid #000', marginTop: '1rem', height: '20px' }}></div>
            </div>
          </div>

          <div className="no-print">
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label htmlFor="status">Status do Funcionário</label>
                <select id="status" name="status" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                  <option value="Ativo">Ativo</option>
                  <option value="Ausente">Ausente</option>
                  <option value="Inativo">Inativo</option>
                  <option value="Em Entrevista">Em Entrevista</option>
                </select>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="clientId">Alocar no Cliente (Posto)</label>
                <select id="clientId" name="clientId" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                  <option value="">Sem alocação no momento (Banco de talentos)</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="no-print">
            <h3 className={styles.sectionTitle}>Anexos</h3>
            <div className={styles.formRow} style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
              {/* Certificados */}
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Anexar Certificados</label>
                <div 
                  onClick={() => certInputRef.current?.click()} 
                  style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                >
                  <Paperclip size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Selecionar arquivos...</span>
                </div>
                <input 
                  type="file" 
                  id="certificados-nativos"
                  name="certificados-nativos"
                  ref={certInputRef}
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={handleCertificatesChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <small style={{ color: '#666', marginTop: '4px' }}>Somente PDF, JPG ou PNG.</small>

                {/* Lista de Certificados selecionados */}
                {certificates.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {certificates.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeCertificate(idx)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos Pessoais */}
              <div className={styles.inputGroup} style={{ flex: 1 }}>
                <label>Anexar Documentos Pessoais</label>
                <div 
                  onClick={() => docInputRef.current?.click()} 
                  style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
                >
                  <Paperclip size={20} style={{ color: '#64748b' }} />
                  <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Selecionar arquivos...</span>
                </div>
                <input 
                  type="file" 
                  id="documentos-nativos"
                  name="documentos-nativos"
                  ref={docInputRef}
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={handleDocumentsChange}
                  accept=".pdf,.png,.jpg,.jpeg"
                />
                <small style={{ color: '#666', marginTop: '4px' }}>Somente PDF, JPG ou PNG.</small>

                {/* Lista de Documentos selecionados */}
                {documents.length > 0 && (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {documents.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{file.name}</span>
                        <button 
                          type="button" 
                          onClick={() => removeDocument(idx)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#ef4444' }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECÇÃO EXCLUSIVA DE IMPRESSÃO (LGPD & ASSINATURA) */}
          <div className="print-only" style={{ marginTop: '2rem', borderTop: '2px solid #000', paddingTop: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Termo de Consentimento - LGPD</h3>
            <p style={{ fontSize: '0.85rem', textAlign: 'justify', lineHeight: '1.6', marginBottom: '2rem' }}>
              Declaro que as informações acima são verdadeiras e consinto expressamente, de forma livre e informada, com a coleta, uso, armazenamento e tratamento dos meus dados pessoais e dados pessoais sensíveis pela Elite Soluções, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), para a finalidade exclusiva de participação em processo seletivo, avaliação de currículo e possíveis contratações futuras. Compreendo que posso revogar este consentimento a qualquer momento, mediante solicitação formal.
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '4rem' }}>
              <div style={{ textAlign: 'center', flex: 1, paddingRight: '20px' }}>
                <div style={{ borderBottom: '1px solid #000', width: '90%', margin: '0 auto 8px auto' }}></div>
                <label style={{ fontSize: '0.85rem' }}>Local e Data</label>
              </div>
              <div style={{ textAlign: 'center', flex: 1, paddingLeft: '20px' }}>
                <div style={{ borderBottom: '1px solid #000', width: '90%', margin: '0 auto 8px auto' }}></div>
                <label style={{ fontSize: '0.85rem' }}>Assinatura do(a) Candidato(a)</label>
              </div>
            </div>
          </div>

          <div className={`no-print ${styles.footer}`}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Funcionário"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

