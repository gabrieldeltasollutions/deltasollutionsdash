import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quote } from "./drizzle/schema";

interface QuoteItemWithDetails {
  id: number;
  partDescription: string;
  quantity: number;
  machineName: string;
  materialName: string | null;
  partWidthMm: number | null;
  partLengthMm: number | null;
  rawMaterialCost: number;
  toolingCost: number;
  thirdPartyServicesCost: number;
  machineTimeHours: number;
  setupTimeHours: number;
  totalMachineCost: number;
  totalLaborCost: number;
  itemSubtotal: number;
}

interface PdfData {
  quote: Quote;
  items: QuoteItemWithDetails[];
  companyLogo?: string;
  client?: {
    name: string;
    email: string | null;
    phone: string | null;
    document: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
  } | null;
}

export async function generateQuotePDF(data: PdfData): Promise<Buffer> {
  const { quote, items } = data;
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPosition = 20;

  // Cores
  const primaryColor: [number, number, number] = [37, 99, 235]; // Azul
  const textColor: [number, number, number] = [51, 51, 51]; // Cinza escuro
  const lightGray: [number, number, number] = [245, 245, 245];

  // Cabeçalho com logo da Delta Solutions
  if (data.companyLogo) {
    try {
      doc.addImage(data.companyLogo, "PNG", 15, yPosition, 50, 15);
    } catch (error) {
      console.error("Erro ao adicionar logo:", error);
    }
  }

  // Endereço abaixo da logo
  doc.setFontSize(8);
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  doc.text("Avenida Governador Danilo de Matos Areosa, 1199", 15, yPosition + 18);
  doc.text("Distrito Industrial 1 - Manaus/AM - CEP 69030-050", 15, yPosition + 22);

  // Número do orçamento e data (lado direito)
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Orçamento #${quote.id}`, pageWidth - 15, yPosition + 10, { align: "right" });
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date(quote.createdAt).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  doc.text(dateStr, pageWidth - 15, yPosition + 18, { align: "right" });

  yPosition += 35;

  // Linha separadora
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(0.5);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  yPosition += 10;

  // Informações do Cliente
  doc.setFillColor(...lightGray);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("INFORMAÇÕES DO CLIENTE", 20, yPosition + 5.5);
  yPosition += 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textColor);
  doc.text("Cliente:", 20, yPosition);
  doc.setFont("helvetica", "normal");
  doc.text(quote.clientName, 45, yPosition);
  yPosition += 7;
  
  // Adicionar dados completos do cliente se disponíveis
  if (data.client) {
    if (data.client.document) {
      doc.setFont("helvetica", "bold");
      doc.text("CNPJ/CPF:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.document, 45, yPosition);
      yPosition += 7;
    }
    
    if (data.client.email) {
      doc.setFont("helvetica", "bold");
      doc.text("Email:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.email, 45, yPosition);
      yPosition += 7;
    }
    
    if (data.client.phone) {
      doc.setFont("helvetica", "bold");
      doc.text("Telefone:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      doc.text(data.client.phone, 45, yPosition);
      yPosition += 7;
    }
    
    if (data.client.address) {
      doc.setFont("helvetica", "bold");
      doc.text("Endereço:", 20, yPosition);
      doc.setFont("helvetica", "normal");
      // Quebrar endereço longo em múltiplas linhas se necessário
      const addressLines = doc.splitTextToSize(data.client.address, pageWidth - 60);
      doc.text(addressLines, 45, yPosition);
      yPosition += 7 * addressLines.length;
    }
    
    if (data.client.city || data.client.state || data.client.zipCode) {
      const location = [
        data.client.city,
        data.client.state,
        data.client.zipCode ? `CEP: ${data.client.zipCode}` : null
      ].filter(Boolean).join(" - ");
      
      if (location) {
        doc.setFont("helvetica", "bold");
        doc.text("Localização:", 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(location, 45, yPosition);
        yPosition += 7;
      }
    }
  }
  
  yPosition += 8;

  // Tabela de Peças
  doc.setFillColor(...lightGray);
  doc.rect(15, yPosition, pageWidth - 30, 8, "F");
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...primaryColor);
  doc.text("PEÇAS DO ORÇAMENTO", 20, yPosition + 5.5);
  yPosition += 15;

  // Preparar dados da tabela com Valor Unitário
  const tableData = items.map((item, index) => {
    const totalTime = ((item.machineTimeHours + item.setupTimeHours) / 60).toFixed(2);
    const unitPrice = item.itemSubtotal / item.quantity;
    return [
      `${index + 1}`,
      item.partDescription,
      item.quantity.toString(),
      item.machineName,
      item.materialName || "-",
      `${totalTime}h`,
      `R$ ${(unitPrice / 100).toFixed(2)}`,
      `R$ ${(item.itemSubtotal / 100).toFixed(2)}`,
    ];
  });

  autoTable(doc, {
    startY: yPosition,
    head: [["#", "Descrição", "Qtd", "Máquina", "Material", "Tempo", "Valor Unit.", "Subtotal"]],
    body: tableData,
    theme: "striped",
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: textColor,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center" },
      1: { cellWidth: 45 },
      2: { cellWidth: 12, halign: "center" },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 22, halign: "right" },
      7: { cellWidth: 23, halign: "right" },
    },
    margin: { left: 15, right: 15 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Observações
  if (quote.notes) {
    doc.setFillColor(...lightGray);
    doc.rect(15, yPosition, pageWidth - 30, 8, "F");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...primaryColor);
    doc.text("OBSERVAÇÕES", 20, yPosition + 5.5);
    yPosition += 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    const notesLines = doc.splitTextToSize(quote.notes, pageWidth - 40);
    doc.text(notesLines, 20, yPosition);
    yPosition += (notesLines.length * 5) + 10;
  } else {
    yPosition += 5;
  }

  // Mão de Obra e Impostos
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  
  doc.text("Mão de Obra:", 20, yPosition);
  doc.text(`R$ ${(quote.profitAmount / 100).toFixed(2)}`, pageWidth - 20, yPosition, { align: "right" });
  yPosition += 7;
  
  doc.text("Impostos:", 20, yPosition);
  doc.text(`R$ ${(quote.taxAmount / 100).toFixed(2)}`, pageWidth - 20, yPosition, { align: "right" });
  yPosition += 10;

  // Valor Final (destaque)
  doc.setFillColor(...primaryColor);
  doc.rect(15, yPosition, pageWidth - 30, 12, "F");
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("VALOR FINAL:", 20, yPosition + 8);
  doc.text(`R$ ${(quote.finalPrice / 100).toFixed(2)}`, pageWidth - 20, yPosition + 8, { align: "right" });

  // Rodapé
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...textColor);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  return Buffer.from(doc.output("arraybuffer"));
}
