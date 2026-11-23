import type { Item, User } from "../generated/prisma/client.js";
import { getItemImagePublicUrl } from "./storage.js";

type PublicReporter = Pick<User, "id" | "name" | "avatarInitials">;

export function userDto(user: User) {
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return safeUser;
}

export function itemDto(
  item: Item & { reporter?: PublicReporter },
  options: { isMine?: boolean; includePrivate?: boolean } = {}
) {
  const { additionalInfo, imagePath, reporterId: _reporterId, ...publicFields } = item;

  return {
    ...publicFields,
    imageUrl: getItemImagePublicUrl(imagePath),
    ...(options.includePrivate ? { additionalInfo } : {}),
    ...(item.reporter ? { reporter: item.reporter } : {}),
    ...(options.isMine === undefined ? {} : { isMine: options.isMine })
  };
}

export function paginationDto(page: number, pageSize: number, total: number) {
  return { page, pageSize, total };
}

export function maskEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "";
  const [local, domain] = email.split("@");
  if (!local) return "";
  const maskedLocal = local.length <= 2 ? `${local[0]}***` : `${local[0]}***${local[local.length - 1]}`;
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return "****";
  const start = cleaned.slice(0, 4);
  const end = cleaned.slice(-4);
  return `${start}****${end}`;
}

export function maskStudentNumber(nim: string | null | undefined): string {
  if (!nim) return "";
  const cleaned = nim.trim();
  if (cleaned.length <= 4) return "****";
  const start = cleaned.slice(0, 4);
  const end = cleaned.slice(-3);
  return `${start}****${end}`;
}
