const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [
    {
      properties: {},
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: '1. Apa ibukota Indonesia?',
              bold: true,
            }),
          ],
        }),
        new Paragraph('A. Jakarta'),
        new Paragraph('B. Surabaya'),
        new Paragraph('C. Bandung'),
        new Paragraph('D. Medan'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Jawaban: ', bold: true }),
            new TextRun('A')
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Pembahasan: ', bold: true }),
            new TextRun('Jakarta adalah ibukota negara Indonesia secara de facto dan de jure.')
          ]
        }),
        new Paragraph(''), // Empty line separator
        
        new Paragraph({
          children: [
            new TextRun({
              text: '2. Gunung tertinggi di Indonesia adalah...',
              bold: true,
            }),
          ],
        }),
        new Paragraph('A. Semeru'),
        new Paragraph('B. Rinjani'),
        new Paragraph('C. Puncak Jaya'),
        new Paragraph('D. Kerinci'),
        new Paragraph({
          children: [
            new TextRun({ text: 'Jawaban: ', bold: true }),
            new TextRun('C')
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Pembahasan: ', bold: true }),
            new TextRun('Puncak Jaya terletak di Papua dan merupakan gunung tertinggi di Indonesia.')
          ]
        }),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('../geolearning-frontend/public/Template_Soal_GeoLearning.docx', buffer);
  console.log('Template created successfully at public/Template_Soal_GeoLearning.docx');
});
