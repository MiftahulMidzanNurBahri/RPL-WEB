import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed is disabled in production.");
  }

  const passwordHash = await hash("password123", 12);
  const alex = await prisma.user.upsert({
    where: { email: "alex.rivera@student.pradita.ac.id" },
    update: {},
    create: {
      id: "demo-user-alex-rivera",
      name: "Alex Rivera",
      email: "alex.rivera@student.pradita.ac.id",
      role: "student",
      avatarInitials: "AR",
      bio: "Mahasiswa Universitas Pradita",
      passwordHash,
      createdAt: new Date("2024-08-15T00:00:00.000Z")
    }
  });

  const sarah = await prisma.user.upsert({
    where: { email: "sarah.jenkins@pradita.ac.id" },
    update: {},
    create: {
      id: "demo-user-sarah-jenkins",
      name: "Dr. Sarah Jenkins",
      email: "sarah.jenkins@pradita.ac.id",
      role: "faculty_staff",
      avatarInitials: "SJ",
      bio: "Dosen Universitas Pradita",
      passwordHash
    }
  });

  const lostItem = await prisma.item.upsert({
    where: { id: "demo-item-lost-macbook" },
    update: {},
    create: {
      id: "demo-item-lost-macbook",
      reporterId: alex.id,
      title: "MacBook Air M2 13-inch Silver",
      category: "Elektronik & Gadget",
      reportType: "lost",
      status: "lost",
      description: "Tertinggal di meja ruang baca Perpustakaan Pradita.",
      additionalInfo: "Memiliki stiker khusus di sudut kanan bawah.",
      location: "Perpustakaan Pradita",
      incidentDate: new Date("2026-09-12T00:00:00.000Z"),
      incidentTime: "14:30",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  const foundItem = await prisma.item.upsert({
    where: { id: "demo-item-found-earbuds" },
    update: {},
    create: {
      id: "demo-item-found-earbuds",
      reporterId: sarah.id,
      title: "Earphone nirkabel dalam casing putih",
      category: "Elektronik & Gadget",
      reportType: "found",
      status: "found",
      description: "Ditemukan di area baca Perpustakaan Pradita.",
      additionalInfo: "Ada goresan kecil di sisi kiri casing.",
      location: "Perpustakaan Pradita",
      incidentDate: new Date("2026-09-13T00:00:00.000Z"),
      incidentTime: "09:15",
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    }
  });

  const demoInquiry = await prisma.inquiry.upsert({
    where: { id: "demo-inquiry-earbuds-claim" },
    update: {},
    create: {
      id: "demo-inquiry-earbuds-claim",
      itemId: foundItem.id,
      senderId: alex.id,
      recipientId: sarah.id,
      kind: "claim",
      status: "pending",
      message: "Saya kehilangan earphone di area perpustakaan. Apakah warna casingnya putih?"
    }
  });

  await prisma.activityLog.upsert({
    where: { id: "demo-activity-alex-report" },
    update: {},
    create: {
      id: "demo-activity-alex-report",
      userId: alex.id,
      itemId: lostItem.id,
      action: "Melaporkan barang hilang di Perpustakaan Pradita",
      metadata: { source: "development-seed" }
    }
  });

  await prisma.activityLog.upsert({
    where: { id: "demo-activity-alex-inquiry" },
    update: {},
    create: {
      id: "demo-activity-alex-inquiry",
      userId: alex.id,
      itemId: foundItem.id,
      action: "Mengirim pesan terkait laporan earphone",
      metadata: { inquiryId: demoInquiry.id }
    }
  });

  await prisma.activityLog.upsert({
    where: { id: "demo-activity-sarah-inquiry" },
    update: {},
    create: {
      id: "demo-activity-sarah-inquiry",
      userId: sarah.id,
      itemId: foundItem.id,
      action: "Menerima pesan terkait laporan earphone",
      metadata: { inquiryId: demoInquiry.id }
    }
  });
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });