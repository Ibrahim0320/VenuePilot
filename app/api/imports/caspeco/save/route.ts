import { NextResponse } from "next/server";
import { saveCaspecoImport } from "@/lib/imports/caspeco-save";
import type { CaspecoImportResult } from "@/lib/imports/caspeco-types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { parsed?: CaspecoImportResult };

    if (!body.parsed) {
      return NextResponse.json(
        { error: "Preview an import before saving it." },
        { status: 400 }
      );
    }

    const summary = await saveCaspecoImport(body.parsed);

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save the Caspeco import."
      },
      { status: 400 }
    );
  }
}
