"use client";

import { updateEmployee } from "@/actions/employeeActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, X, Paperclip } from "lucide-react";
import { useState, useRef } from "react";

interface EmployeeType {
  id: string;
  firstName: string | null;
  lastName: string | null;
  cpf: string;
  rg: string | null;
  cnh: string | null;
  cnhExpiration: string | null;
  birthDate: string | null;
  gender: string | null;
  educationLevel: string | null;
  roleTitle: string;
  status: string;
  workplaceId: string | null;
  workplace?: {
    clientId: string;
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
}

interface ClientOption {
  id: string;
  companyName: string;
}

export default function EditFuncionarioForm({ 
  employee, 
  clientes 
}: { 
  employee: EmployeeType; 
  clientes: ClientOption[] 
}) {
  const [cpf, setCpf] = useState(employee.cpf);
  const [rg, setRg] = useState(employee.rg || "");
  const [cnh, setCnh] = useState(employee.cnh || "");
  const [certificates, setCertificates] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  
  const certInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

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

  const handleCNHChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setCnh(raw.substring(0, 11));
  };

  const handleCertificatesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setCertificates(prev => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const handleDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setDocuments(prev => [...prev, ...newFiles]);
      e.target.value = "";
    }
  };

  const removeCertificate = (index: number) => {
    setCertificates(prev => prev.filter((_, i) => i !== index));
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    formData.delete("certificados-nativos");
    formData.delete("documentos-nativos");

    certificates.forEach((file) => {
      formData.append("certificates", file);
    });

    documents.forEach((file) => {
      formData.append("documents", file);
    });

    await updateEmployee(employee.id, formData);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/funcionarios" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Funcionário</h1>
        <p className={styles.subtitle}>Modifique os dados do cadastro do colaborador.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <h3 className={styles.sectionTitle}>Dados Pessoais</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Nome <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="text" id="firstName" name="firstName" required defaultValue={employee.firstName || ""} placeholder="Primeiro nome" />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Sobrenome</label>
              <input type="text" id="lastName" name="lastName" defaultValue={employee.lastName || ""} placeholder="Sobrenome" />
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
              <input type="date" id="cnhExpiration" name="cnhExpiration" defaultValue={employee.cnhExpiration || ""} />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="birthDate">Data de Nascimento</label>
              <input type="date" id="birthDate" name="birthDate" defaultValue={employee.birthDate || ""} />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="gender">Sexo</label>
              <select id="gender" name="gender" defaultValue={employee.gender || ""} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="educationLevel">Escolaridade</label>
            <select id="educationLevel" name="educationLevel" defaultValue={employee.educationLevel || ""} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
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
              <label htmlFor="email">E-mail (Login) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="email" id="email" name="email" required defaultValue={employee.user?.email || ""} placeholder="joao@email.com" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="roleTitle">Cargo / Função <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="text" id="roleTitle" name="roleTitle" required defaultValue={employee.roleTitle || ""} placeholder="Ex: Porteiro, Zelador" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="status">Status do Funcionário</label>
              <select id="status" name="status" defaultValue={employee.status || "Ativo"} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="Ativo">Ativo</option>
                <option value="Ausente">Ausente</option>
                <option value="Inativo">Inativo</option>
                <option value="Em Entrevista">Em Entrevista</option>
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="clientId">Alocar no Cliente (Posto)</label>
              <select id="clientId" name="clientId" defaultValue={employee.workplace?.clientId || ""} style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Sem alocação no momento (Banco de talentos)</option>
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Adicionar Novos Anexos</h3>
          <div className={styles.formRow} style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Adicionar Certificados</label>
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
              {certificates.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {certificates.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{file.name}</span>
                      <button type="button" onClick={() => removeCertificate(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Adicionar Documentos Pessoais</label>
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
              {documents.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {documents.map((file, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%' }}>{file.name}</span>
                      <button type="button" onClick={() => removeDocument(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
