export function getDriveImageUrl(
  source?: string | null
): string {
  const value =
    String(
      source || ""
    ).trim();

  if (!value) {
    return "";
  }

  if (
    value.startsWith(
      "/api/drive-image"
    )
  ) {
    return value;
  }

  const isGoogleDrive =
    value.includes(
      "drive.google.com"
    ) ||
    value.includes(
      "googleusercontent.com"
    );

  if (!isGoogleDrive) {
    return value;
  }

  return (
    "/api/drive-image?src=" +
    encodeURIComponent(value)
  );
}