"use client";

import { createEmployee, createJobRole, createShiftPattern, deleteJobRole, deleteShiftPattern } from "@/actions/employeeActions";
import styles from "../../clientes/novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft, X, Paperclip, Plus, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ClientOption {
  id: string;
  companyName: string;
}

interface CargoOption {
  id: string;
  name: string;
}

interface JornadaOption {
  id: string;
  name: string;
}

export default function NovoFuncionarioForm({ clientes, cargos, jornadas, isPublic = false }: { clientes: ClientOption[], cargos: CargoOption[], jornadas: JornadaOption[], isPublic?: boolean }) {
  const [cpf, setCpf] = useState("");
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: any) => {
    if (e.touches && e.cancelable) {
      e.preventDefault();
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    setIsDrawing(true);
  };
  
  const draw = (e: any) => {
    if (e.touches && e.cancelable) {
      e.preventDefault();
    }
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };
  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignature(canvasRef.current.toDataURL("image/png"));
    }
  };
  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setSignature(null);
    }
  };

  const [rg, setRg] = useState("");
  const [cnh, setCnh] = useState("");
  const [isMei, setIsMei] = useState(false);
  const [meiCnpj, setMeiCnpj] = useState("");

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("print") === "true") {
        setTimeout(() => {
          handlePrint();
        }, 500); // pequeno delay para garantir que CSS renderizou
      }
    }
  }, []);

  const handleAddCargo = async () => {
    const name = window.prompt("Digite o nome do novo Cargo/Função:");
    if (!name) return;
    const res = await createJobRole(name);
    if (res.error) alert(res.error);
    else router.refresh();
  };

  const handleAddJornada = async () => {
    const name = window.prompt("Digite o nome da nova Jornada (Ex: 12x36 Diurno):");
    if (!name) return;
    const res = await createShiftPattern(name);
    if (res.error) alert(res.error);
    else router.refresh();
  };

  const handleDeleteCargo = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o cargo "${name}"?`)) return;
    const res = await deleteJobRole(id);
    if (res.error) alert(res.error);
    else router.refresh();
  };

  const handleDeleteJornada = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a jornada "${name}"?`)) return;
    const res = await deleteShiftPattern(id);
    if (res.error) alert(res.error);
    else router.refresh();
  };

  // Enviar os arquivos via onSubmit no Client Component para ter certeza de que o FormData contém apenas as seleções corretas (sem itens excluídos)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits && cpfDigits.length !== 11) {
      alert("Por favor, preencha o CPF completo (11 dígitos).");
      return;
    }
    
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
      
      if (isPublic) {
        alert("Ficha cadastral enviada com sucesso!");
        window.location.href = "https://elitese.com.br/";
      } else {
        router.push("/funcionarios");
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao salvar funcionário:", error);
      alert("Ocorreu um erro ao salvar o funcionário. Tente novamente.");
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    const dateStr = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-');
    document.title = `AERP - Cadastro Entrevista ${dateStr}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  return (
    <div className={styles.container}>
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { background: white; margin: 0; padding: 0; color: black; font-family: Arial, sans-serif; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          
          .${styles.container} { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
          .${styles.card} { box-shadow: none !important; border: none !important; padding: 0 !important; }
          .${styles.header}, .${styles.title}, .${styles.subtitle} { display: none !important; }
          
          .print-header { text-align: center; margin-bottom: 20px; display: block !important; }
          .print-header h1 { font-size: 20px; color: #1f3b58; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
          
          .print-section-title {
            background-color: #1f3b58 !important;
            color: white !important;
            padding: 6px 10px !important;
            font-size: 11px !important;
            font-weight: bold !important;
            text-transform: uppercase !important;
            margin: 16px 0 8px 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            display: block !important;
          }
          
          .print-grid {
            display: grid !important;
            grid-template-columns: repeat(12, 1fr) !important;
            gap: 8px !important;
            margin-bottom: 8px !important;
          }
          
          .print-box {
            border: 1px solid #b0b0b0 !important;
            padding: 8px 10px !important;
            border-radius: 2px !important;
            display: flex !important;
            flex-direction: column !important;
            min-height: 50px !important;
            background: white !important;
          }
          
          .print-box label {
            font-size: 9px !important;
            font-weight: bold !important;
            color: #333 !important;
            margin-bottom: 4px !important;
          }
          
          .print-box input, .print-box select, .print-box textarea {
            border: none !important;
            background: transparent !important;
            font-size: 11px !important;
            padding: 0 !important;
            color: #333 !important;
            width: 100% !important;
            resize: none !important;
            outline: none !important;
            margin: 0 !important;
          }
          
          .print-box input::placeholder, .print-box textarea::placeholder {
            color: transparent !important;
          }
          
          .col-12 { grid-column: span 12 !important; }
          .col-6 { grid-column: span 6 !important; }
          .col-4 { grid-column: span 4 !important; }
          .col-8 { grid-column: span 8 !important; }
        }
        .print-header, .print-section-title { display: none; }
      `}</style>

      <div className={styles.header}>
        {!isPublic && (
          <div className="no-print" style={{ display: "flex", justifyContent: "space-between", width: "100%", flexWrap: "wrap", gap: "10px" }}>
            <Link href="/funcionarios" className={styles.backButton}>
              <ArrowLeft size={20} />
              <span>Voltar</span>
            </Link>
            <button 
              type="button" 
              onClick={handlePrint}
              style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 12px", borderRadius: "6px", cursor: "pointer", fontWeight: 600, color: "#334155" }}
            >
              Imprimir Ficha (Entrevista)
            </button>
          </div>
        )}
        
        {/* LOGO DA EMPRESA (TELA / CELULAR / DESKTOP) */}
        <div className="no-print" style={{ textAlign: "center", width: "100%", margin: "8px 0 16px 0" }}>
          <img 
            src="/logo.png" 
            alt="Logo Elite Soluções" 
            style={{ maxHeight: "85px", maxWidth: "240px", width: "auto", objectFit: "contain", display: "inline-block" }} 
          />
        </div>

        <h1 className={styles.title}>Ficha Cadastral do Colaborador</h1>
        <p className={styles.subtitle}>Adicione os dados completos ou imprima para preenchimento manual.</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <input type="hidden" name="isPublic" value={isPublic ? "true" : "false"} />
          
          <div className="print-header">
            <img src="/logo.png" alt="Logo AERP" style={{ display: 'block', margin: '0 auto 15px auto', maxHeight: '90px', objectFit: 'contain' }} />
            <h1>Ficha Cadastral do Colaborador</h1>
          </div>

          <div className="print-section-title">01 • DADOS PESSOAIS</div>
          
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

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <label htmlFor="firstName">Nome completo <span className="no-print" style={{ color: '#e74c3c' }}>*</span></label>
              <div style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}>
                <input type="text" id="firstName" name="firstName" required placeholder="Nome" style={{ flex: '1 1 200px' }} />
                <input type="text" id="lastName" name="lastName" placeholder="Sobrenome" className="no-print" style={{ flex: '1 1 200px' }} />
              </div>
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <label htmlFor="address">Endereço completo</label>
              <input type="text" id="address" name="address" placeholder="Rua, número, bairro, cidade - UF" />
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label htmlFor="cpf">CPF <span className="no-print" style={{ color: '#e74c3c' }}>*</span></label>
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
            <div className={`print-box col-6 ${styles.inputGroup}`}>
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

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label htmlFor="cnh">Carteira de Motorista (CNH)</label>
              <input 
                type="text" 
                id="cnh" 
                name="cnh" 
                placeholder="" 
                value={cnh}
                onChange={handleCNHChange}
              />
            </div>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label htmlFor="cnhExpiration">Validade da CNH</label>
              <input type="date" id="cnhExpiration" name="cnhExpiration" className="no-print" />
              <div className="print-only" style={{ color: '#555', marginTop: '4px' }}>____ / ____ / ________</div>
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="birthDate">Data de nascimento</label>
              <input type="date" id="birthDate" name="birthDate" className="no-print" />
              <div className="print-only" style={{ color: '#555', marginTop: '4px' }}>____ / ____ / ________</div>
            </div>
            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="gender">Sexo</label>
              <select id="gender" name="gender" className="no-print" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Selecione</option>
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="educationLevel">Escolaridade</label>
              <select id="educationLevel" name="educationLevel" className="no-print" style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa' }}>
                <option value="">Selecione</option>
                <option value="Ensino Fundamental Incompleto">Ensino Fundamental Incompleto</option>
                <option value="Ensino Fundamental Completo">Ensino Fundamental Completo</option>
                <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                <option value="Ensino Superior Incompleto">Ensino Superior Incompleto</option>
                <option value="Ensino Superior Completo">Ensino Superior Completo</option>
              </select>
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <label htmlFor="previousExperience">Experiências Anteriores (Últimos empregos, empresas e cargos)</label>
              <textarea 
                id="previousExperience" 
                name="previousExperience" 
                rows={4}
                placeholder="Ex: Empresa X (2020-2022) - Cargo: Vendedor..."
                className="no-print"
                style={{ width: '100%', resize: 'vertical', marginTop: '5px' }}
              />
              <div className="print-only" style={{ height: '120px' }}></div>
            </div>
          </div>

          <div className="print-section-title" style={{ marginTop: '20px' }}>02 • UNIFORME, VESTUÁRIO & CALÇADO</div>
          <h3 className={`${styles.sectionTitle} no-print`} style={{ marginTop: '1.5rem' }}>Tamanhos de Uniforme & Calçado</h3>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="uniformSize">Tamanho do Uniforme / Camisa</label>
              <input 
                type="text" 
                id="uniformSize" 
                name="uniformSize" 
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

            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="pantsSize">Tamanho da Calça / Bermuda</label>
              <input 
                type="text" 
                id="pantsSize" 
                name="pantsSize" 
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

            <div className={`print-box col-4 ${styles.inputGroup}`}>
              <label htmlFor="shoeSize">Número do Calçado / Bota</label>
              <input 
                type="text" 
                id="shoeSize" 
                name="shoeSize" 
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

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <label htmlFor="uniformMeasurements">Medidas Detalhadas do Uniforme (Opcional)</label>
              <input 
                type="text" 
                id="uniformMeasurements" 
                name="uniformMeasurements" 
                placeholder="Ex: Busto/Peito: 98cm, Cintura: 82cm, Quadril: 102cm, Comprimento: 75cm" 
              />
            </div>
          </div>

          <div className="print-section-title" style={{ marginTop: '20px' }}>03 • DADOS DA MEI (PESSOA JURÍDICA)</div>
          
          <div className={`${styles.formRow} print-grid`} style={{ marginBottom: '1rem' }}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
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
              <div className={`${styles.formRow} print-grid`}>
                <div className={`print-box col-6 ${styles.inputGroup}`}>
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
                <div className={`print-box col-6 ${styles.inputGroup}`}>
                  <label htmlFor="meiRazaoSocial">Razão Social da MEI</label>
                  <input 
                    type="text" 
                    id="meiRazaoSocial" 
                    name="meiRazaoSocial" 
                    placeholder="Ex: NOME DO FUNCIONARIO 12345678900" 
                  />
                </div>
              </div>

              <div className={`${styles.formRow} print-grid`}>
                <div className={`print-box col-4 ${styles.inputGroup}`}>
                  <label htmlFor="meiNomeFantasia">Nome Fantasia (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiNomeFantasia" 
                    name="meiNomeFantasia" 
                    placeholder="Nome Fantasia" 
                  />
                </div>
                <div className={`print-box col-4 ${styles.inputGroup}`}>
                  <label htmlFor="meiInscricaoEstadual">Inscrição Estadual (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiInscricaoEstadual" 
                    name="meiInscricaoEstadual" 
                    placeholder="Isento ou Nº" 
                  />
                </div>
                <div className={`print-box col-4 ${styles.inputGroup}`}>
                  <label htmlFor="meiInscricaoMunicipal">Inscrição Municipal (Opcional)</label>
                  <input 
                    type="text" 
                    id="meiInscricaoMunicipal" 
                    name="meiInscricaoMunicipal" 
                    placeholder="Nº Inscrição" 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="print-section-title" style={{ marginTop: '20px' }}>03 • DADOS DE CONTRATO & SISTEMA</div>
          
          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label htmlFor="email">Melhor e-mail <span className="no-print" style={{ color: '#e74c3c' }}>*</span></label>
              <input type="email" id="email" name="email" required placeholder="ex.: nome@empresa.com" />
            </div>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label htmlFor="salary">Salário base / Pretensão (R$)</label>
              <input type="number" step="0.01" id="salary" name="salary" placeholder="Ex.: 0,00" />
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <div className="no-print" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
                    Cargo / Função Pretendida <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  {!isPublic && (
                    <button 
                      type="button" 
                      onClick={handleAddCargo} 
                      style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        color: '#0284c7', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        fontWeight: 600 
                      }}
                    >
                      <Plus size={14} /> Adicionar Cargo
                    </button>
                  )}
                </div>

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
                        justifyContent: 'space-between', 
                        padding: '10px 12px', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        transition: 'all 0.15s ease',
                        userSelect: 'none',
                        margin: 0,
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <input 
                          type="checkbox" 
                          name="roleTitle" 
                          value={cargo.name} 
                          style={{ width: '18px', height: '18px', minWidth: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-word', flex: 1 }}>{cargo.name}</span>
                      </div>
                      {!isPublic && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); handleDeleteCargo(cargo.id, cargo.name); }} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }} 
                          title="Excluir Cargo"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="print-only">
                <label>Cargo / Função</label>
              </div>
            </div>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-12 ${styles.inputGroup}`}>
              <div className="no-print" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333' }}>
                    Jornada de Trabalho Pretendida
                  </label>
                  {!isPublic && (
                    <button 
                      type="button" 
                      onClick={handleAddJornada} 
                      style={{ 
                        background: '#f0f9ff', 
                        border: '1px solid #bae6fd', 
                        color: '#0284c7', 
                        padding: '4px 10px', 
                        borderRadius: '6px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '4px', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        fontWeight: 600 
                      }}
                    >
                      <Plus size={14} /> Adicionar Jornada
                    </button>
                  )}
                </div>

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
                  {jornadas.length === 0 && <span style={{ color: '#666', fontSize: '0.9rem', gridColumn: '1 / -1' }}>Nenhuma jornada cadastrada.</span>}
                  {jornadas.map(jornada => (
                    <label 
                      key={jornada.id} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        padding: '10px 12px', 
                        background: '#ffffff', 
                        border: '1px solid #e2e8f0', 
                        borderRadius: '6px', 
                        cursor: 'pointer', 
                        transition: 'all 0.15s ease',
                        userSelect: 'none',
                        margin: 0,
                        width: '100%',
                        boxSizing: 'border-box'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                        <input 
                          type="checkbox" 
                          name="jornadaPretendida" 
                          value={jornada.name} 
                          style={{ width: '18px', height: '18px', minWidth: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }}
                        />
                        <span style={{ fontSize: '0.9rem', color: '#1e293b', fontWeight: 500, wordBreak: 'break-word', flex: 1 }}>{jornada.name}</span>
                      </div>
                      {!isPublic && (
                        <button 
                          type="button" 
                          onClick={(e) => { e.preventDefault(); handleDeleteJornada(jornada.id, jornada.name); }} 
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', flexShrink: 0 }} 
                          title="Excluir Jornada"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </label>
                  ))}
                </div>
              </div>
              <div className="print-only">
                <label>Jornada de trabalho pretendida</label>
              </div>
            </div>
          </div>

          <div className="no-print" style={{ marginTop: '8px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', display: 'block', marginBottom: '8px' }}>
              Disponibilidade & Preferências
            </label>
          </div>

          <div className={`${styles.formRow} print-grid`}>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label 
                className="no-print" 
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
                <input type="checkbox" name="disponibilidadeHorario" style={{ width: '18px', height: '18px', minWidth: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }} />
                <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.4' }}>Disponível para cobrir faltas/plantão fora da escala</span>
              </label>
              <div className="print-only">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid #333' }}></div>
                  <label style={{ margin: 0 }}>Disponível para cobrir faltas/plantão fora da escala</label>
                </div>
              </div>
            </div>
            <div className={`print-box col-6 ${styles.inputGroup}`}>
              <label 
                className="no-print" 
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
                <input type="checkbox" name="disponibilidadeViagem" style={{ width: '18px', height: '18px', minWidth: '18px', cursor: 'pointer', accentColor: '#003366', flexShrink: 0 }} />
                <span style={{ flex: 1, wordBreak: 'break-word', lineHeight: '1.4' }}>Disponibilidade de fazer viagens</span>
              </label>
              <div className="print-only">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div style={{ width: '12px', height: '12px', border: '1px solid #333' }}></div>
                  <label style={{ margin: 0 }}>Disponibilidade de fazer viagens</label>
                </div>
              </div>
            </div>
          </div>

          <div className="no-print">
            {!isPublic && (
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
                    <option value="">(Nenhum / Não alocado)</option>
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>{c.companyName}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
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
          {/* SECÇÃO EXCLUSIVA DE IMPRESSÃO (LGPD & ASSINATURA) */}
          <div className="print-section-title print-only">03 • TERMO DE CONSENTIMENTO — LGPD</div>
          <div className="print-grid print-only" style={{ pageBreakInside: 'avoid' }}>
            <div className="print-box col-12" style={{ minHeight: '100px', border: '1px solid #ccc', padding: '10px' }}>
              <p style={{ fontSize: '11px', textAlign: 'justify', lineHeight: '1.5', margin: 0, color: '#333' }}>
                Declaro que as informações acima são verdadeiras e consinto expressamente, de forma livre e informada, com a coleta, uso, armazenamento e tratamento dos meus dados pessoais e dados pessoais sensíveis pela Elite Soluções, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), para a finalidade exclusiva de participação em processo seletivo, avaliação de currículo e possíveis contratações futuras. Compreendo que posso revogar este consentimento a qualquer momento, mediante solicitação formal.
              </p>
            </div>
            
            <div className="print-box col-6" style={{ height: '120px', position: 'relative', display: 'block' }}>
              <label style={{ display: 'block' }}>Local e data</label>
              <div style={{ position: 'absolute', bottom: '15px', left: '10px', right: '10px', borderBottom: '1px solid #999' }}></div>
            </div>
            <div className="print-box col-6" style={{ height: '120px', position: 'relative', display: 'block' }}>
              <label style={{ display: 'block' }}>Assinatura do(a) candidato(a)</label>
              <div style={{ position: 'absolute', bottom: '15px', left: '10px', right: '10px', borderBottom: '1px solid #999' }}></div>
            </div>

            {!isPublic && (
              <div className="print-box col-12" style={{ minHeight: '80px', marginTop: '10px', background: '#fcfcfc' }}>
                <label>Uso administrativo</label>
                <p style={{ fontSize: '10px', color: '#666', margin: 0 }}>Espaço reservado para conferência, observações ou protocolo.</p>
              </div>
            )}
          </div>

          {isPublic && (
            <div className="no-print" style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: '#fafafa' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600 }}>Assinatura Digital</label>
              <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>Desenhe sua assinatura no quadro abaixo (use o dedo ou mouse):</p>
              <canvas 
                ref={canvasRef}
                width={800}
                height={200}
                style={{ border: '1px solid #ccc', background: 'white', touchAction: 'none', width: '100%', maxWidth: '100%', borderRadius: '4px', cursor: 'crosshair' }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
              <button type="button" onClick={clearSignature} style={{ marginTop: '10px', background: 'none', border: '1px solid #e74c3c', color: '#e74c3c', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Limpar Assinatura
              </button>
            </div>
          )}

          <div className={`no-print ${styles.footer}`}>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? "Enviando..." : (isPublic ? "Enviar Ficha Cadastral" : "Salvar Funcionário")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

