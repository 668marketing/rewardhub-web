import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractDriveFileId(
  value: string
): string {
  const url = String(
    value || ""
  ).trim();

  if (!url) {
    return "";
  }

  const patterns = [
    /[?&]id=([^&#]+)/i,
    /\/d\/([^/]+)/i,
    /googleusercontent\.com\/d\/([^/?#]+)/i,
  ];

  for (const pattern of patterns) {
    const match =
      url.match(pattern);

    if (
      match?.[1]
    ) {
      return decodeURIComponent(
        match[1]
      );
    }
  }

  if (
    /^[a-zA-Z0-9_-]{20,}$/.test(
      url
    )
  ) {
    return url;
  }

  return "";
}

export async function GET(
  request: NextRequest
) {
  try {
    const source =
      request.nextUrl.searchParams.get(
        "src"
      ) || "";

    const fileId =
      extractDriveFileId(
        source
      );

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Google Drive image URL.",
        },
        {
          status: 400,
        }
      );
    }

    const downloadUrl =
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
        fileId
      )}`;

    const driveResponse =
      await fetch(
        downloadUrl,
        {
          method: "GET",
          cache: "no-store",
          redirect: "follow",
          headers: {
            "User-Agent":
              "Mozilla/5.0",
          },
        }
      );

    if (!driveResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            `Unable to load Drive image (${driveResponse.status}).`,
        },
        {
          status: 502,
        }
      );
    }

    const contentType =
      driveResponse.headers.get(
        "content-type"
      ) || "";

    if (
      !contentType.startsWith(
        "image/"
      )
    ) {
      const responseText =
        await driveResponse.text();

      console.error(
        "Drive returned non-image:",
        responseText.slice(
          0,
          500
        )
      );

      return NextResponse.json(
        {
          success: false,
          error:
            "Google Drive did not return an image. Check the file sharing permission.",
        },
        {
          status: 502,
        }
      );
    }

    const imageBuffer =
      await driveResponse.arrayBuffer();

    return new NextResponse(
      imageBuffer,
      {
        status: 200,
        headers: {
          "Content-Type":
            contentType,

          "Cache-Control":
            "public, max-age=3600, stale-while-revalidate=86400",

          "Content-Disposition":
            "inline",
        },
      }
    );
  } catch (error) {
    console.error(
      "Drive image proxy error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load image.",
      },
      {
        status: 500,
      }
    );
  }
}