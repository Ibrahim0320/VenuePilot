import { NextResponse } from "next/server";
import { parseCaspecoWorkbook } from "@/lib/imports/caspeco-parser";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a Caspeco Excel file before previewing." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = await parseCaspecoWorkbook(buffer, file.name);

    return NextResponse.json({ parsed });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not parse the uploaded Caspeco file."
      },
      { status: 400 }
    );
  }
}
