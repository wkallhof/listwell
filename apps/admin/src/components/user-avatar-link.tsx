"use client";

import Link from "next/link";

interface UserAvatarLinkProps {
  name: string | null;
  image: string | null;
}

export function UserAvatarLink({ name, image }: UserAvatarLinkProps) {
  const initial = name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <Link
      href="/preferences"
      className="flex h-11 w-11 items-center justify-center"
      aria-label="Preferences"
    >
      {image ? (
        <img
          src={image}
          alt={name ?? "User"}
          className="h-8 w-8 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
          {initial}
        </span>
      )}
    </Link>
  );
}
