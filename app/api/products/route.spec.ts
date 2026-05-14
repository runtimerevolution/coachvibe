import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mocks = vi.hoisted(() => ({
  requireAuthMock: vi.fn(),
  productFindManyMock: vi.fn(),
  productCreateMock: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  requireAuth: mocks.requireAuthMock,
}));

vi.mock("@/lib/db", () => ({
  default: {
    product: {
      findMany: mocks.productFindManyMock,
      create: mocks.productCreateMock,
    },
  },
}));

function jsonRequest(body: unknown): NextRequest {
  return new Request("https://example.com", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const getReq = new Request("https://example.com") as unknown as NextRequest;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAuthMock.mockReturnValue("coach_test_id");
});

describe("GET /api/products", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await GET(getReq);
    expect(response.status).toBe(401);
  });

  it("returns only products belonging to the authenticated coach", async () => {
    const products = [
      { id: "prod_1", name: "Reset Sprint", type: "lead_magnet", price: 0, landingPage: null },
      { id: "prod_2", name: "Coaching Program", type: "full_course", price: 997, landingPage: { published: true } },
    ];
    mocks.productFindManyMock.mockResolvedValueOnce(products);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.products).toHaveLength(2);
    expect(mocks.productFindManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { coachId: "coach_test_id" },
      })
    );
  });

  it("returns an empty array when the coach has no products", async () => {
    mocks.productFindManyMock.mockResolvedValueOnce([]);

    const response = await GET(getReq);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.products).toEqual([]);
  });
});

describe("POST /api/products", () => {
  it("returns 401 when unauthenticated", async () => {
    mocks.requireAuthMock.mockReturnValue(null);

    const response = await POST(jsonRequest({ name: "New Product" }));
    expect(response.status).toBe(401);
  });

  it("creates a product with the authenticated coachId", async () => {
    mocks.productCreateMock.mockResolvedValueOnce({
      id: "prod_new",
      coachId: "coach_test_id",
      name: "My Program",
      description: "A great program",
      price: 0,
      type: "lead_magnet",
      modules: [],
      embedScript: "",
    });

    const response = await POST(
      jsonRequest({ name: "My Program", description: "A great program", type: "lead_magnet" })
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(mocks.productCreateMock).toHaveBeenCalledWith({
      data: expect.objectContaining({
        coachId: "coach_test_id",
        name: "My Program",
      }),
    });
  });

  it("returns 400 when name is missing", async () => {
    const response = await POST(jsonRequest({ description: "No name" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
  });
});
