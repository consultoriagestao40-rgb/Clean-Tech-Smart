import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '15mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS support
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { fileBase64, fileName, mimeType } = req.body || {};

    if (!fileBase64) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado para processamento.' });
    }

    // Clean base64 string
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');

    const nameLower = (fileName || '').toLowerCase();
    const isDocx = nameLower.endsWith('.docx') || (mimeType && mimeType.includes('wordprocessingml'));
    const isPdf = nameLower.endsWith('.pdf') || (mimeType && mimeType.includes('pdf'));
    const isTxt = nameLower.endsWith('.txt') || (mimeType && mimeType.includes('text'));

    let extractedText = '';
    let extractedMarkdown = '';

    if (isDocx) {
      try {
        const mdResult = await mammoth.convertToMarkdown({ buffer });
        extractedMarkdown = mdResult.value || '';
      } catch (e) {
        console.warn('Erro ao converter docx para markdown, tentando raw text:', e.message);
      }
      const rawResult = await mammoth.extractRawText({ buffer });
      extractedText = rawResult.value || '';
    } else if (isPdf) {
      try {
        const pdfModule = require('pdf-parse');
        if (typeof pdfModule === 'function') {
          const data = await pdfModule(buffer);
          extractedText = data.text || '';
        } else if (pdfModule && pdfModule.PDFParse) {
          const parser = new pdfModule.PDFParse({ data: buffer });
          const textResult = await parser.getText();
          if (typeof parser.destroy === 'function') await parser.destroy();
          if (typeof textResult === 'string') {
            extractedText = textResult;
          } else if (textResult && Array.isArray(textResult.pages)) {
            extractedText = textResult.pages.map(p => p.text || '').join('\n\n');
          } else if (textResult && textResult.text) {
            extractedText = textResult.text;
          } else {
            extractedText = String(textResult || '');
          }
        }
      } catch (pdfErr) {
        console.error('Erro ao ler PDF:', pdfErr);
        return res.status(400).json({ error: 'Não foi possível extrair o texto deste arquivo PDF: ' + pdfErr.message });
      }
    } else if (isTxt) {
      extractedText = buffer.toString('utf-8');
    } else {
      // Tentar docx primeiro, depois pdf
      try {
        const mdResult = await mammoth.convertToMarkdown({ buffer });
        extractedMarkdown = mdResult.value || '';
        const rawResult = await mammoth.extractRawText({ buffer });
        extractedText = rawResult.value || '';
      } catch {
        extractedText = buffer.toString('utf-8');
      }
    }

    if (!extractedText && !extractedMarkdown) {
      return res.status(400).json({ error: 'O arquivo parece estar vazio ou não foi possível extrair texto legível.' });
    }

    // Processar e quebrar em cláusulas estruturadas
    const textToProcess = extractedMarkdown || extractedText;
    const clauses = parseClausesFromText(textToProcess);

    // Sugerir nome amigável para o template
    let templateName = (fileName || 'Novo Template')
      .replace(/\.(docx|doc|pdf|txt)$/i, '')
      .replace(/[_-]/g, ' ')
      .trim();
    
    // Capitalizar
    templateName = templateName.charAt(0).toUpperCase() + templateName.slice(1);

    return res.status(200).json({
      success: true,
      fileName,
      templateName,
      clausesCount: clauses.length,
      clauses
    });
  } catch (error) {
    console.error('Erro no parser de contratos:', error);
    return res.status(500).json({ error: 'Erro interno ao processar o arquivo: ' + error.message });
  }
}

/**
 * Algoritmo inteligente para identificar e estruturar cláusulas de contratos
 */
