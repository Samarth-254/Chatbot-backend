const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const extractText = async (buffer, fileType) => {
  const type = fileType.toLowerCase().replace('.', '');
  
  if (type === 'pdf' || type.includes('pdf')) {
    const data = await pdfParse(buffer);
    return data.text;
  }
  
  if (type === 'docx' || type === 'doc' || type.includes('officedocument.wordprocessingml')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  
  if (type === 'xlsx' || type === 'xls' || type.includes('spreadsheet') || type.includes('excel')) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    let text = '';
    workbook.SheetNames.forEach(sheetName => {
      text += `Sheet: ${sheetName}\n`;
      const worksheet = workbook.Sheets[sheetName];
      const csv = xlsx.utils.sheet_to_csv(worksheet);
      text += csv + '\n\n';
    });
    return text;
  }
  
  throw new Error(`Unsupported file type: ${fileType}`);
};

module.exports = {
  extractText
};
