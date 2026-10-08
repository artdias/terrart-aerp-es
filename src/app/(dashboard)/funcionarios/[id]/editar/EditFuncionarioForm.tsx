"use client";

import { updateEmployee, deleteAttachment } from "@/actions/employeeActions";
import styles from "../../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, X, Paperclip, Trash2, Download } from "lucide-react";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

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
  photoUrl: string | null;
  salary: number | null;
  address: string | null;
  previousExperience: string | null;
  uniformSize?: string | null;
  pantsSize?: string | null;
  shoeSize?: string | null;
  uniformMeasurements?: string | null;
  travelAvailability?: boolean;
  overtimeAvailability?: boolean;
  isMei?: boolean;
  meiCnpj?: string | null;
  meiRazaoSocial?: string | null;
  meiNomeFantasia?: string | null;
  meiInscricaoEstadual?: string | null;
  meiInscricaoMunicipal?: string | null;
  workplaceId: string | null;
  workplace?: {
    clientId: string;
  } | null;
  user: {
    name: string;
    email: string;
  } | null;
  attachments?: {
    id: string;
    fileName: string;
    type: string;
    fileUrl: string;
  }[];
}

interface ClientOption {
  id: string;
  companyName: string;
}

interface CargoOption {
  id: string;
  name: string;
}

