const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../public/uploads/backgrounds');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'background-' + uniqueSuffix + ext);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas JPG, PNG, GIF ou WebP.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Função para remover arquivo
async function removeFile(filePath) {
  if (!filePath) return;
  
  try {
    // Converter caminho relativo para absoluto
    const absolutePath = path.join(__dirname, '../../public', filePath);
    
    // Verificar se o arquivo existe
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      console.log(`Arquivo removido: ${absolutePath}`);
    }
  } catch (error) {
    console.error(`Erro ao remover arquivo: ${error.message}`);
  }
}

// Obter todas as imagens de fundo
router.get('/', async (req, res) => {
  try {
    const images = await prisma.backgroundImage.findMany({
      orderBy: {
        order: 'asc'
      }
    });
    
    res.json(images);
  } catch (error) {
    console.error('Erro ao buscar imagens de fundo:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Obter imagens de fundo ativas (para o slideshow)
router.get('/active', async (req, res) => {
  try {
    const images = await prisma.backgroundImage.findMany({
      where: {
        active: true
      },
      orderBy: {
        order: 'asc'
      }
    });
    
    res.json(images);
  } catch (error) {
    console.error('Erro ao buscar imagens de fundo ativas:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Upload de imagem de fundo (protegido)
router.post('/upload', authenticateJWT, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }
    
    // Caminho relativo para o arquivo (para salvar no banco)
    const relativePath = `/uploads/backgrounds/${req.file.filename}`;
    
    // Contar imagens existentes para definir a ordem
    const count = await prisma.backgroundImage.count();
    
    // Criar registro no banco
    const image = await prisma.backgroundImage.create({
      data: {
        filename: req.file.filename,
        path: relativePath,
        active: true,
        order: count // Adiciona ao final da lista
      }
    });
    
    res.json({
      message: 'Upload realizado com sucesso',
      image
    });
  } catch (error) {
    console.error('Erro ao fazer upload da imagem de fundo:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar status ou ordem de uma imagem (protegido)
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { active, order } = req.body;
    
    const image = await prisma.backgroundImage.update({
      where: { id: parseInt(id) },
      data: {
        active: active !== undefined ? active : undefined,
        order: order !== undefined ? order : undefined,
        updatedAt: new Date()
      }
    });
    
    res.json(image);
  } catch (error) {
    console.error('Erro ao atualizar imagem de fundo:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Excluir uma imagem (protegido)
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar imagem para obter o caminho do arquivo
    const image = await prisma.backgroundImage.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!image) {
      return res.status(404).json({ message: 'Imagem não encontrada' });
    }
    
    // Excluir registro do banco
    await prisma.backgroundImage.delete({
      where: { id: parseInt(id) }
    });
    
    // Remover arquivo físico
    await removeFile(image.path);
    
    res.json({ message: 'Imagem excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir imagem de fundo:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Reordenar imagens (protegido)
router.post('/reorder', authenticateJWT, async (req, res) => {
  try {
    const { order } = req.body;
    
    if (!Array.isArray(order)) {
      return res.status(400).json({ message: 'Formato inválido. Envie um array de IDs.' });
    }
    
    // Atualizar a ordem de cada imagem
    const updates = order.map((id, index) => {
      return prisma.backgroundImage.update({
        where: { id: parseInt(id) },
        data: { order: index }
      });
    });
    
    await Promise.all(updates);
    
    res.json({ message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar imagens de fundo:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
