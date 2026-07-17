import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

// Assure-toi que l'URL pointe vers ta base de données de production Railway avant de lancer le script
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log("🌱 Démarrage de la création des comptes administrateurs...");

  // Modifie ces informations avec les vrais emails et mots de passe que tu veux utiliser
  const admins = [
    { email: 'badriyoussef75@gmail.com', name: 'Youssef Badri', password: 'cvtic2026' },
    { email: 'philippe_vignoles@auraproxy.com', name: 'Philippe Vignoles', password: 'cvtic2026!' }
  ];

  for (const admin of admins) {
    // Hashage du mot de passe (comme le fait le Dashboard)
    const password_hash = await bcrypt.hash(admin.password, 10);
    
    // Upsert = Crée l'utilisateur s'il n'existe pas, ne fait rien s'il existe déjà
    const user = await prisma.user.upsert({
      where: { email: admin.email },
      update: {},
      create: {
        email: admin.email,
        name: admin.name,
        password_hash: password_hash,
        role: 'ADMIN', // On force le rôle ADMIN
        isActive: true,
      },
    });
    
    console.log(`✅ Compte créé avec succès : ${user.email} (Role: ${user.role})`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant la création :", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("👋 Terminé.");
  });
