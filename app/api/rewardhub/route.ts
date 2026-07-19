const API_URL = "https://script.google.com/macros/s/AKfycbwZukKlv976yMLEA3Ap-_h6z4pyD8fTHzgpwHZlxAPGjfAjFYxRB6VdJXDK_zTJZmLs/exec";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8",
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();

console.log(text);

return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.log("LOCAL API ERROR:", error);

    return Response.json({
      success: false,
      message: "Local API error",
      details: error.message,
    });
  }
}