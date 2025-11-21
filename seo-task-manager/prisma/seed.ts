import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const members = [
  "大川 慎太郎",
  "杉山 諒也",
  "日向 祥太",
  "川名 亜由美",
  "北條 貴斗",
  "北川 育実",
  "八木 智輝",
  "西川 結唯",
  "荒島 未琴",
  "丹羽 美月",
  "小岩 歌姫",
  "高橋 和哉",
  "花沢 愛",
  "樋口 雄大",
  "橋本 優奈",
  "権田 啓",
  "丹野 涼大",
  "柴田 岳人",
].map((name) => ({ name }));

async function main() {
  for (const member of members) {
    const existing = await prisma.user.findFirst({ where: { name: member.name } });
    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: { isActive: true },
      });
    } else {
      await prisma.user.create({
        data: {
          name: member.name,
          role: "writer",
          isActive: true,
        },
      });
    }
  }
  console.log(`Seeded ${members.length} members.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

