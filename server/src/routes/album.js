const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { protectNonGetRoutes } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'public/uploads/album');
    
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'album-' + uniqueSuffix + ext);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Apenas imagens são permitidas.'), false);
  }
};

// Configuração do multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Obter todas as fotos de uma galeria específica (público)
router.get('/:gallery', async (req, res) => {
  try {
    const { gallery } = req.params;
    const { active } = req.query;
    
    let whereClause = { gallery };
    
    // Se o parâmetro active for fornecido, filtra por status de ativação
    if (active !== undefined) {
      whereClause.active = active === 'true';
    }
    
    const photos = await prisma.album.findMany({
      where: whereClause,
      orderBy: { order: 'asc' }
    });
    
    res.json(photos);
  } catch (error) {
    console.error('Erro ao buscar fotos do álbum:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Obter todas as galerias (público)
router.get('/', async (req, res) => {
  try {
    const { active } = req.query;
    
    let whereClause = {};
    
    // Se o parâmetro active for fornecido, filtra por status de ativação
    if (active !== undefined) {
      whereClause.active = active === 'true';
    }
    
    // Agrupar fotos por galeria
    const photos = await prisma.album.findMany({
      where: whereClause,
      orderBy: [
        { gallery: 'asc' },
        { order: 'asc' }
      ]
    });
    
    // Criar objeto com galerias
    const galleries = {};
    photos.forEach(photo => {
      if (!galleries[photo.gallery]) {
        galleries[photo.gallery] = [];
      }
      galleries[photo.gallery].push(photo);
    });
    
    res.json(galleries);
  } catch (error) {
    console.error('Erro ao buscar galerias:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Upload de múltiplas imagens (protegido)
router.post('/upload', protectNonGetRoutes, upload.array('images', 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }
    
    const uploadedFiles = req.files.map(file => {
      const relativePath = `/uploads/album/${file.filename}`;
      return {
        filename: file.filename,
        path: relativePath,
        originalname: file.originalname
      };
    });
    
    res.status(201).json({ 
      message: 'Imagens enviadas com sucesso',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Erro ao fazer upload de imagens:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Adicionar nova foto (protegido)
router.post('/', protectNonGetRoutes, async (req, res) => {
  try {
    const { gallery, image, title, order, active } = req.body;
    
    const newPhoto = await prisma.album.create({
      data: {
        gallery,
        image,
        title: title || '',
        order: order || 0,
        active: active !== undefined ? active : true
      }
    });
    
    res.status(201).json(newPhoto);
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Adicionar múltiplas fotos (protegido)
router.post('/batch', protectNonGetRoutes, async (req, res) => {
  try {
    const { photos } = req.body;
    
    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: 'Nenhuma foto fornecida' });
    }
    
    // Obter a ordem máxima atual para a galeria
    const gallery = photos[0].gallery;
    const maxOrderPhoto = await prisma.album.findFirst({
      where: { gallery },
      orderBy: { order: 'desc' }
    });
    
    let startOrder = maxOrderPhoto ? maxOrderPhoto.order + 1 : 0;
    
    // Criar todas as fotos em uma única transação
    const createdPhotos = await prisma.$transaction(
      photos.map((photo, index) => {
        return prisma.album.create({
          data: {
            gallery: photo.gallery,
            image: photo.image,
            title: photo.title || '',
            order: startOrder + index,
            active: photo.active !== undefined ? photo.active : true
          }
        });
      })
    );
    
    res.status(201).json({
      message: 'Fotos adicionadas com sucesso',
      photos: createdPhotos
    });
  } catch (error) {
    console.error('Erro ao adicionar múltiplas fotos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar foto (protegido)
router.put('/:id', protectNonGetRoutes, async (req, res) => {
  try {
    const { id } = req.params;
    const { gallery, image, title, order, active } = req.body;
    
    const updatedPhoto = await prisma.album.update({
      where: { id: Number(id) },
      data: {
        gallery,
        image,
        title,
        order,
        active: active !== undefined ? active : true
      }
    });
    
    res.json(updatedPhoto);
  } catch (error) {
    console.error('Erro ao atualizar foto:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar status de ativação (protegido)
router.put('/:id/toggle-active', protectNonGetRoutes, async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    if (active === undefined) {
      return res.status(400).json({ message: 'Status de ativação não fornecido' });
    }
    
    const updatedPhoto = await prisma.album.update({
      where: { id: Number(id) },
      data: { active }
    });
    
    res.json(updatedPhoto);
  } catch (error) {
    console.error('Erro ao atualizar status de ativação:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Atualizar ordem das fotos (protegido)
router.put('/reorder', protectNonGetRoutes, async (req, res) => {
  try {
    const { photos } = req.body;
    
    // Atualizar ordem de cada foto
    const updates = photos.map(photo => 
      prisma.album.update({
        where: { id: photo.id },
        data: { order: photo.order }
      })
    );
    
    await Promise.all(updates);
    
    res.json({ message: 'Ordem atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao reordenar fotos:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

// Excluir foto (protegido)
router.delete('/:id', protectNonGetRoutes, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar a foto para obter o caminho da imagem
    const photo = await prisma.album.findUnique({
      where: { id: Number(id) }
    });
    
    if (!photo) {
      return res.status(404).json({ message: 'Foto não encontrada' });
    }
    
    // Excluir a foto do banco de dados
    await prisma.album.delete({
      where: { id: Number(id) }
    });
    
    // Tentar excluir o arquivo físico se for um caminho local
    try {
      if (photo.image && photo.image.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), 'public', photo.image);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (fileError) {
      console.error('Erro ao excluir arquivo físico:', fileError);
      // Não interrompe o fluxo se falhar ao excluir o arquivo
    }
    
    res.json({ message: 'Foto excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir foto:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

module.exports = router;
