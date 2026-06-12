"use client";

import "./profile-avatar.css";
import Image from "next/image";
import type { ReactNode } from "react";

type ProfileAvatarProps = {
  initials: string;
  imageUrl: string | null;
  size?: "profile" | "sidebar";
  children?: ReactNode;
  className?: string;
};

export function ProfileAvatar({
  initials,
  imageUrl,
  size = "profile",
  children,
  className = "",
}: ProfileAvatarProps) {
  const sizeClass =
    size === "sidebar" ? "dashboard-avatar--sidebar" : "dashboard-avatar--profile";

  return (
    <div className={`dashboard-avatar ${sizeClass} ${className}`.trim()}>
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={size === "sidebar" ? "32px" : "56px"}
          className="dashboard-avatar-image"
          unoptimized
        />
      ) : (
        <span className="dashboard-avatar-initials" aria-hidden>
          {initials}
        </span>
      )}
      {children}
    </div>
  );
}
