/**
 * Seed script — idempotent (safe to re-run). `npm run seed`
 *
 * Reads prisma/seed/*.json. To add a district's local bodies, add a
 * `<district>-local-bodies.json` file with the same shape as
 * kannur-local-bodies.json and list it in LOCAL_BODY_FILES.
 */
import { PrismaClient, LocalBodyType } from "@prisma/client";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const prisma = new PrismaClient();
const dir = join(__dirname, "seed");
const load = <T>(file: string): T => JSON.parse(readFileSync(join(dir, file), "utf8"));

const LOCAL_BODY_FILES = ["kannur-local-bodies.json"];

type DistrictSeed = { id: string; name: string; nameMl: string; isActive: boolean };
type LocalBodySeed = {
  id: string; name: string; nameMl: string; type: LocalBodyType;
  blockName: string | null; lat: number; lng: number;
};
type ServiceSeed = {
  id: string; name: string; nameMl: string; description: string; inclusions: string[];
  basePrice: number; durationMins: number;
};
type CategorySeed = { id: string; name: string; nameMl: string; icon: string; services: ServiceSeed[] };
type AvailabilitySeed = {
  municipalityExcept: string[];
  municipalityExtraExcept: Record<string, string[]>;
  panchayats: Record<string, string[]>;
  priceOverrides: Record<string, Record<string, number>>;
};

async function main() {
  // Districts
  const districts = load<DistrictSeed[]>("districts.json");
  for (const [i, d] of districts.entries()) {
    const data = { name: d.name, nameMl: d.nameMl, isActive: d.isActive, sortOrder: i };
    await prisma.district.upsert({ where: { id: d.id }, create: { id: d.id, ...data }, update: data });
  }

  // Local bodies
  const localBodies: LocalBodySeed[] = [];
  for (const file of LOCAL_BODY_FILES) {
    const { districtId, localBodies: list } = load<{ districtId: string; localBodies: LocalBodySeed[] }>(file);
    for (const lb of list) {
      const data = { districtId, name: lb.name, nameMl: lb.nameMl, type: lb.type, blockName: lb.blockName, lat: lb.lat, lng: lb.lng };
      await prisma.localBody.upsert({ where: { id: lb.id }, create: { id: lb.id, ...data }, update: data });
      localBodies.push(lb);
    }
  }

  // Categories & services
  const { categories } = load<{ categories: CategorySeed[] }>("services.json");
  const allServiceIds: string[] = [];
  for (const [ci, c] of categories.entries()) {
    const cat = { name: c.name, nameMl: c.nameMl, icon: c.icon, sortOrder: ci };
    await prisma.serviceCategory.upsert({ where: { id: c.id }, create: { id: c.id, ...cat }, update: cat });
    for (const [si, s] of c.services.entries()) {
      const svc = {
        categoryId: c.id, name: s.name, nameMl: s.nameMl, description: s.description,
        inclusions: s.inclusions.join("\n"), durationMins: s.durationMins, sortOrder: si,
      };
      // basePrice is only set on create: admins edit it in /admin/services.
      await prisma.service.upsert({ where: { id: s.id }, create: { id: s.id, basePrice: s.basePrice, ...svc }, update: svc });
      allServiceIds.push(s.id);
    }
  }

  // Availability. Admins manage it in /admin once it exists, so it is only built when
  // empty, or rebuilt from scratch (discarding admin edits) with --reset-availability.
  const reset = process.argv.includes("--reset-availability");
  if (!reset && (await prisma.serviceAvailability.count()) > 0) {
    console.log(
      `Seeded ${districts.length} districts, ${localBodies.length} local bodies, ` +
        `${categories.length} categories, ${allServiceIds.length} services. ` +
        `Availability kept as is (run \`npm run seed -- --reset-availability\` to rebuild it from availability.json).`
    );
    return;
  }

  const av = load<AvailabilitySeed>("availability.json");
  const known = new Set(allServiceIds);
  const check = (ids: string[], where: string) =>
    ids.forEach((id) => { if (!known.has(id)) throw new Error(`Unknown service "${id}" in availability.json (${where})`); });

  await prisma.serviceAvailability.deleteMany({ where: { localBodyId: { in: localBodies.map((l) => l.id) } } });
  const rows: { serviceId: string; localBodyId: string; priceOverride: number | null }[] = [];
  for (const lb of localBodies) {
    let ids: string[];
    if (lb.type === "CORPORATION") ids = allServiceIds;
    else if (lb.type === "MUNICIPALITY") {
      const except = new Set([...av.municipalityExcept, ...(av.municipalityExtraExcept[lb.id] ?? [])]);
      check([...except], lb.id);
      ids = allServiceIds.filter((id) => !except.has(id));
    } else {
      ids = av.panchayats[lb.id] ?? [];
      check(ids, lb.id);
    }
    const prices = av.priceOverrides[lb.id] ?? {};
    for (const serviceId of ids) rows.push({ serviceId, localBodyId: lb.id, priceOverride: prices[serviceId] ?? null });
  }
  await prisma.serviceAvailability.createMany({ data: rows });

  console.log(
    `Seeded ${districts.length} districts, ${localBodies.length} local bodies, ` +
      `${categories.length} categories, ${allServiceIds.length} services, ${rows.length} availability rows.`
  );
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