export default function EditFuncionarioForm({ 
  employee, 
  clientes,
  cargos
}: { 
  employee: EmployeeType; 
  clientes: ClientOption[];
  cargos: CargoOption[];
}) {
  const [cpf, setCpf] = useState(employee.cpf);
  const [rg, setRg] = useState(employee.rg || "");
  const [cnh, setCnh] = useState(employee.cnh || "");
  const [isMei, setIsMei] = useState(employee.isMei || false);
  const [meiCnpj, setMeiCnpj] = useState(employee.meiCnpj || "");

  const handleMeiCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    let formatted = raw;
    if (raw.length > 2) {
      formatted = raw.replace(/^(\d{2})(\d)/, "$1.$2");
    }
    if (raw.length > 5) {
      formatted = formatted.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    }
    if (raw.length > 8) {
      formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4");
    }
    if (raw.length > 12) {
      formatted = formatted.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
    }
    setMeiCnpj(formatted.substring(0, 18));
  };
  const [certificates, setCertificates] = useState<File[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState(employee.attachments || []);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(employee.photoUrl || null);
  
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

  const downloadPhoto = () => {
    if (!photoPreview) return;
    const a = document.createElement("a");
    a.href = photoPreview;
    a.download = `foto-${employee.firstName || "funcionario"}-${employee.lastName || ""}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

  const handleDeleteExistingAttachment = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este anexo?")) {
      const res = await deleteAttachment(id);
      if (res.success) {
        setExistingAttachments(prev => prev.filter(a => a.id !== id));
        router.refresh();
      } else {
        alert(res.error);
      }
    }
  };

  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

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
      } else if (!photoPreview) {
        // Se removeu a foto, enviar flag para deletar
        formData.append("photoData", JSON.stringify({ data: null }));
      }

      for (const file of certificates) {
        const base64 = await toBase64(file);
        formData.append("certificatesData", JSON.stringify({ name: file.name, data: base64 }));
      }

      for (const file of documents) {
        const base64 = await toBase64(file);
        formData.append("documentsData", JSON.stringify({ name: file.name, data: base64 }));
      }

      const result = await updateEmployee(employee.id, formData);
      
      if (result?.error) {
        alert(result.error);
        setLoading(false);
        return;
      }
      
      router.push(`/funcionarios/${employee.id}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao atualizar funcionário:", error);
      alert("Ocorreu um erro ao atualizar o funcionário. Tente novamente.");
      setLoading(false);
    }
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

          {/* FOTO DE PERFIL */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px', alignItems: 'center' }}>
                <button 
                  type="button" 
                  onClick={downloadPhoto} 
                  style={{ 
                    background: '#eff6ff', 
                    border: '1px solid #bfdbfe', 
                    color: '#2563eb', 
                    padding: '4px 10px', 
                    borderRadius: '6px', 
                    fontSize: '0.82rem', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="Baixar imagem da foto de perfil"
                >
                  <Download size={14} /> Baixar foto
                </button>
                <button 
                  type="button" 
                  onClick={removePhoto} 
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.85rem', cursor: 'pointer' }}
                >
                  Remover foto
                </button>
              </div>
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
              <input type="text" id="firstName" name="firstName" required defaultValue={employee.firstName || ""} placeholder="Primeiro nome" />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Sobrenome</label>
              <input type="text" id="lastName" name="lastName" defaultValue={employee.lastName || ""} placeholder="Sobrenome" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="address">Endereço completo</label>
              <input type="text" id="address" name="address" defaultValue={employee.address || ""} placeholder="Rua, número, bairro, cidade - UF" />
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

          <div className={styles.inputGroup} style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="previousExperience">Experiências Anteriores (Últimos empregos, empresas e cargos)</label>
            <textarea 
              id="previousExperience" 
              name="previousExperience" 
              rows={4}
              defaultValue={employee.previousExperience || ""}
              placeholder="Ex: Empresa X (2020-2022) - Cargo: Vendedor..."
              style={{ width: '100%', resize: 'vertical', marginTop: '5px' }}
            />
          </div>

          <h3 className={styles.sectionTitle}>Tamanhos de Uniforme & Calçado</h3>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="uniformSize">Tamanho do Uniforme / Camisa</label>
              <input 
                type="text" 
                id="uniformSize" 
                name="uniformSize" 
                defaultValue={employee.uniformSize || ""}
                placeholder="Ex: P, M, G, GG, 40..."
                list="uniformSizeOptions"
              />
              <datalist id="uniformSizeOptions">
                <option value="PP" />
                <option value="P" />
                <option value="M" />
                <option value="G" />
                <option value="GG" />
                <option value="XGG" />
                <option value="EXG" />
                <option value="36" />
                <option value="38" />
                <option value="40" />
                <option value="42" />
                <option value="44" />
                <option value="46" />
              </datalist>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="pantsSize">Tamanho da Calça / Bermuda</label>
              <input 
                type="text" 
                id="pantsSize" 
                name="pantsSize" 
                defaultValue={employee.pantsSize || ""}
                placeholder="Ex: 38, 40, 42, 44..."
                list="pantsSizeOptions"
              />
              <datalist id="pantsSizeOptions">
                <option value="34" />
                <option value="36" />
                <option value="38" />
                <option value="40" />
                <option value="42" />
                <option value="44" />
                <option value="46" />
                <option value="48" />
                <option value="50" />
                <option value="52" />
                <option value="P" />
                <option value="M" />
                <option value="G" />
                <option value="GG" />
              </datalist>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="shoeSize">Número do Calçado / Bota</label>
              <input 
                type="text" 
                id="shoeSize" 
                name="shoeSize" 
                defaultValue={employee.shoeSize || ""}
                placeholder="Ex: 37, 38, 39, 40, 41..."
                list="shoeSizeOptions"
              />
              <datalist id="shoeSizeOptions">
                <option value="33" />
                <option value="34" />
                <option value="35" />
                <option value="36" />
                <option value="37" />
                <option value="38" />
                <option value="39" />
                <option value="40" />
                <option value="41" />
                <option value="42" />
                <option value="43" />
                <option value="44" />
                <option value="45" />
                <option value="46" />
              </datalist>
            </div>
          </div>

          <div className={styles.formRow} style={{ marginBottom: '1.5rem' }}>
            <div className={styles.inputGroup} style={{ width: '100%' }}>
              <label htmlFor="uniformMeasurements">Medidas Detalhadas do Uniforme (Opcional)</label>
              <input 
                type="text" 
                id="uniformMeasurements" 
                name="uniformMeasurements" 
                defaultValue={employee.uniformMeasurements || ""}
                placeholder="Ex: Busto/Peito: 98cm, Cintura: 82cm, Quadril: 102cm, Comprimento: 75cm" 
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Dados da MEI (Pessoa Jurídica)</h3>
          <div className={styles.formRow} style={{ marginBottom: '1rem' }}>
            <div className={styles.inputGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                <input 
                  type="checkbox" 
                  name="isMei" 
                  checked={isMei} 
                  onChange={(e) => setIsMei(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Possui MEI (Prestador de Serviço PJ)?
              </label>
            </div>
          </div>

          {isMei && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="meiCnpj">CNPJ da MEI</label>
                  <input 
                    type="text" 
                    id="meiCnpj" 
                    name="meiCnpj" 
                    placeholder="00.000.000/0000-00" 
                    value={meiCnpj}
                    onChange={handleMeiCNPJChange}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="meiRazaoSocial">Razão Social da MEI</label>
                  <input 
                    type="text" 
                    id="meiRazaoSocial" 
                    name="meiRazaoSocial" 
                    defaultValue={employee.meiRazaoSocial || ""}
                    placeholder="Ex: NOME DO FUNCIONARIO 12345678900" 
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="meiNomeFantasia">Nome Fantasia (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiNomeFantasia" 
                    name="meiNomeFantasia" 
                    defaultValue={employee.meiNomeFantasia || ""}
                    placeholder="Nome Fantasia" 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="meiInscricaoEstadual">Inscrição Estadual (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiInscricaoEstadual" 
                    name="meiInscricaoEstadual" 
                    defaultValue={employee.meiInscricaoEstadual || ""}
                    placeholder="Isento ou Nº" 
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="meiInscricaoMunicipal">Inscrição Municipal (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiInscricaoMunicipal" 
                    name="meiInscricaoMunicipal" 
                    defaultValue={employee.meiInscricaoMunicipal || ""}
                    placeholder="Nº Inscrição" 
                  />
                </div>
              </div>
            </div>
          )}

          <h3 className={styles.sectionTitle}>Dados de Contrato & Sistema</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail (Login) <span style={{ color: '#e74c3c' }}>*</span></label>
              <input type="email" id="email" name="email" required defaultValue={employee.user?.email || ""} placeholder="joao@email.com" />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="salary">Salário Base / Pretensão (R$)</label>
              <input type="number" step="0.01" id="salary" name="salary" defaultValue={employee.salary || ""} placeholder="0.00" />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '8px', display: 'block' }}>
                Cargo / Função <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '10px', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid #ddd', 
                background: '#fafafa', 
                maxHeight: '220px', 
                overflowY: 'auto' 
              }}>
                {cargos.length === 0 && <span style={{ color: '#666', fontSize: '0.9rem', gridColumn: '1 / -1' }}>Nenhum cargo cadastrado.</span>}
                {cargos.map(cargo => (
                  <label 
                    key={cargo.id} 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      padding: '10px 12px', 
                      background: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '6px', 
                      cursor: 'pointer', 
                      transition: 'all 0.15s ease',
                      margin: 0
                    }}
                  >
                    <input 
                      type="checkbox" 
                      name="roleTitle" 
                      value={cargo.name} 
                      defaultChecked={employee.roleTitle?.split(", ").includes(cargo.name)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#003366' }}
                    />
                    <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>{cargo.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '8px' }}>
              Disponibilidade & Preferências
            </label>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer', 
                  padding: '12px 14px', 
                  background: '#fafafa', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  fontWeight: 500,
                  margin: 0,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <input type="checkbox" name="disponibilidadeHorario" defaultChecked={employee.overtimeAvailability} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }} />
                <span>Disponível para cobrir faltas/plantão fora da escala</span>
              </label>
            </div>
            <div className={styles.inputGroup}>
              <label 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px', 
                  cursor: 'pointer', 
                  padding: '12px 14px', 
                  background: '#fafafa', 
                  border: '1px solid #ddd', 
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#1e293b',
                  fontWeight: 500,
                  margin: 0,
                  width: '100%',
                  boxSizing: 'border-box'
                }}
              >
                <input type="checkbox" name="disponibilidadeViagem" defaultChecked={employee.travelAvailability} style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }} />
                <span>Disponibilidade de fazer viagens</span>
              </label>
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

          <h3 className={styles.sectionTitle}>Anexos e Documentos</h3>
          <div className={styles.formRow} style={{ marginBottom: '2rem', alignItems: 'flex-start' }}>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label>Certificados</label>

              {/* Anexos Existentes */}
              {existingAttachments.filter(a => a.type === "CERTIFICATE").length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {existingAttachments.filter(a => a.type === "CERTIFICATE").map((file) => (
                    <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <a href={file.fileUrl} download={file.fileName} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%', color: '#0369a1', textDecoration: 'none' }}>{file.fileName}</a>
                      <button type="button" onClick={() => handleDeleteExistingAttachment(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Excluir anexo">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div 
                onClick={() => certInputRef.current?.click()} 
                style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <Paperclip size={20} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Adicionar novos certificados...</span>
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
              <label>Documentos Pessoais</label>

              {/* Anexos Existentes */}
              {existingAttachments.filter(a => a.type === "DOCUMENT").length > 0 && (
                <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {existingAttachments.filter(a => a.type === "DOCUMENT").map((file) => (
                    <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: '#e0f2fe', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <a href={file.fileUrl} download={file.fileName} style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '80%', color: '#0369a1', textDecoration: 'none' }}>{file.fileName}</a>
                      <button type="button" onClick={() => handleDeleteExistingAttachment(file.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }} title="Excluir anexo">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div 
                onClick={() => docInputRef.current?.click()} 
                style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
              >
                <Paperclip size={20} style={{ color: '#64748b' }} />
                <span style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500 }}>Adicionar novos documentos...</span>
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
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
