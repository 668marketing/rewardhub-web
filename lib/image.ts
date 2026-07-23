export function getGoogleDriveFileId(
  value: string
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  const lh3Match =
    url.match(
      /googleusercontent\.com\/d\/([^=/?#]+)/
    );

  if (lh3Match?.[1]) {
    return decodeURIComponent(
      lh3Match[1]
    );
  }

  const queryMatch =
    url.match(
      /[?&]id=([^&#]+)/
    );

  if (queryMatch?.[1]) {
    return decodeURIComponent(
      queryMatch[1]
    );
  }

  const pathMatch =
    url.match(
      /\/d\/([^/?#]+)/
    );

  if (pathMatch?.[1]) {
    return decodeURIComponent(
      pathMatch[1]
    );
  }

  return "";
}

export function getImageUrl(
  value: string,
  width = 1600
) {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  if (
    url.startsWith("blob:") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  const isGoogleImage =
    url.includes(
      "drive.google.com"
    ) ||
    url.includes(
      "docs.google.com"
    ) ||
    url.includes(
      "googleusercontent.com"
    );

  if (!isGoogleImage) {
    return url;
  }

  const fileId =
    getGoogleDriveFileId(
      url
    );

  if (!fileId) {
    return url;
  }

  const safeWidth =
    Number.isFinite(width) &&
    width > 0
      ? Math.round(width)
      : 1600;

  /*
   * Convert every supported Google Drive URL to Google's image CDN.
   * This also repairs old thumbnail/uc/view links automatically.
   */
  return (
    "https://lh3.googleusercontent.com/d/" +
    `${encodeURIComponent(fileId)}=w${safeWidth}`
  );
}
