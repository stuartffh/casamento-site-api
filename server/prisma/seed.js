const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Dados iniciais para seed
async function seed() {
  try {
    // Criar usuário admin
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@casamento.com' }
    });

    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@casamento.com',
          password: hashedPassword
        }
      });
      console.log('Usuário admin criado com sucesso!');
    }

    // Criar configurações iniciais
    const configExists = await prisma.config.findFirst();
    if (!configExists) {
      await prisma.config.create({
        data: {
          pixKey: 'exemplo@email.com',
          pixDescription: 'Presente de casamento para Marília e Iago',
          mercadoPagoToken: 'TEST-0000000000000000-000000-00000000000000000000000000000000-000000000'
        }
      });
      console.log('Configurações iniciais criadas com sucesso!');
    }

    // Criar conteúdos iniciais
    const sections = ['home', 'historia', 'informacoes'];
    const defaultContents = {
      home: 'Estamos muito felizes em ter você aqui!',
      historia: 'Era uma vez… uma amizade que virou encontro, um encontro que virou história, e uma história que virou vida.\n\nMarília e Iago se conheceram ainda no colégio Núcleo/Cursinho, em 2013, graças ao empurrãozinho de um grande amigo em comum, Jorge (obrigado por isso, Jorge!). Entre risadas e encontros nos corredores, uma amizade foi se formando — até que, no dia 12 de setembro de 2015, tudo mudou: com um beijo surpresa na boate Seu Regueira, o que era leve começou a ficar sério.\n\nPoucos dias depois, no dia 18 de setembro, saíram com amigos e começaram a conversar sobre o dia seguinte. Marília comentou que iria para o aniversário da tia, e Iago pediu para ir junto. Brincando, disse que queria ser apresentado como "irmão" — e foi nesse momento que o coração dela teve certeza: era ele. No dia seguinte, 19 de setembro de 2015, começaram oficialmente a namorar.\n\nDez anos depois — sim, 10 anos depois! — aqui estão eles, dizendo "sim" um ao outro no altar, exatamente um dia após a data que marcou o início dessa jornada.',
      informacoes: '📍 Cerimônia:\nConcatedral de São Pedro dos Clérigos – às 19h\nAv. Dantas Barreto, 677 – São José\n(Dica: teremos manobrista nesse ponto)\n\n📍 Recepção:\nEspaço Dom – R. das Oficinas, 15 – Pina (dentro da Ecomariner)\n⚠ Importante: no Waze, digite "Ecomariner" (não "Espaço Dom")\nDica: Passando o túnel do RioMar, cruza a Antônio de Gois, primeira direita e depois primeira esquerda.\n\n👗 Dress Code:\nFormal – porque esse dia merece um look à altura!\n\n🏨 Hospedagem Sugerida:\nHotel Luzeiros Recife\nIbis Boa Viagem\n\n🚖 Transporte:\nParceria com TeleTáxi na saída da igreja!'
    };

    for (const section of sections) {
      const contentExists = await prisma.content.findUnique({
        where: { section }
      });

      if (!contentExists) {
        await prisma.content.create({
          data: {
            section,
            content: defaultContents[section]
          }
        });
        console.log(`Conteúdo para ${section} criado com sucesso!`);
      }
    }

    // Criar presentes de exemplo
    const presentesExemplo = [
      { name: 'Jogo de Panelas', description: 'Conjunto completo de panelas antiaderentes', price: 450.00, image: '/images/presente1.jpg', stock: 1 },
      { name: 'Liquidificador', description: 'Liquidificador de alta potência', price: 250.00, image: '/images/presente2.jpg', stock: 1 },
      { name: 'Jogo de Toalhas', description: 'Kit com 4 toalhas de banho e 4 de rosto', price: 180.00, image: '/images/presente3.jpg', stock: 1 },
      { name: 'Cafeteira', description: 'Cafeteira elétrica programável', price: 320.00, image: '/images/presente4.jpg', stock: 1 },
      { name: 'Jogo de Talheres', description: 'Kit completo com 24 peças', price: 280.00, image: '/images/presente5.jpg', stock: 1 },
      { name: 'Aspirador de Pó', description: 'Aspirador de pó sem fio', price: 550.00, image: '/images/presente6.jpg', stock: 1 }
    ];

    const presentCount = await prisma.present.count();
    if (presentCount === 0) {
      for (const presente of presentesExemplo) {
        await prisma.present.create({ data: presente });
      }
      console.log('Presentes de exemplo criados com sucesso!');
    }

    // Criar exemplos de fotos para o álbum
    const galerias = ['preWedding', 'momentos', 'padrinhos', 'festa'];
    const albumCount = await prisma.album.count();
    
    if (albumCount === 0) {
      let order = 0;
      for (const galeria of galerias) {
        for (let i = 1; i <= 4; i++) {
          await prisma.album.create({
            data: {
              gallery: galeria,
              image: '/images/placeholder.jpg',
              title: `Foto ${i} da galeria ${galeria}`,
              order: order++
            }
          });
        }
      }
      console.log('Fotos de exemplo para o álbum criadas com sucesso!');
    }

    console.log('Seed concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
