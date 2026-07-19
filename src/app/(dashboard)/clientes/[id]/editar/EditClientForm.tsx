"use client";

import { updateClient } from "@/actions/clientActions";
import styles from "../../novo/novoCliente.module.css";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";

interface ClientData {
  id: string;
  companyName: string;
  cnpj: string;
  address: string;
  name: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  totalArea: string | null;
  phone: string | null;
  cellphone: string | null;
  email: string | null;
  email2: string | null;
  observations: string | null;
  managerName: string | null;
  managerContact: string | null;
}

export default function EditClientForm({ client }: { client: ClientData }) {
  const [cnpj, setCnpj] = useState(client.cnpj);
  const [cep, setCep] = useState(client.cep || "");
  const [phone, setPhone] = useState(client.phone || "");
  const [cellphone, setCellphone] = useState(client.cellphone || "");
  const [managerContact, setManagerContact] = useState(client.managerContact || "");

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = raw
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
    setCnpj(formatted);
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = raw
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
    setCep(formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 10) {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    setPhone(formatted.substring(0, 15));
  };

  const handleCellphoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 10) {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    setCellphone(formatted.substring(0, 15));
  };

  const handleManagerContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, "");
    let formatted = "";
    if (digits.length <= 10) {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    } else {
      formatted = digits
        .replace(/^(\d{2})(\d)/g, "($1) $2")
        .replace(/(\d{5})(\d)/, "$1-$2");
    }
    setManagerContact(formatted.substring(0, 15));
  };

  // Fazer bind da Server Action com o ID do cliente
  const updateClientWithId = updateClient.bind(null, client.id);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/clientes" className={styles.backButton}>
          <ArrowLeft size={20} />
          <span>Voltar</span>
        </Link>
        <h1 className={styles.title}>Editar Cliente</h1>
        <p className={styles.subtitle}>Altere as informações do cadastro deste cliente.</p>
      </div>

      <div className={styles.card}>
        <form action={updateClientWithId} className={styles.form}>
          
          <h3 className={styles.sectionTitle}>Dados Principais</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="companyName">Razão Social <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="companyName" 
                name="companyName" 
                required 
                placeholder="Nome oficial da empresa" 
                defaultValue={client.companyName} 
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label htmlFor="name">Nome Fantasia (Apelido)</label>
              <input 
                type="text" 
                id="name" 
                name="name" 
                placeholder="Como a empresa é conhecida" 
                defaultValue={client.name || ""} 
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="cnpj">CNPJ <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="cnpj" 
                name="cnpj" 
                required 
                placeholder="00.000.000/0000-00" 
                value={cnpj}
                onChange={handleCNPJChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="totalArea">Área Total</label>
              <input 
                type="text" 
                id="totalArea" 
                name="totalArea" 
                placeholder="Ex: 500m²" 
                defaultValue={client.totalArea || ""} 
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Localização</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup} style={{ flex: 3 }}>
              <label htmlFor="address">Endereço Completo <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="address" 
                name="address" 
                required 
                placeholder="Rua, Número, Bairro" 
                defaultValue={client.address} 
              />
            </div>
            <div className={styles.inputGroup} style={{ flex: 1 }}>
              <label htmlFor="cep">CEP <span style={{ color: '#e74c3c' }}>*</span></label>
              <input 
                type="text" 
                id="cep" 
                name="cep" 
                required 
                placeholder="00000-000" 
                value={cep}
                onChange={handleCEPChange}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="city">Cidade</label>
              <input 
                type="text" 
                id="city" 
                name="city" 
                placeholder="Sua Cidade" 
                defaultValue={client.city || ""} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="state">Estado</label>
              <input 
                type="text" 
                id="state" 
                name="state" 
                placeholder="UF" 
                maxLength={2} 
                style={{ textTransform: 'uppercase' }} 
                defaultValue={client.state || ""} 
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Contatos da Empresa</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Telefone</label>
              <input 
                type="text" 
                id="phone" 
                name="phone" 
                placeholder="(00) 0000-0000" 
                value={phone}
                onChange={handlePhoneChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="cellphone">Celular 2</label>
              <input 
                type="text" 
                id="cellphone" 
                name="cellphone" 
                placeholder="(00) 90000-0000" 
                value={cellphone}
                onChange={handleCellphoneChange}
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">E-mail Principal</label>
              <input 
                type="email" 
                id="email" 
                name="email" 
                placeholder="contato@empresa.com" 
                defaultValue={client.email || ""} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="email2">E-mail 2</label>
              <input 
                type="email" 
                id="email2" 
                name="email2" 
                placeholder="financeiro@empresa.com" 
                defaultValue={client.email2 || ""} 
              />
            </div>
          </div>

          <h3 className={styles.sectionTitle}>Gestão e Observações</h3>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="managerName">Gestor Responsável</label>
              <input 
                type="text" 
                id="managerName" 
                name="managerName" 
                placeholder="Nome do Gestor" 
                defaultValue={client.managerName || ""} 
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="managerContact">Contato do Gestor Responsável</label>
              <input 
                type="text" 
                id="managerContact" 
                name="managerContact" 
                placeholder="(00) 90000-0000" 
                value={managerContact}
                onChange={handleManagerContactChange}
              />
            </div>
          </div>

          <div className={styles.inputGroup} style={{ marginBottom: '2rem' }}>
            <label htmlFor="observations">Descrição (Observações) <span style={{ fontSize: '0.8rem', color: '#999' }}>(Máx. 500 caract.)</span></label>
            <textarea 
              id="observations" 
              name="observations" 
              rows={3} 
              maxLength={500}
              placeholder="Anotações adicionais sobre o cliente..." 
              defaultValue={client.observations || ""}
              style={{ padding: '0.95rem', borderRadius: '8px', border: '1px solid #ddd', background: '#fafafa', width: '100%', fontFamily: 'inherit', resize: 'vertical' }}
            ></textarea>
          </div>

          <div className={styles.footer}>
            <button type="submit" className={styles.submitBtn}>Salvar Alterações</button>
          </div>
        </form>
      </div>
    </div>
  );
}
