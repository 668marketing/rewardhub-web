import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const fileId = request.nextUrl.searchParams.get("id");

    if (!fileId) {
      return NextResponse.json(
        { error: "Missing file id" },
        { status: 400 }
      );
    }

    const imageResult = await fetchDriveImage(fileId);

    if (!imageResult) {
      return NextResponse.json(
        {
          error:
            "Google Drive did not return an image. Please check the file permission.",
        },
        { status: 502 }
      );
    }

    return new NextResponse(imageResult.buffer, {
      status: 200,
      headers: {
        "Content-Type": imageResult.contentType,
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("DRIVE IMAGE ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image proxy failed",
      },
      { status: 500 }
    );
  }
}

async function fetchDriveImage(fileId: string): Promise<{
  buffer: ArrayBuffer;
  contentType: string;
} | null> {
  const urls = [
    // 保留你原本的方法，避免旧 Logo、Banner、Receipt 受到影响
    `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
      fileId
    )}`,

    // 如果上面回 HTML，再尝试 thumbnail
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(
      fileId
    )}&sz=w1600`,

    // 最后再尝试 view 格式
    `https://drive.google.com/uc?export=view&id=${encodeURIComponent(
      fileId
    )}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        redirect: "follow",
        cache: "no-store",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/149 Safari/537.36",
          Accept:
            "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        console.warn(
          "Drive image request failed:",
          response.status,
          url
        );
        continue;
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.toLowerCase().startsWith("image/")) {
        console.warn(
          "Drive returned non-image content:",
          contentType,
          url
        );
        continue;
      }

      const buffer = await response.arrayBuffer();

      if (!buffer.byteLength) {
        console.warn("Drive returned empty image:", url);
        continue;
      }

      return {
        buffer,
        contentType,
      };
    } catch (error) {
      console.warn("Drive image fetch failed:", url, error);
    }
  }

  return null;
}