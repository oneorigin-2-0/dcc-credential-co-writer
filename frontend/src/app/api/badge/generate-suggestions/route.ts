import { NextRequest, NextResponse } from "next/server";
import type { BadgeGenerationResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || content.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: "Content must be at least 50 characters long",
        },
        { status: 400 }
      );
    }

    // TODO: Replace with actual REST API calls
    // For now, return mock data
    const mockResult: BadgeGenerationResult = {
      title: `Badge for: ${content.substring(0, 30)}...`,
      description: `This badge recognizes completion of content related to: ${content.substring(
        0,
        50
      )}...`,
      criteria: `Successfully demonstrate understanding of the key concepts presented in the provided content.`,
      image: "https://via.placeholder.com/200x200/008080/FFFFFF?text=Badge",
    };

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json({
      success: true,
      data: mockResult,
    });
  } catch (error) {
    console.error("Error generating suggestions:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "An error occurred while generating suggestions. Please try again.",
      },
      { status: 500 }
    );
  }
}
