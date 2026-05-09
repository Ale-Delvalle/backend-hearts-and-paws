require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

async function test() {
  const ong = await prisma.organizacion.findFirst({ where: { estado: 'APROBADA' } });
  if (!ong) {
    console.log("No approved ONG found.");
    return;
  }
  const payload = { sub: ong.id, id: ong.id, email: ong.email, plan: ong.plan, tipo: 'ONG', rol: 'ONG' };
  const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret');
  
  const fetch = require('node-fetch');
  const res = await fetch('http://localhost:3001/casos/ong/mis-casos', {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

test().catch(console.error).finally(() => prisma.$disconnect());
