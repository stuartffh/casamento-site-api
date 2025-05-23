const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateJWT } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Listar todas as vendas (protegido - apenas admin)
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const sales = await prisma.sale.findMany({
      include: {
        present: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(sales);
  } catch (error) {
    console.error('Erro ao buscar vendas:', error);
    res.status(500).json({ message: 'Erro ao buscar vendas', error: error.message });
  }
});

// Obter detalhes de uma venda específica (protegido - apenas admin)
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    
    const sale = await prisma.sale.findUnique({
      where: { id: parseInt(id) },
      include: {
        present: true
      }
    });
    
    if (!sale) {
      return res.status(404).json({ message: 'Venda não encontrada' });
    }
    
    res.json(sale);
  } catch (error) {
    console.error('Erro ao buscar detalhes da venda:', error);
    res.status(500).json({ message: 'Erro ao buscar detalhes da venda', error: error.message });
  }
});

// Atualizar status de uma venda (protegido - apenas admin)
router.put('/:id/status', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Status é obrigatório' });
    }
    
    const sale = await prisma.sale.update({
      where: { id: parseInt(id) },
      data: {
        status,
        notes: notes || undefined,
        updatedAt: new Date()
      }
    });
    
    res.json(sale);
  } catch (error) {
    console.error('Erro ao atualizar status da venda:', error);
    res.status(500).json({ message: 'Erro ao atualizar status da venda', error: error.message });
  }
});

// Obter estatísticas de vendas (protegido - apenas admin)
router.get('/stats/summary', authenticateJWT, async (req, res) => {
  try {
    // Total de vendas
    const totalSales = await prisma.sale.count({
      where: {
        status: 'paid'
      }
    });
    
    // Valor total vendido
    const totalAmount = await prisma.sale.aggregate({
      where: {
        status: 'paid'
      },
      _sum: {
        amount: true
      }
    });
    
    // Vendas por método de pagamento
    const salesByMethod = await prisma.sale.groupBy({
      by: ['paymentMethod'],
      where: {
        status: 'paid'
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });
    
    // Produtos mais vendidos
    const topProducts = await prisma.sale.groupBy({
      by: ['presentId'],
      where: {
        status: 'paid'
      },
      _count: {
        id: true
      },
      _sum: {
        amount: true
      }
    });
    
    // Buscar detalhes dos produtos mais vendidos
    const productsDetails = await Promise.all(
      topProducts.map(async (product) => {
        const details = await prisma.present.findUnique({
          where: { id: product.presentId }
        });
        return {
          ...product,
          name: details?.name || 'Produto não encontrado',
          description: details?.description || ''
        };
      })
    );
    
    res.json({
      totalSales,
      totalAmount: totalAmount._sum.amount || 0,
      salesByMethod,
      topProducts: productsDetails
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de vendas:', error);
    res.status(500).json({ message: 'Erro ao buscar estatísticas de vendas', error: error.message });
  }
});

module.exports = router;
