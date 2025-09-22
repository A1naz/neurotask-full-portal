import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export const exportToExcel = async (data, dateRange) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Token History');

  // Add columns
  worksheet.columns = [
    { header: 'Тип', key: 'type', width: 20 },
    { header: 'Услуга', key: 'service', width: 20 },
    { header: 'LLM', key: 'model', width: 30 },
    { header: 'Дата', key: 'date', width: 15 },
    { header: 'Время', key: 'time', width: 15 },
    { header: 'Цена', key: 'price', width: 15 },
  ];

  // Add rows
  data.forEach(item => {
    // top_up, refund, bonus are not spend operations, so we handle them separately
    if (item.type !== 'spend') {
        worksheet.addRow({
            type: item.description, // e.g., "Пополнение баланса"
            service: '-',
            llm: '-',
            date: new Date(item.createdAt).toLocaleDateString('ru-RU'),
            time: new Date(item.createdAt).toLocaleTimeString('ru-RU'),
            price: `+${item.amount}`,
        });
        return; // go to next item
    }
      
    worksheet.addRow({
      type: item.description?.toLowerCase().includes('мульти-чат') ? 'Мультичат' : 'Ассистент',
      service: item.metadata?.serviceType || 'Текст', // Default to Text, as no info in example
      model: item.metadata?.provider || '-', // Use provider for LLM as per example
      date: new Date(item.createdAt).toLocaleDateString('ru-RU'),
      time: new Date(item.createdAt).toLocaleTimeString('ru-RU'),
      price: item.amount,
    });
  });

  // Generate and download the file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fileName = `token-history-${dateRange.startDate.toISOString().slice(0,10)}-to-${dateRange.endDate.toISOString().slice(0,10)}.xlsx`;
  saveAs(blob, fileName);
};
