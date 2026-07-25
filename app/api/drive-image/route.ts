import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic =
  "force-dynamic";

function extractDriveFileId(
  value: string
): string {
  const source = String(
    value || ""
  ).trim();

  if (!source) {
    return "";
  }

  if (
    /^[a-zA-Z0-9_-]{10,}$/.test(
      source
    )
  ) {
    return source;
  }

  const patterns = [
    /[?&]id=([^&#]+)/i,
    /\/d\/([^/]+)/i,
    /googleusercontent\.com\/d\/([^/?#]+)/i,
  ];

  for (
    const pattern of patterns
  ) {
    const match =
      source.match(pattern);

    if (match?.[1]) {
      return decodeURIComponent(
        match[1]
      );
    }
  }

  return "";
}

export async function GET(
  request: NextRequest
) {
  try {
    const directId =
      String(
        request.nextUrl.searchParams.get(
          "id"
        ) || ""
      ).trim();

    const source =
      String(
        request.nextUrl.searchParams.get(
          "src"
        ) || ""
      ).trim();

    const fileId =
      directId ||
      extractDriveFileId(
        source
      );

    if (!fileId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Drive file ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !/^[a-zA-Z0-9_-]+$/.test(
        fileId
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid Google Drive file ID.",
        },
        {
          status: 400,
        }
      );
    }

    const candidateUrls = [
      `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
        fileId
      )}`,
      `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
        fileId
      )}`,
      `https://drive.google.com/thumbnail?id=${encodeURIComponent(
        fileId
      )}&sz=w1600`,
    ];

    let lastError =
      "Unable to load Drive image.";

    for (
      const candidateUrl of
      candidateUrls
    ) {
      try {
        const driveResponse =
          await fetch(
            candidateUrl,
            {
              method: "GET",
              cache: "no-store",
              redirect:
                "follow",
              headers: {
                "User-Agent":
                  "Mozilla/5.0",
              },
            }
          );

        if (
          !driveResponse.ok
        ) {
          lastError =
            `Google Drive returned ${driveResponse.status}.`;
          continue;
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
          lastError =
            "Google Drive did not return an image.";
          continue;
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
      } catch (candidateError) {
        lastError =
          candidateError instanceof Error
            ? candidateError.message
            : "Unable to load Drive image.";
      }
    }

    throw new Error(
      lastError
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
        status: 502,
      }
    );
  }
}