function parseClausesFromText(text) {
  if (!text) return [];

  // Normalizar quebras de linha e espaços
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00A0]+/g, ' ');

  const lines = normalized.split('\n');
  const clauses = [];
  
  // Padrão que identifica início de uma nova cláusula ou seção de contrato
  const clausePattern = /^(?:#{1,4}\s*)?(?:cl[aá]usula\s+(?:primeira|segunda|terceira|quarta|quinta|sexta|s[eé]tima|oitava|nona|d[eé]cima|\d+[ªºa-z]*|[ivxlcdm]+)|cl[aá]usula\b|cap[ií]tulo\s+[ivxlcdm\d]+|(?:\d{1,2}\.|\b[ivxlcdm]{1,5}\.)\s*(?:do|da|dos|das|objeto|prazo|pre[cç]o|valor|pagamento|vig[eê]ncia|obriga[cç][oõ]es|rescis[aã]o|multa|foro|disposi[cç][oõ]es)|(?:do\s+objeto|do\s+prazo|do\s+pre[cç]o|do\s+valor|da\s+vig[eê]ncia|das\s+obriga[cç][oõ]es|da\s+rescis[aã]o|do\s+foro))\b/i;

  let currentTitle = '';
  let currentLines = [];
  let isPreamble = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (currentLines.length > 0 && currentLines[currentLines.length - 1] !== '') {
        currentLines.push('');
      }
      continue;
    }

    // Verificar se esta linha inicia uma nova cláusula
    if (clausePattern.test(line)) {
      // Salvar a cláusula anterior se houver
      if (currentLines.length > 0 || currentTitle) {
        const fullContent = currentLines.join('\n').trim();
        if (fullContent || currentTitle) {
          clauses.push({
            title: currentTitle || (isPreamble ? 'PREÂMBULO / DAS PARTES' : `CLÁUSULA ${clauses.length + 1}`),
            content: fullContent
          });
        }
        currentLines = [];
      }

      isPreamble = false;
      
      // Separar título e conteúdo se estiverem na mesma linha com dois-pontos ou hífen
      const colonIndex = line.indexOf(':');
      const dashIndex = line.indexOf(' - ');
      
      let splitAt = -1;
      if (colonIndex !== -1 && colonIndex < 80) {
        splitAt = colonIndex;
      } else if (dashIndex !== -1 && dashIndex < 80) {
        splitAt = dashIndex;
      }

      if (splitAt !== -1 && line.length > splitAt + 10) {
        currentTitle = cleanTitle(line.substring(0, splitAt + 1));
        const remaining = line.substring(splitAt + 1).trim();
        if (remaining) {
          currentLines.push(remaining);
        }
      } else {
        currentTitle = cleanTitle(line);
      }
    } else {
      currentLines.push(line);
    }
  }

  // Adicionar última cláusula
  if (currentLines.length > 0 || currentTitle) {
    const fullContent = currentLines.join('\n').trim();
    if (fullContent || currentTitle) {
      clauses.push({
        title: currentTitle || (isPreamble ? 'PREÂMBULO / DAS PARTES' : `CLÁUSULA ${clauses.length + 1}`),
        content: fullContent
      });
    }
  }

  // Se não encontrou nenhuma cláusula com o padrão jurídico, quebrar por blocos grandes de parágrafos
  if (clauses.length <= 1) {
    const rawBlocks = normalized
      .split(/\n\s*\n+/)
      .map(b => b.trim())
      .filter(Boolean);

    if (rawBlocks.length > 1) {
      return rawBlocks.map((block, idx) => {
        const firstLineEnd = block.indexOf('\n');
        let title = '';
        let content = block;
        if (firstLineEnd !== -1 && firstLineEnd < 70) {
          title = cleanTitle(block.substring(0, firstLineEnd));
          content = block.substring(firstLineEnd + 1).trim();
        } else {
          title = idx === 0 ? 'PREÂMBULO / DAS PARTES' : `CLÁUSULA ${idx}`;
        }
        return { title, content };
      });
    }
  }

  return clauses.length > 0 ? clauses : [{ title: 'CONTRATO DE LOCAÇÃO', content: normalized.trim() }];
}

function cleanTitle(str) {
  return str
    .replace(/^#+\s*/, '')
    .replace(/[*_]/g, '')
    .trim()
    .toUpperCase();
}
