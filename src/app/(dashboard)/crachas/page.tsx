import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import CrachasClient, { BadgeItem } from "./CrachasClient";
import { generateNextBadgeCode } from "@/lib/badgeCode";

export const dynamic = "force-dynamic";

export default async function CrachasPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) redirect("/login");

  const role = (session.user as any).role;
  const permissions = (session.user as any).permissions || {};

  if (role !== "ADMIN" && !permissions.allowRh && !permissions.allowFuncionarios) {
    redirect("/");
  }

  // Buscar todos os funcionários
  const employees = await prisma.employee.findMany({
    where: { deleted: false },
    orderBy: { firstName: "asc" }
  });

  // Buscar todos os usuários
  const users = await prisma.user.findMany({
    orderBy: { name: "asc" }
  });

  // Mapear funcionários para o formato BadgeItem
  const employeeItems: BadgeItem[] = [];
  for (const emp of employees) {
    const dept = emp.department || emp.roleTitle || "Operacional";
    let code = emp.badgeCode;
    
    if (!code) {
      code = await generateNextBadgeCode(dept);
      await prisma.employee.update({
        where: { id: emp.id },
        data: { department: dept, badgeCode: code }
      }).catch(() => {});
    }

    employeeItems.push({
      id: emp.id,
      type: "employee",
      name: `${emp.firstName} ${emp.lastName || ''}`.trim(),
      roleTitle: emp.roleTitle,
      department: dept,
      badgeCode: code,
      photoUrl: emp.photoUrl,
      status: emp.status,
      cpf: emp.cpf
    });
  }

  // Mapear usuários que não possuem perfil de funcionário vinculado
  const userItems: BadgeItem[] = [];
  const linkedUserIds = new Set(employees.map(e => e.userId).filter(Boolean));

  for (const u of users) {
    if (linkedUserIds.has(u.id)) continue; // Evita duplicar se já exibido como funcionário

    const dept = u.department || (u.role === "ADMIN" ? "Administração" : "Geral");
    let code = u.badgeCode;

    if (!code) {
      code = await generateNextBadgeCode(dept);
      await prisma.user.update({
        where: { id: u.id },
        data: { department: dept, badgeCode: code }
      }).catch(() => {});
    }

    userItems.push({
      id: u.id,
      type: "user",
      name: u.name,
      roleTitle: u.role === "ADMIN" ? "Administrador de Sistema" : "Usuário de Sistema",
      department: dept,
      badgeCode: code,
      photoUrl: null,
      status: "Ativo"
    });
  }

  const allBadgeItems = [...employeeItems, ...userItems];

  return <CrachasClient initialItems={allBadgeItems} />;
}
