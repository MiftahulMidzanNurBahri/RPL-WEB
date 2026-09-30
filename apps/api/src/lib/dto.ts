import type { Item, User } from "@prisma/client";

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
    imageUrl: imagePath ? `/${imagePath.replaceAll("\\", "/")}` : null,
    ...(options.includePrivate ? { additionalInfo } : {}),
    ...(item.reporter ? { reporter: item.reporter } : {}),
    ...(options.isMine === undefined ? {} : { isMine: options.isMine })
  };
}

export function paginationDto(page: number, pageSize: number, total: number) {
  return { page, pageSize, total };
}