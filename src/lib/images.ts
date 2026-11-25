import { UserFacingError } from "./errors";
export function validateImage(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new UserFacingError("Selecciona JPG, PNG o WebP.");
  if (file.size > 2 * 1024 * 1024)
    throw new UserFacingError("La imagen debe pesar como máximo 2 MB.");
}
