import { NextRequest, NextResponse } from "next/server";

import { envoyerDigestsEvenements } from "@/lib/digestEvenements";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Non autorisé.", { status: 401 });
  }

  const resultat = await envoyerDigestsEvenements();

  return NextResponse.json(resultat);
}
